import { useRef, useState, useCallback } from 'react';
import { Conversation, Message } from '@/types/chat';
import { createChatSocket } from '@/utils/chatWebSocket';
import api from '@/utils/api';
import toast from 'react-hot-toast';

interface UseChatStreamingOptions {
  onStreamUpdate: (conversation: Conversation) => void;
  onMetadata?: (metadata: { chatId: string; description: string }) => void;
  onStreamComplete?: () => void;
}

const IDLE_MS = 500;

/**
 * Streams assistant replies over the backend's plain WebSocket.
 * New chats: POST /conversations first (creates id + title), then send the user message on the socket.
 */
export const useChatStreaming = (options: UseChatStreamingOptions) => {
  const { onStreamUpdate, onMetadata, onStreamComplete } = options;
  const [messageIsStreaming, setMessageIsStreaming] = useState(false);
  const stopConversationRef = useRef<boolean>(false);
  const finalizeStreamRef = useRef<(() => void) | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const currentConversationRef = useRef<Conversation | null>(null);

  const handleStop = useCallback(() => {
    stopConversationRef.current = true;
    socketRef.current?.close();
    socketRef.current = null;
    if (finalizeStreamRef.current) {
      finalizeStreamRef.current();
    } else {
      setMessageIsStreaming(false);
    }
    setTimeout(() => {
      stopConversationRef.current = false;
    }, 500);
  }, []);

  const sendMessage = useCallback(
    async (conversation: Conversation, message: Message, deleteCount = 0) => {
      if (!conversation) return;

      const updatedMessages = deleteCount
        ? [...conversation.messages.slice(0, -deleteCount), message]
        : [...conversation.messages, message];

      const updatedConversation: Conversation = {
        ...conversation,
        messages: updatedMessages,
      };

      currentConversationRef.current = updatedConversation;
      onStreamUpdate(updatedConversation);
      setMessageIsStreaming(true);

      let assistantMessage: Message = { role: 'assistant', content: '' };
      let isFirstChunk = true;
      let completionTimer: ReturnType<typeof setTimeout> | null = null;
      let receivedChatId: string | undefined = updatedConversation.chatId;
      let finalized = false;

      const finalizeStream = () => {
        if (finalized) return;
        finalized = true;
        if (completionTimer) {
          clearTimeout(completionTimer);
          completionTimer = null;
        }
        socketRef.current = null;
        setMessageIsStreaming(false);
        if (currentConversationRef.current) {
          const finalConversation = {
            ...currentConversationRef.current,
            chatId: receivedChatId ?? currentConversationRef.current.chatId,
          };
          currentConversationRef.current = finalConversation;
          onStreamUpdate(finalConversation);
        }
        onStreamComplete?.();
        finalizeStreamRef.current = null;
      };

      finalizeStreamRef.current = finalizeStream;

      const bumpIdleDone = () => {
        if (finalized) return;
        if (completionTimer) clearTimeout(completionTimer);
        completionTimer = setTimeout(finalizeStream, IDLE_MS);
      };

      const streamHandler = (chunk: string) => {
        if (stopConversationRef.current || !currentConversationRef.current) {
          socketRef.current?.close();
          finalizeStream();
          return;
        }
        bumpIdleDone();

        let updated: Conversation;
        if (isFirstChunk) {
          isFirstChunk = false;
          assistantMessage = { role: 'assistant', content: chunk };
          updated = {
            ...currentConversationRef.current,
            messages: [...currentConversationRef.current.messages, assistantMessage],
          };
        } else {
          assistantMessage = { ...assistantMessage, content: assistantMessage.content + chunk };
          updated = {
            ...currentConversationRef.current,
            messages: currentConversationRef.current.messages.map((msg, index) =>
              index === currentConversationRef.current!.messages.length - 1 ? assistantMessage : msg
            ),
          };
        }

        currentConversationRef.current = updated;
        onStreamUpdate(updated);
      };

      try {
        const isNewConversation = !updatedConversation.chatId && updatedConversation.messages.length === 1;

        let chatId = updatedConversation.chatId;

        if (isNewConversation) {
          const { data } = await api.post<{ chatId: string; description: string }>('/conversations', {
            message: message.content,
          });
          receivedChatId = data.chatId;
          chatId = data.chatId;
          onMetadata?.(data);

          const withId: Conversation = {
            ...updatedConversation,
            id: data.chatId,
            chatId: data.chatId,
            name: data.description,
          };
          currentConversationRef.current = withId;
          onStreamUpdate(withId);
        }

        if (!chatId) {
          toast.error('Chat ID is missing.');
          setMessageIsStreaming(false);
          return;
        }

        socketRef.current?.close();
        socketRef.current = createChatSocket(chatId, message.content, {
          onChunk: streamHandler,
          onError: () => {
            toast.error('Connection error. Please try again.');
            finalizeStream();
          },
          onSocketClosed: () => {
            if (stopConversationRef.current) return;
            bumpIdleDone();
          },
        });
      } catch (error) {
        console.error('Failed to send message:', error);
        toast.error('Failed to send message. Please try again.');
        setMessageIsStreaming(false);
      }
    },
    [onStreamUpdate, onMetadata, onStreamComplete]
  );

  return {
    sendMessage,
    handleStop,
    messageIsStreaming,
    stopConversationRef,
  };
};
