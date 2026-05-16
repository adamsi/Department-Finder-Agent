import { ReactNode, useEffect, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';
import { useRouter } from 'next/router';
import { useAppDispatch } from '@/store/hooks';
import { fetchAllChats } from '@/store/slices/chatMemorySlice';
import { fetchRootFolder } from '@/store/slices/uploadSlice';
import { setAppLoading } from '@/utils/appLoading';
import {
  clearAuthSession,
  isAuthSessionValid,
  setAuthSessionValid,
} from '@/utils/authSession';

/**
 * Session guard: blocks UI until auth is resolved; loading overlay is global.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isLogin = router.pathname === '/login';
  const [ready, setReady] = useState(false);
  const checkSeqRef = useRef(0);

  useIsomorphicLayoutEffect(() => {
    if (isLogin) {
      setAppLoading('auth', false);
      return;
    }
    setAppLoading('auth', !ready);
    return () => setAppLoading('auth', false);
  }, [ready, isLogin]);

  useEffect(() => {
    if (isLogin) {
      if (isAuthSessionValid()) {
        void router.replace('/');
      } else {
        setReady(true);
      }
      return;
    }

    if (isAuthSessionValid()) {
      setReady(true);
      return;
    }

    setReady(false);
    const seq = ++checkSeqRef.current;
    let cancelled = false;

    void dispatch(fetchAllChats())
      .unwrap()
      .then(() => {
        if (cancelled || seq !== checkSeqRef.current) return;
        setAuthSessionValid(true);
        void dispatch(fetchRootFolder()).unwrap().catch(() => undefined);
        setReady(true);
      })
      .catch(async () => {
        if (cancelled || seq !== checkSeqRef.current) return;
        clearAuthSession();
        setReady(true);
        await router.replace('/login');
      });

    return () => {
      cancelled = true;
    };
  }, [isLogin, router, dispatch]);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
