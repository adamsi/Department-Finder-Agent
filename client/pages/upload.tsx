import Head from 'next/head';
import Link from 'next/link';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchRootFolder } from '@/store/slices/uploadSlice';
import FileUpload from '@/components/Upload/FileUpload';
import LoadingSpinner from '@/components/Global/LoadingSpinner';

export default function UploadPage() {
  const dispatch = useAppDispatch();
  const { rootFolder, loading, error } = useAppSelector((s) => s.upload);

  useEffect(() => {
    dispatch(fetchRootFolder());
  }, [dispatch]);

  return (
    <>
      <Head>
        <title>Upload documents | Department Finder</title>
        <meta name="description" content="Upload files for department routing." />
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-950 to-black text-white p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-semibold">Upload documents</h1>
            <Link href="/" className="text-sm text-blue-400 hover:underline">
              Back to chat
            </Link>
          </div>
          <p className="text-sm text-white/70">
            Files upload in one request; the server ingests them before responding. Allowed types: PDF, Word, PowerPoint,
            Excel, ODT, plain text.
          </p>
          {loading && !rootFolder ? (
            <LoadingSpinner />
          ) : error ? (
            <p className="text-red-400 text-sm">{error}</p>
          ) : rootFolder ? (
            <div className="space-y-4">
              <p className="text-sm text-white/80">
                Upload into folder: <span className="font-medium">{rootFolder.name}</span>
              </p>
              <FileUpload parentFolderId={rootFolder.id} />
            </div>
          ) : (
            <p className="text-sm text-white/60">No root folder returned from the API.</p>
          )}
        </div>
      </main>
    </>
  );
}
