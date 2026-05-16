import { FormEvent, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { loginWithPasskey } from '@/utils/api';
export default function LoginPage() {
  const router = useRouter();
  const [passkey, setPasskey] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await loginWithPasskey(passkey.trim());
      await router.replace('/');
    } catch {
      toast.error('Invalid passkey');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Head>
        <title>Sign in — Department Finder</title>
      </Head>
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-sm space-y-4 rounded-xl border border-slate-700/80 bg-slate-900/90 p-6 shadow-xl backdrop-blur"
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg shadow-lg">
              <img
                src="/sa-logo.png"
                alt="Department Finder"
                className="h-full w-full object-cover"
              />
            </div>
            <h1 className="text-lg font-semibold text-white">Department Finder</h1>
          </div>
          <p className="text-sm text-slate-400">Enter the app passkey to continue.</p>
          <input
            type="password"
            autoComplete="current-password"
            className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
            value={passkey}
            onChange={(e) => setPasskey(e.target.value)}
            placeholder="Passkey"
          />
          <button
            type="submit"
            disabled={busy || !passkey.trim()}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-blue-500"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </main>
    </>
  );
}
