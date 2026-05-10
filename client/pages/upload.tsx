import React, { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchRootFolder,
  createFolder,
  deleteDocuments,
  deleteFolders,
  editDocument,
  setCurrentFolder,
  clearError,
  clearSuccess,
} from '@/store/slices/uploadSlice';
import LoadingSpinner from '@/components/Global/LoadingSpinner';
import { Spinner } from '@/components/Global/Spinner';
import { ParticlesBackground } from '@/components/Global/ParticlesDynamic';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  IconArrowLeft,
  IconFolder,
  IconFile,
  IconChevronRight,
  IconX,
  IconTrash,
  IconPlus,
  IconCheck,
} from '@tabler/icons-react';
import type { FolderEntity, DocumentEntity } from '@/types/ingestion';
import { FileUpload, DocumentViewer } from '@/components/Upload';
import { showToast } from '@/store/slices/toastSlice';

interface BreadcrumbItem {
  id: string;
  name: string;
}

const buildPathToFolder = (
  targetFolderId: string,
  currentFolder: FolderEntity,
  path: BreadcrumbItem[] = []
): BreadcrumbItem[] | null => {
  const newPath = [...path, { id: currentFolder.id, name: currentFolder.name }];
  if (currentFolder.id === targetFolderId) {
    return newPath;
  }
  for (const childFolder of currentFolder.childrenFolders ?? []) {
    const result = buildPathToFolder(targetFolderId, childFolder, newPath);
    if (result) return result;
  }
  return null;
};

