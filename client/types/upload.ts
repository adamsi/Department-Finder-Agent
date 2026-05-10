/** Minimal shapes for folder/document APIs (ingestion). */
export interface CreateFolderDTO {
  name: string;
  parentFolderId: string;
}

export interface DocumentEntity {
  id: string;
  name: string;
  url?: string;
  contentType?: string;
}

export interface FolderEntity {
  id: string;
  name: string;
  childrenFolders?: FolderEntity[];
  childrenDocuments?: DocumentEntity[];
}
