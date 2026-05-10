import { ReactNode, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import api from '@/utils/api';

/**
 * Ensures session cookie is valid before showing app routes (except `/login`).
 *
 * Do not gate the first paint on `router.isReady`: SSR uses `isReady === false`
 * while the client often hydrates with `isReady === true`, so the server can
 * render "Loading…" and the client the login form — a hydration mismatch.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  /** After a successful session check, skip re-fetching on in-app route changes. */
  const authOkRef = useRef(false);
  const checkSeqRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (router.pathname === '/login') {
      authOkRef.current = false;
      setReady(true);
      return;
    }

    if (authOkRef.current) {
      setReady(true);
      return;
    }

    const seq = ++checkSeqRef.current;
    let cancelled = false;

    void (async () => {
      try {
        await api.get('/conversations');
        if (cancelled || seq !== checkSeqRef.current) return;
        authOkRef.current = true;
        setReady(true);
      } catch {
        if (cancelled || seq !== checkSeqRef.current) return;
        authOkRef.current = false;
        await router.replace('/login');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mounted, router.pathname, router]);

  if (!mounted) {
    return <>{children}</>;
  }

  if (router.pathname === '/login') {
    return <>{children}</>;
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 text-sm">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
