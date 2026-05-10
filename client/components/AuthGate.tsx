import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api from '@/utils/api';

/** Ensures session cookie is valid before showing app routes (except `/login`). */
export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;

    if (router.pathname === '/login') {
      setReady(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await api.get('/conversations');
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) {
          await router.replace('/login');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, router.pathname, router]);

  if (!router.isReady || (!ready && router.pathname !== '/login')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 text-sm">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
