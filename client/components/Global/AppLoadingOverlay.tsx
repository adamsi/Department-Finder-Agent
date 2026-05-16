import { useLayoutEffect, useState } from 'react';
import { isAppLoading, subscribeAppLoading } from '@/utils/appLoading';
import AppLoadingScreen from './AppLoadingScreen';

export function AppLoadingOverlay() {
  const [visible, setVisible] = useState(false);

  useLayoutEffect(() => {
    setVisible(isAppLoading());
    return subscribeAppLoading(() => setVisible(isAppLoading()));
  }, []);

  if (!visible) return null;
  return <AppLoadingScreen />;
}
