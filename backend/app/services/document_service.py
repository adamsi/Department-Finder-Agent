from uuid import UUID

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.agent import rag
from app.models.models import S3Document, S3Folder
from app.repositories import document_repository as doc_repo
from app.services.s3_service import delete_file, upload_file

ALLOWED_CONTENT_TYPES = frozenset(
    {
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.oasis.opendocument.text",
    }
)


def validate_file(file: UploadFile) -> None:
    if file.content_type is None:
        raise ValueError("Uploaded file is empty")
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError("Uploaded file contentType is not supported")


async def create_new_documents(
    session: Session, files: list[UploadFile], parent_folder_id: UUID
) -> list[S3Document]:
    folder = doc_repo.get_folder(session, parent_folder_id)
    if folder is None:
        raise ValueError(f"Folder {parent_folder_id} not found")
    out: list[S3Document] = []
    with session.begin():
        for file in files:
            validate_file(file)
            try:
                doc = S3Document(
                    url="",
                    name=file.filename or "",
                    content_type=file.content_type or "",
                    folder_id=folder.id,
                )
                doc_repo.add_document(session, doc)
                await rag.ingest_docs({str(doc.id): file})
                file.file.seek(0)
                doc.url = upload_file(file)
                out.append(doc)
            except ValueError:
                raise
            except Exception as e:
                raise ValueError("Failed processing files, try again...") from e
    return out


def delete_documents(session: Session, document_ids: list[UUID]) -> None:
    docs = doc_repo.list_documents_by_ids(session, document_ids)
    with session.begin():
        doc_repo.delete_documents(session, docs)
    for d in docs:
        rag.delete_docs(d)
        delete_file(d.url)


async def edit_document(session: Session, file: UploadFile, document_id: UUID) -> S3Document:
    validate_file(file)
    doc = doc_repo.get_document(session, document_id)
    if doc is None:
        raise ValueError(f"Document with id: `{document_id}` not found")
    delete_file(doc.url)
    rag.delete_docs(doc)
    await rag.ingest_docs({str(doc.id): file})
    file.file.seek(0)
    doc.url = upload_file(file)
    doc.name = file.filename or doc.name
    doc.content_type = file.content_type or doc.content_type
    doc_repo.commit(session)
    return doc


def get_root_folder(session: Session) -> S3Folder:
    root = doc_repo.get_root_folder_with_subfolders(session)
    if root is None:
        raise ValueError("root folder not found")
    with_documents = doc_repo.get_root_folder_with_documents(session)
    if with_documents is not None:
        root.documents = with_documents.documents
    return root
