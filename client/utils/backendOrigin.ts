/** Base URL for the FastAPI backend (no trailing slash). */
export function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');
}

/** WebSocket origin (ws: / wss:) matching the API host. */
export function getWsBaseUrl(): string {
  const base = getApiBaseUrl();
  if (base.startsWith('/')) {
    if (typeof window === 'undefined') {
      return 'ws://localhost:8080/ws';
    }
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${window.location.host}/ws`;
  }
  if (base.startsWith('https://')) {
    return `wss://${base.slice('https://'.length)}/ws`;
  }
  return `ws://${base.replace(/^http:\/\//, '')}/ws`;
}
