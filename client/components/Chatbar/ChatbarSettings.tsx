import { IconMoon, IconSun, IconUpload } from '@tabler/icons-react';
import { FC } from 'react';
import { SidebarButton } from '../Sidebar/SidebarButton';
import { ClearConversations } from './ClearConversations';
import { useAppDispatch } from '@/store/hooks';
import { setLastVisitedChatId } from '@/store/slices/chatMemorySlice';
import { useRouter } from 'next/router';
import { Conversation } from '@/types/chat';

interface Props {
  lightMode: 'light' | 'dark';
  conversationsCount: number;
  selectedConversation?: Conversation;
  onToggleLightMode: (mode: 'light' | 'dark') => void;
  onClearConversations: () => void;
}

export const ChatbarSettings: FC<Props> = ({
  lightMode,
  conversationsCount,
  selectedConversation,
  onToggleLightMode,
  onClearConversations,
}) => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  return (
    <div
      className={`flex flex-col items-center space-y-2 border-t pt-4 text-sm ${
        lightMode === 'light' ? 'border-gray-200' : 'border-white/10'
      }`}
    >
      <div className="w-full min-h-[40px]">
        {conversationsCount > 0 && (
          <ClearConversations onClearConversations={onClearConversations} lightMode={lightMode} />
        )}
      </div>

      <SidebarButton
        text={lightMode === 'light' ? 'Dark mode' : 'Light mode'}
        icon={lightMode === 'light' ? <IconMoon size={18} /> : <IconSun size={18} />}
        onClick={() => onToggleLightMode(lightMode === 'light' ? 'dark' : 'light')}
        lightMode={lightMode}
      />

      <SidebarButton
        text="Upload documents"
        icon={<IconUpload size={18} />}
        onClick={() => {
          dispatch(setLastVisitedChatId(selectedConversation?.chatId || null));
          router.push('/upload');
        }}
        lightMode={lightMode}
      />
    </div>
  );
};
