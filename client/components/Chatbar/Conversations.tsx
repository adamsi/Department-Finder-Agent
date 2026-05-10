import { Conversation } from '@/types/chat';
import { KeyValuePair } from '@/types/data';
import { FC } from 'react';
import { ConversationComponent } from './Conversation';

interface Props {
  loading: boolean;
  conversations: Conversation[];
  selectedConversation: Conversation;
  deletingChatId?: string | null;
  onSelectConversation: (conversation: Conversation) => void;
  onDeleteConversation: (conversation: Conversation) => void;
  onUpdateConversation: (
    conversation: Conversation,
    data: KeyValuePair,
  ) => void;
  lightMode?: 'light' | 'dark';
}

export const Conversations: FC<Props> = ({
  loading,
  conversations,
  selectedConversation,
  deletingChatId = null,
  onSelectConversation,
  onDeleteConversation,
  onUpdateConversation,
  lightMode = 'dark',
}) => {
  return (
    <div className="flex w-full flex-col gap-1">
      {conversations
        .slice()
        .reverse()
        .map((conversation, index) => (
          <ConversationComponent
            key={conversation.chatId ?? `idx-${index}`}
            selectedConversation={selectedConversation}
            conversation={conversation}
            loading={loading}
            deleteInProgress={
              !!conversation.chatId && conversation.chatId === deletingChatId
            }
            onSelectConversation={onSelectConversation}
            onDeleteConversation={onDeleteConversation}
            onUpdateConversation={onUpdateConversation}
            lightMode={lightMode}
          />
        ))}
    </div>
  );
};
