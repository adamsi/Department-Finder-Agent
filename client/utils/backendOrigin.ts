/** Base URL for the FastAPI backend (no trailing slash). */
export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:8080';
  }
  return '/api';
}

/** WebSocket origin (ws: / wss:) matching the API host. */
export function getWsBaseUrl(): string {
  const base = getApiBaseUrl();
  if (base.startsWith('/')) {
    if (typeof window === 'undefined') {
      return 'ws://localhost:8080';
    }
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${window.location.host}`;
  }
  if (base.startsWith('https://')) {
    return `wss://${base.slice('https://'.length)}`;
  }
  return `ws://${base.replace(/^http:\/\//, '')}`;
}

/** Build a WebSocket URL by reusing the API host and any public path prefix such as `/api`. */
export function buildWsUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBaseUrl();

  if (base.startsWith('/')) {
    if (typeof window === 'undefined') {
      return `ws://localhost:8080${normalizedPath}`;
    }
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${window.location.host}${base}${normalizedPath}`;
  }

  const url = new URL(base);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = `${url.pathname.replace(/\/$/, '')}${normalizedPath}`;
  url.search = '';
  url.hash = '';
  return url.toString();
}