export default function UploadPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { rootFolder, currentFolder, loading, deleting, error, success } = useAppSelector(
    (state) => state.upload
  );
  const { lastVisitedChatId } = useAppSelector((state) => state.chatMemory);

  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    itemId: string;
    itemType: 'folder' | 'file';
  }>({
    visible: false,
    x: 0,
    y: 0,
    itemId: '',
    itemType: 'file',
  });
  const [viewerDocument, setViewerDocument] = useState<DocumentEntity | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  /** Ids hidden immediately on delete; cleared after refresh or reverted on error. */
  const [optimisticallyHiddenIds, setOptimisticallyHiddenIds] = useState<Set<string>>(new Set());
  const [fileUploadBusy, setFileUploadBusy] = useState(false);

  useEffect(() => {
    // Skip if AuthGate already prefetched or a fetch is in flight.
    if (!rootFolder && !loading) {
      dispatch(fetchRootFolder());
    }
  }, [dispatch, rootFolder, loading]);

  useEffect(() => {
    if (currentFolder && rootFolder) {
      const path = buildPathToFolder(currentFolder.id, rootFolder);
      if (path) setBreadcrumbs(path);
    }
  }, [currentFolder, rootFolder]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => dispatch(clearSuccess()), 3000);
    return () => clearTimeout(timer);
  }, [success, dispatch]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu((m) => ({ ...m, visible: false }));
      }
    };
    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu.visible]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSelectionMode) {
          setSelectedItems([]);
          setIsSelectionMode(false);
        }
        if (contextMenu.visible) {
          setContextMenu((m) => ({ ...m, visible: false }));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelectionMode, contextMenu.visible]);

  const navigateToFolder = (folder: FolderEntity) => {
    dispatch(setCurrentFolder(folder));
    setSelectedItems([]);
    setIsSelectionMode(false);
  };

  const findFolderById = useCallback((folderId: string, folder: FolderEntity): FolderEntity | null => {
    if (folder.id === folderId) return folder;
    for (const childFolder of folder.childrenFolders ?? []) {
      const found = findFolderById(folderId, childFolder);
      if (found) return found;
    }
    return null;
  }, []);

  const navigateToBreadcrumb = (index: number) => {
    if (!rootFolder) return;
    if (index === 0) {
      dispatch(setCurrentFolder(rootFolder));
    } else {
      const targetBreadcrumb = breadcrumbs[index];
      const targetFolder = findFolderById(targetBreadcrumb.id, rootFolder);
      if (targetFolder) dispatch(setCurrentFolder(targetFolder));
    }
    setSelectedItems([]);
  };

  const getFileIcon = (contentType: string | null | undefined) => {
    if (!contentType) {
      return <IconFile className="h-6 w-6 text-blue-300" />;
    }
    if (contentType.startsWith('image/')) {
      return <IconFile className="h-6 w-6 text-green-400" />;
    }
    if (contentType.includes('pdf')) {
      return <IconFile className="h-6 w-6 text-red-400" />;
    }
    if (contentType.includes('word') || contentType.includes('document')) {
      return <IconFile className="h-6 w-6 text-blue-400" />;
    }
    if (contentType.includes('sheet') || contentType.includes('excel')) {
      return <IconFile className="h-6 w-6 text-green-400" />;
    }
    if (contentType.includes('presentation') || contentType.includes('powerpoint')) {
      return <IconFile className="h-6 w-6 text-orange-400" />;
    }
    if (contentType.includes('text')) {
      return <IconFile className="h-6 w-6 text-gray-400" />;
    }
    return <IconFile className="h-6 w-6 text-blue-300" />;
  };

  const handleItemSelect = (itemId: string) => {
    setSelectedItems((prev) => {
      const next = prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId];
      if (next.length > 0 && !isSelectionMode) setIsSelectionMode(true);
      else if (next.length === 0 && isSelectionMode) setIsSelectionMode(false);
      return next;
    });
  };

  useEffect(() => {
    if (selectedItems.length > 0 && !isSelectionMode) setIsSelectionMode(true);
    else if (selectedItems.length === 0 && isSelectionMode) setIsSelectionMode(false);
  }, [selectedItems, isSelectionMode]);

  const runDelete = async (documentIds: string[], folderIds: string[]) => {
    if (!currentFolder || (documentIds.length === 0 && folderIds.length === 0)) return;
    const toHide = [...documentIds, ...folderIds];
    setOptimisticallyHiddenIds((prev) => new Set([...prev, ...toHide]));
    setSelectedItems([]);
    setIsSelectionMode(false);
    dispatch(clearSuccess());
    const currentFolderId = currentFolder.id;
    try {
      if (documentIds.length > 0) {
        await dispatch(deleteDocuments(documentIds)).unwrap();
      }
      if (folderIds.length > 0) {
        await dispatch(deleteFolders(folderIds)).unwrap();
      }
      const docCount = documentIds.length;
      const folderCount = folderIds.length;
      let deleteMsg = '';
      if (docCount > 0 && folderCount > 0) {
        deleteMsg = `${docCount} file(s) and ${folderCount} folder(s) deleted.`;
      } else if (docCount > 0) {
        deleteMsg = `${docCount} document(s) deleted successfully!`;
      } else {
        deleteMsg = `${folderCount} folder(s) deleted successfully!`;
      }
      dispatch(showToast({ message: deleteMsg, type: 'success', duration: 3000 }));
      const result = await dispatch(fetchRootFolder()).unwrap();
      setOptimisticallyHiddenIds(new Set());
      if (currentFolderId) {
        const targetFolder = findFolderById(currentFolderId, result);
        if (targetFolder) dispatch(setCurrentFolder(targetFolder));
      }
    } catch (e) {
      console.error('Delete failed:', e);
      setOptimisticallyHiddenIds((prev) => {
        const next = new Set(prev);
        toHide.forEach((id) => next.delete(id));
        return next;
      });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0 || !currentFolder) return;
    const selectedDocuments = selectedItems.filter((itemId) =>
      currentFolder.childrenDocuments?.some((doc) => doc.id === itemId)
    );
    const selectedFolders = selectedItems.filter((itemId) =>
      currentFolder.childrenFolders?.some((folder) => folder.id === itemId)
    );
    await runDelete(selectedDocuments, selectedFolders);
  };

  const handleViewDocument = (document: DocumentEntity) => {
    setViewerDocument(document);
    setIsViewerOpen(true);
  };

  const handleSaveDocument = async (content: string) => {
    if (!viewerDocument) return;
    dispatch(clearSuccess());
    const currentFolderId = currentFolder?.id;
    try {
      const blob = new Blob([content], { type: viewerDocument.contentType || 'text/plain' });
      const file = new File([blob], viewerDocument.name, {
        type: viewerDocument.contentType || 'text/plain',
      });
      await dispatch(
        editDocument({
          file,
          documentId: viewerDocument.id,
        })
      ).unwrap();
      const result = await dispatch(fetchRootFolder()).unwrap();
      if (currentFolderId) {
        const targetFolder = findFolderById(currentFolderId, result);
        if (targetFolder) dispatch(setCurrentFolder(targetFolder));
      }
    } catch (e) {
      console.error('Failed to save document:', e);
      throw e;
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !currentFolder) return;
    setCreatingFolder(true);
    dispatch(clearSuccess());
    const currentFolderId = currentFolder.id;
    try {
      await dispatch(
        createFolder({
          name: newFolderName.trim(),
          parentFolderId: currentFolder.id,
        })
      ).unwrap();
      setNewFolderName('');
      setIsCreateFolderModalOpen(false);
      const result = await dispatch(fetchRootFolder()).unwrap();
      if (currentFolderId) {
        const targetFolder = findFolderById(currentFolderId, result);
        if (targetFolder) dispatch(setCurrentFolder(targetFolder));
      }
    } catch (e) {
      console.error('Create folder failed:', e);
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, itemId: string, itemType: 'folder' | 'file') => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      itemId,
      itemType,
    });
  };

  const handleContextMenuAction = (action: string) => {
    const { itemId, itemType } = contextMenu;
    setContextMenu((m) => ({ ...m, visible: false }));

    switch (action) {
      case 'delete':
        if (itemType === 'file') void runDelete([itemId], []);
        else void runDelete([], [itemId]);
        break;
      case 'select':
        handleItemSelect(itemId);
        break;
      case 'open':
        if (itemType === 'folder') {
          const folder = currentFolder?.childrenFolders?.find((f) => f.id === itemId);
          if (folder) navigateToFolder(folder);
        }
        break;
      default:
        break;
    }
  };

  if (loading && !rootFolder) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-slate-950 to-black">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !rootFolder) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-slate-950 to-black p-6 text-red-400">
        {error}
      </div>
    );
  }

  if (!currentFolder || !rootFolder) {
    return null;
  }

  const visibleFolders =
    currentFolder.childrenFolders?.filter((f) => !optimisticallyHiddenIds.has(f.id)) ?? [];
  const visibleDocuments =
    currentFolder.childrenDocuments?.filter((d) => !optimisticallyHiddenIds.has(d.id)) ?? [];

  const breadcrumbLabel = (crumb: BreadcrumbItem, index: number) =>
    index === 0 && rootFolder && crumb.id === rootFolder.id ? '/' : crumb.name;

  return (
    <>
      <Head>
        <title>Documents | Department Finder</title>
        <meta name="description" content="Browse folders, upload files, and manage documents." />
      </Head>

      <div className="relative flex h-screen flex-col overflow-hidden bg-gradient-to-br from-gray-950 via-slate-950 to-black sm:flex-row">
        <div className="absolute inset-0 z-0">
          <ParticlesBackground />
        </div>

        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute -right-16 top-1/3 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-cyan-400/10 blur-2xl" />
        </div>

        <div className="absolute inset-0 z-0 bg-grid opacity-30 mask-radial-faded" />

        <div className="relative z-10 flex w-full flex-row border-b border-white/10 bg-white/5 shadow-2xl backdrop-blur-2xl sm:w-64 sm:flex-col sm:border-b-0 sm:border-r">
          <div className="flex flex-shrink-0 items-center border-r border-white/10 px-4 py-4 sm:border-r-0 sm:border-b">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => {
                  if (lastVisitedChatId) {
                    void router.push(`/chat/${lastVisitedChatId}`);
                  } else {
                    void router.push('/');
                  }
                }}
                className="rounded-xl p-2 text-white/70 transition-all duration-apple hover:bg-white/10 hover:text-white active:scale-[0.95]"
              >
                <IconArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl shadow-lg">
                <img src="/sa-logo.png" alt="Logo" className="h-full w-full object-cover" />
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-row gap-3 overflow-x-auto p-4 sm:flex-col">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="flex h-11 flex-shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-sm font-medium text-white shadow-lg transition-all duration-apple hover:from-blue-500 hover:to-indigo-500 hover:shadow-xl active:scale-[0.98] sm:w-full"
            >
              <IconPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Upload Files</span>
              <span className="sm:hidden">Upload</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateFolderModalOpen(true)}
              className="flex h-11 flex-shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 text-sm font-medium text-white shadow-lg transition-all duration-apple hover:from-green-500 hover:to-emerald-500 hover:shadow-xl active:scale-[0.98] sm:w-full"
            >
              <IconFolder className="h-4 w-4" />
              <span className="hidden sm:inline">New Folder</span>
              <span className="sm:hidden">Folder</span>
            </button>
          </div>
        </div>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <div className="overflow-x-auto px-3 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center space-x-1 text-xs sm:space-x-2 sm:text-sm">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.id}>
                  <button
                    type="button"
                    onClick={() => navigateToBreadcrumb(index)}
                    className={`whitespace-nowrap rounded-lg px-3 py-1 transition-all duration-200 ${
                      index === breadcrumbs.length - 1
                        ? 'bg-blue-500/20 text-white ring-1 ring-blue-400/30'
                        : 'text-blue-200 hover:bg-blue-500/10 hover:text-white'
                    }`}
                  >
                    {breadcrumbLabel(crumb, index)}
                  </button>
                  {index < breadcrumbs.length - 1 && (
                    <IconChevronRight className="h-4 w-4 flex-shrink-0 text-blue-300/60" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-8">
            <div className="mx-auto max-w-7xl">
              <div className="mb-6 flex items-center justify-between">
                {selectedItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => void handleDeleteSelected()}
                    disabled={deleting}
                    className="flex items-center space-x-2 rounded-xl border border-red-500/30 bg-red-600/20 px-4 py-2 text-red-300 transition-all duration-200 hover:bg-red-600/30 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deleting ? (
                      <span>Deleting…</span>
                    ) : (
                      <>
                        <IconTrash className="h-4 w-4" />
                        <span>Delete ({selectedItems.length})</span>
                      </>
                    )}
                  </button>
                )}

                <div className="ml-auto text-sm text-blue-200/70">
                  {visibleFolders.length} folders, {visibleDocuments.length} files
                  {isSelectionMode && (
                    <span className="ml-2 rounded-lg bg-blue-500/20 px-2 py-1 text-xs text-blue-300">
                      Selection mode · Esc to exit
                    </span>
                  )}
                </div>
              </div>

              <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {visibleFolders.map((folder) => (
                  <div
                    key={folder.id}
                    role="button"
                    tabIndex={0}
                    className={`group relative min-w-0 cursor-pointer rounded-2xl border bg-black/30 p-4 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/10 ${
                      selectedItems.includes(folder.id)
                        ? 'border-blue-400/50 bg-blue-500/10'
                        : 'border-white/10 hover:border-blue-400/30'
                    }`}
                    onClick={() => {
                      if (isSelectionMode) handleItemSelect(folder.id);
                      else navigateToFolder(folder);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (isSelectionMode) handleItemSelect(folder.id);
                        else navigateToFolder(folder);
                      }
                    }}
                    onContextMenu={(e) => handleContextMenu(e, folder.id, 'folder')}
                  >
                    <div className="flex w-full min-w-0 flex-col items-center space-y-3 text-center">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 transition-all duration-300 group-hover:from-blue-500/30 group-hover:to-indigo-500/30">
                        <IconFolder className="h-6 w-6 text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <h3
                          className="truncate text-sm font-medium text-white transition-colors duration-200 group-hover:text-blue-200"
                          title={folder.name}
                        >
                          {folder.name}
                        </h3>
                        <p className="mt-1 text-xs text-blue-200/60">
                          {(folder.childrenFolders?.length || 0) + (folder.childrenDocuments?.length || 0)} items
                        </p>
                      </div>
                    </div>
                    {selectedItems.includes(folder.id) && (
                      <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                        <div className="h-2 w-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                ))}

                {visibleDocuments.map((document) => (
                  <div
                    key={document.id}
                    role="button"
                    tabIndex={0}
                    className={`group relative min-w-0 cursor-pointer rounded-2xl border bg-black/30 p-4 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/10 ${
                      selectedItems.includes(document.id)
                        ? 'border-blue-400/50 bg-blue-500/10'
                        : 'border-white/10 hover:border-blue-400/30'
                    }`}
                    onClick={() => {
                      if (isSelectionMode) handleItemSelect(document.id);
                      else handleViewDocument(document);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (isSelectionMode) handleItemSelect(document.id);
                        else handleViewDocument(document);
                      }
                    }}
                    onContextMenu={(e) => handleContextMenu(e, document.id, 'file')}
                  >
                    <div className="flex w-full min-w-0 flex-col items-center space-y-3 text-center">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gray-500/20 to-gray-600/20 transition-all duration-300 group-hover:from-gray-500/30 group-hover:to-gray-600/30">
                        {getFileIcon(document.contentType)}
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <h3
                          className="truncate text-sm font-medium text-white transition-colors duration-200 group-hover:text-blue-200"
                          title={document.name}
                        >
                          {document.name}
                        </h3>
                      </div>
                    </div>
                    {selectedItems.includes(document.id) && (
                      <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                        <div className="h-2 w-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {visibleFolders.length === 0 && visibleDocuments.length === 0 && (
                <div className="py-16 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-500/20">
                    <IconFolder className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-medium text-white">Empty folder</h3>
                  <p className="mb-6 text-blue-200/70">Upload files or create a subfolder to get started.</p>
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(true)}
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-white shadow-lg transition-all duration-200 hover:from-blue-500 hover:to-indigo-500 hover:shadow-xl"
                  >
                    Upload files
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !fileUploadBusy && setIsUploadModalOpen(false)}
            aria-hidden
          />
          <div className="relative max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/30 bg-black/90 p-6 shadow-[0_0_40px_rgba(0,0,0,0.85)] backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Upload files</h2>
              <button
                type="button"
                onClick={() => !fileUploadBusy && setIsUploadModalOpen(false)}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-500/20 hover:text-white"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>
            <FileUpload
              className="w-full"
              parentFolderId={currentFolder.id}
              onUploadBusyChange={setFileUploadBusy}
              onUploadComplete={() => setIsUploadModalOpen(false)}
            />
            <div className="mt-6 border-t border-white/10 pt-4 text-center text-sm text-blue-200/70">
              Current folder:{' '}
              <span className="font-mono text-blue-300">
                {breadcrumbs.length === 0
                  ? '/'
                  : '/' + breadcrumbs.slice(1).map((c) => c.name).join('/')}
              </span>
            </div>
          </div>
        </div>
      )}

      {isCreateFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !creatingFolder && setIsCreateFolderModalOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-black/80 p-6 backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">New folder</h2>
              <button
                type="button"
                onClick={() => !creatingFolder && setIsCreateFolderModalOpen(false)}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-500/20 hover:text-white"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-blue-200">Folder name</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name..."
                  className="w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-white placeholder-gray-400 transition-all focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  autoFocus
                />
              </div>
              <p className="text-sm text-blue-200/70">
                Parent:{' '}
                <span className="font-mono text-blue-300">
                  {breadcrumbs.length <= 1 ? '/' : '/' + breadcrumbs.slice(1).map((c) => c.name).join('/')}
                </span>
              </p>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateFolderModalOpen(false)}
                  disabled={creatingFolder}
                  className="flex-1 rounded-xl border border-gray-500/30 bg-gray-600/20 px-4 py-3 text-gray-300 transition-colors hover:bg-gray-600/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleCreateFolder()}
                  disabled={!newFolderName.trim() || creatingFolder}
                  className="flex flex-1 items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 text-white transition-colors hover:from-green-500 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingFolder ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Creating…</span>
                    </>
                  ) : (
                    <span>Create folder</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div
          className="fixed inset-0 z-[55] flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
          role="status"
          aria-busy="true"
          aria-live="polite"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-black/70 px-6 py-4 shadow-2xl backdrop-blur-xl">
            <Spinner size="1.35rem" className="text-blue-300" />
            <span className="text-sm font-medium text-white/90">Deleting…</span>
          </div>
        </div>
      )}

      {contextMenu.visible && (
        <div
          className="fixed z-50 min-w-[160px] rounded-xl border border-white/20 bg-black/90 py-2 shadow-2xl backdrop-blur-xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
          role="menu"
        >
          {contextMenu.itemType === 'folder' && (
            <button
              type="button"
              onClick={() => handleContextMenuAction('open')}
              className="flex w-full items-center space-x-3 px-4 py-2 text-left text-white transition-colors hover:bg-blue-500/20"
            >
              <IconFolder className="h-4 w-4 text-blue-400" />
              <span>Open</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => handleContextMenuAction('select')}
            className="flex w-full items-center space-x-3 px-4 py-2 text-left text-white transition-colors hover:bg-blue-500/20"
          >
            <IconCheck className="h-4 w-4 text-green-400" />
            <span>{selectedItems.includes(contextMenu.itemId) ? 'Deselect' : 'Select'}</span>
          </button>
          <div className="my-1 border-t border-white/10" />
          <button
            type="button"
            onClick={() => handleContextMenuAction('delete')}
            className="flex w-full items-center space-x-3 px-4 py-2 text-left text-red-300 transition-colors hover:bg-red-500/20"
          >
            <IconTrash className="h-4 w-4 text-red-400" />
            <span>Delete</span>
          </button>
        </div>
      )}

      {(error || success) && (
        <div className="fixed bottom-4 right-4 z-[60] max-w-md">
          {error && (
            <div className="mb-4 flex items-start space-x-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 backdrop-blur-sm">
              <IconX className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-300">Error</p>
                <p className="mt-1 text-xs text-red-200/80">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => dispatch(clearError())}
                className="rounded-lg p-1 text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
              >
                <IconX className="h-4 w-4" />
              </button>
            </div>
          )}
          {success && (
            <div className="flex items-start space-x-3 rounded-xl border border-green-500/20 bg-green-500/10 p-4 backdrop-blur-sm">
              <IconCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-300">Success</p>
                <p className="mt-1 text-xs text-green-200/80">{success}</p>
              </div>
              <button
                type="button"
                onClick={() => dispatch(clearSuccess())}
                className="rounded-lg p-1 text-green-400 transition-colors hover:bg-green-500/10 hover:text-green-300"
              >
                <IconX className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      <DocumentViewer
        document={viewerDocument}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        onSave={handleSaveDocument}
      />
    </>
  );
}
