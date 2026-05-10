import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api, handleAxiosError } from '@/utils/api';
import { ChatMetadata, ChatMessage } from '@/types/chat';

interface ChatMemoryState {
  chats: ChatMetadata[];
  chatMessages: Record<string, ChatMessage[]>; // chatId -> messages
  lastVisitedChatId: string | null;
  loading: boolean;
  error: string | null;
  /** Chat id currently being deleted (API in flight). */
  deletingChatId: string | null;
}

const initialState: ChatMemoryState = {
  chats: [],
  chatMessages: {},
  lastVisitedChatId: null,
  loading: false,
  error: null,
  deletingChatId: null,
};

type ConversationRow = { conversation_id: string; description: string | null };
type MessageRow = { content: string; role: string };

function mapApiMessage(m: MessageRow): ChatMessage {
  const role = m.role?.toLowerCase();
  const type: ChatMessage['type'] = role === 'human' || role === 'user' ? 'USER' : 'ASSISTANT';
  return { content: m.content, type };
}

export const fetchAllChats = createAsyncThunk(
  'chatMemory/fetchAllChats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ConversationRow[]>('/conversations');
      const rows = response.data;
      return rows.map((r) => ({
        chatId: r.conversation_id,
        description: r.description ?? '',
      }));
    } catch (error) {
      return rejectWithValue(handleAxiosError(error));
    }
  }
);

export const fetchChatMessages = createAsyncThunk(
  'chatMemory/fetchChatMessages',
  async (chatId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<MessageRow[]>(`/conversations/${encodeURIComponent(chatId)}`);
      const messages = response.data.map(mapApiMessage);
      return { chatId, messages };
    } catch (error) {
      return rejectWithValue(handleAxiosError(error));
    }
  }
);

export const deleteChat = createAsyncThunk(
  'chatMemory/deleteChat',
  async (chatId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/conversations/${encodeURIComponent(chatId)}`);
      return chatId;
    } catch (error) {
      return rejectWithValue(handleAxiosError(error));
    }
  }
);

const chatMemorySlice = createSlice({
  name: 'chatMemory',
  initialState,
  reducers: {
    addChat: (state, action: PayloadAction<ChatMetadata>) => {
      const exists = state.chats.some(chat => chat.chatId === action.payload.chatId);
      if (!exists) {
        state.chats.unshift(action.payload);
      }
    },
    updateChatDescription: (state, action: PayloadAction<{ chatId: string; description: string }>) => {
      const chat = state.chats.find(chat => chat.chatId === action.payload.chatId);
      if (chat) {
        chat.description = action.payload.description;
      }
    },
    addMessageToChat: (state, action: PayloadAction<{ chatId: string; message: ChatMessage }>) => {
      if (!state.chatMessages[action.payload.chatId]) {
        state.chatMessages[action.payload.chatId] = [];
      }
      state.chatMessages[action.payload.chatId].push(action.payload.message);
    },
    setChatMessages: (state, action: PayloadAction<{ chatId: string; messages: ChatMessage[] }>) => {
      state.chatMessages[action.payload.chatId] = action.payload.messages;
    },
    clearChatMessages: (state, action: PayloadAction<string>) => {
      delete state.chatMessages[action.payload];
    },
    setLastVisitedChatId: (state, action: PayloadAction<string | null>) => {
      state.lastVisitedChatId = action.payload;
    },
    clearAllChats: (state) => {
      state.chats = [];
      state.chatMessages = {};
      state.lastVisitedChatId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllChats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllChats.fulfilled, (state, action) => {
        state.loading = false;
        state.chats = action.payload;
      })
      .addCase(fetchAllChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchChatMessages.fulfilled, (state, action) => {
        state.chatMessages[action.payload.chatId] = action.payload.messages;
      })
      .addCase(deleteChat.pending, (state, action) => {
        state.deletingChatId = action.meta.arg;
      })
      .addCase(deleteChat.fulfilled, (state, action) => {
        state.deletingChatId = null;
        state.chats = state.chats.filter(chat => chat.chatId !== action.payload);
        delete state.chatMessages[action.payload];
      })
      .addCase(deleteChat.rejected, (state) => {
        state.deletingChatId = null;
      });
  },
});

export const { addChat, updateChatDescription, addMessageToChat, setChatMessages, clearChatMessages, setLastVisitedChatId, clearAllChats } = chatMemorySlice.actions;
export default chatMemorySlice.reducer;

