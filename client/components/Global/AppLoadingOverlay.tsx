import { useState } from 'react';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';
import { isAppLoading, subscribeAppLoading } from '@/utils/appLoading';
import AppLoadingScreen from './AppLoadingScreen';

export function AppLoadingOverlay() {
  const [visible, setVisible] = useState(false);

  useIsomorphicLayoutEffect(() => {
    setVisible(isAppLoading());
    return subscribeAppLoading(() => setVisible(isAppLoading()));
  }, []);

  if (!visible) return null;
  return <AppLoadingScreen />;
}
