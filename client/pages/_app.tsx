import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Toaster } from 'react-hot-toast';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { AuthGate } from '@/components/AuthGate';
import { AppLoadingOverlay } from '@/components/Global/AppLoadingOverlay';
import { setAppLoading } from '@/utils/appLoading';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const inter = Inter({ subsets: ['latin'] });

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6',
    },
    secondary: {
      main: '#1e40af',
    },
    background: {
      default: 'transparent',
      paper: 'transparent',
    },
  },
  typography: {
    fontFamily: inter.style.fontFamily,
  },
  components: {
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(30,58,138,0.8) 100%)',
          backdropFilter: 'blur(20px)',
        },
      },
    },
  },
});

function RouteLoading() {
  const router = useRouter();

  useEffect(() => {
    const start = () => setAppLoading('route', true);
    const end = () => setAppLoading('route', false);
    router.events.on('routeChangeStart', start);
    router.events.on('routeChangeComplete', end);
    router.events.on('routeChangeError', end);
    return () => {
      router.events.off('routeChangeStart', start);
      router.events.off('routeChangeComplete', end);
      router.events.off('routeChangeError', end);
    };
  }, [router]);

  return null;
}

function AppContent({ Component, pageProps }: Pick<AppProps, 'Component' | 'pageProps'>) {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <RouteLoading />
      <AppLoadingOverlay />
      <div className={inter.className}>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(0, 0, 0, 0.9)',
              color: '#fff',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            },
            success: {
              style: {
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#4ade80',
              },
              iconTheme: {
                primary: '#4ade80',
                secondary: '#fff',
              },
            },
            error: {
              style: {
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
              },
              iconTheme: {
                primary: '#f87171',
                secondary: '#fff',
              },
            },
            loading: {
              style: {
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: '#60a5fa',
              },
              iconTheme: {
                primary: '#60a5fa',
                secondary: '#fff',
              },
            },
          }}
        />
        <div className="min-h-screen flex flex-col">
          <div className="flex-1">
            <AuthGate>
              <Component {...pageProps} />
            </AuthGate>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

function App(props: AppProps<{}>) {
  const { Component, pageProps } = props;

  return (
    <Provider store={store}>
      <AppContent Component={Component} pageProps={pageProps} />
    </Provider>
  );
}

export default App;
