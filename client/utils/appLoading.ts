type LoadingKey = 'auth' | 'route';

const active = new Set<LoadingKey>();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function setAppLoading(key: LoadingKey, on: boolean) {
  if (on) active.add(key);
  else active.delete(key);
  notify();
}

export function isAppLoading() {
  return active.size > 0;
}

export function subscribeAppLoading(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
