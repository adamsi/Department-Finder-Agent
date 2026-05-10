import { getWsBaseUrl } from '@/utils/backendOrigin';

export type ChatSocketHandlers = {
  onChunk: (text: string) => void;
  /** Called when the socket closes (user stop, error, or disconnect). */
  onSocketClosed: () => void;
  onError: () => void;
};

/**
 * Native WebSocket: matches FastAPI `/ws/chat/{conversation_id}` (text in / text out).
 * Cookies are sent automatically for same-site requests to the API host.
 */
export function createChatSocket(
  conversationId: string,
  userMessage: string,
  handlers: ChatSocketHandlers
): WebSocket {
  const url = `${getWsBaseUrl()}/ws/chat/${encodeURIComponent(conversationId)}`;
  const ws = new WebSocket(url);

  ws.onopen = () => {
    ws.send(userMessage);
  };

  ws.onmessage = (ev) => {
    if (typeof ev.data === 'string' && ev.data.length > 0) {
      handlers.onChunk(ev.data);
    }
  };

  ws.onerror = () => {
    handlers.onError();
  };

  ws.onclose = () => {
    handlers.onSocketClosed();
  };

  return ws;
}
