import { ReactNode, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch } from '@/store/hooks';
import { fetchAllChats } from '@/store/slices/chatMemorySlice';
import { fetchRootFolder } from '@/store/slices/uploadSlice';

/**
 * Session guard for non-login routes: validates cookie in the background and
 * redirects to `/login` on failure. Does not block UI — chats and documents
 * fill Redux when requests complete.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [mounted, setMounted] = useState(false);
  const authOkRef = useRef(false);
  const checkSeqRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (router.pathname === '/login') {
      authOkRef.current = false;
      return;
    }

    if (authOkRef.current) {
      return;
    }

    const seq = ++checkSeqRef.current;
    let cancelled = false;

    void dispatch(fetchRootFolder()).unwrap().catch(() => undefined);
    void dispatch(fetchAllChats())
      .unwrap()
      .then(() => {
        if (cancelled || seq !== checkSeqRef.current) return;
        authOkRef.current = true;
      })
      .catch(async () => {
        if (cancelled || seq !== checkSeqRef.current) return;
        authOkRef.current = false;
        await router.replace('/login');
      });

    return () => {
      cancelled = true;
    };
  }, [mounted, router.pathname, router, dispatch]);

  return <>{children}</>;
}
