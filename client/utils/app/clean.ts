import { Conversation } from '@/types/chat';
import { DEFAULT_SYSTEM_PROMPT } from './const';

export const cleanSelectedConversation = (conversation: Conversation) => {
  let updatedConversation = conversation;

  if (!updatedConversation.prompt) {
    updatedConversation = {
      ...updatedConversation,
      prompt: updatedConversation.prompt || DEFAULT_SYSTEM_PROMPT,
    };
  }

  if (!updatedConversation.folderId) {
    updatedConversation = {
      ...updatedConversation,
      folderId: updatedConversation.folderId || null,
    };
  }

  return updatedConversation;
};

export const cleanConversationHistory = (history: unknown[]): Conversation[] => {
  if (!Array.isArray(history)) {
    console.warn('history is not an array. Returning an empty array.');
    return [];
  }

  return history.reduce((acc: Conversation[], conversation: Conversation) => {
    try {
      if (!conversation.prompt) {
        conversation.prompt = DEFAULT_SYSTEM_PROMPT;
      }

      if (!conversation.folderId) {
        conversation.folderId = null;
      }

      acc.push(conversation);
      return acc;
    } catch (error) {
      console.warn(
        `error while cleaning conversations' history. Removing culprit`,
        error,
      );
    }
    return acc;
  }, []);
};
