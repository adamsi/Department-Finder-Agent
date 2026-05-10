import type { NextPageContext } from 'next';
import Head from 'next/head';

type ErrorPageProps = {
  statusCode?: number;
  title?: string;
};

function ErrorPage({ statusCode, title }: ErrorPageProps) {
  return (
    <>
      <Head>
        <title>{title ?? 'Error — Department Finder'}</title>
      </Head>
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-950 px-4 text-center text-slate-300">
        <p className="text-sm text-slate-500">
          {statusCode ? `Error ${statusCode}` : 'Application error'}
        </p>
        <h1 className="mt-2 text-lg font-semibold text-white">
          {title ?? 'Something went wrong'}
        </h1>
        <p className="mt-2 max-w-md text-sm text-slate-400">
          Try refreshing the page. If the problem continues, check the dev server
          terminal for details.
        </p>
      </main>
    </>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext): ErrorPageProps => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  const title =
    statusCode === 404
      ? 'Page not found'
      : err?.message
        ? String(err.message)
        : 'Something went wrong';
  return { statusCode, title };
};

export default ErrorPage;
