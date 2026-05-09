from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.models import S3Document, S3Folder


def get_folder(session: Session, folder_id: int) -> S3Folder | None:
    return session.get(S3Folder, folder_id)


def get_root_folder_with_subfolders(session: Session) -> S3Folder | None:
    stmt = (
        select(S3Folder)
        .where(S3Folder.parent_id.is_(None))
        .options(selectinload(S3Folder.subfolders))
        .order_by(S3Folder.id)
        .limit(1)
    )
    return session.scalar(stmt)


def get_root_folder_with_documents(session: Session) -> S3Folder | None:
    stmt = (
        select(S3Folder)
        .where(S3Folder.parent_id.is_(None))
        .options(selectinload(S3Folder.documents))
        .order_by(S3Folder.id)
        .limit(1)
    )
    return session.scalar(stmt)


def get_document(session: Session, document_id: int) -> S3Document | None:
    return session.get(S3Document, document_id)


def list_documents_by_ids(session: Session, document_ids: list[int]) -> list[S3Document]:
    if not document_ids:
        return []
    return list(session.scalars(select(S3Document).where(S3Document.id.in_(document_ids))))


def add_document(session: Session, document: S3Document) -> None:
    session.add(document)
    session.flush()


def delete_documents(session: Session, documents: list[S3Document]) -> None:
    for doc in documents:
        session.delete(doc)


def commit(session: Session) -> None:
    session.commit()
