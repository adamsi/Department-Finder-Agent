export const DEFAULT_SYSTEM_PROMPT =
  process.env.DEFAULT_SYSTEM_PROMPT ||
  'You are a helpful assistant for finding the right department. Use available context when answering. Respond using markdown.';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : '/api');
