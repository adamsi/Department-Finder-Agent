from typing import Annotated
from uuid import UUID

from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile
from sqlalchemy.orm import Session
from starlette.responses import Response

from app.db import get_db
from app.models.models import S3Document, S3Folder
from app.repositories import document_repository as doc_repo
from app.services import document_service
from app.services.s3_service import get_s3_object

router = APIRouter(prefix="/documents")


def _public_base(request: Request) -> str:
    return str(request.base_url).rstrip("/")


def _document_json(doc: S3Document, base: str) -> dict:
    return {
        "id": str(doc.id),
        "name": doc.name,
        "url": f"{base}/documents/{doc.id}/file",
        "contentType": doc.content_type,
    }


def _folder_json(folder: S3Folder, base: str) -> dict:
    subs = folder.subfolders or []
    docs = folder.documents or []
    return {
        "id": str(folder.id),
        "name": folder.name,
        "childrenFolders": [_folder_json(sf, base) for sf in subs],
        "childrenDocuments": [_document_json(d, base) for d in docs],
    }


@router.get("", summary="Get root folder tree")
def get_root_folder(
    request: Request,
    session: Annotated[Session, Depends(get_db)],
) -> dict:
    root = document_service.get_root_folder(session)
    return _folder_json(root, _public_base(request))


@router.post("", summary="Upload new documents")
async def create_documents(
    request: Request,
    session: Annotated[Session, Depends(get_db)],
    parent_folder_id: Annotated[UUID, Form()],
    files: Annotated[list[UploadFile], File()],
) -> list[dict]:
    try:
        docs = await document_service.create_new_documents(session, files, parent_folder_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    base = _public_base(request)
    return [_document_json(d, base) for d in docs]


@router.patch("/edit/{document_id}", summary="Edit a document")
async def edit_document(
    request: Request,
    document_id: UUID,
    session: Annotated[Session, Depends(get_db)],
    file: Annotated[UploadFile, File()],
) -> dict:
    try:
        doc = await document_service.edit_document(session, file, document_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    return _document_json(doc, _public_base(request))


@router.delete("/delete", summary="Delete documents by ids")
def delete_documents(
    session: Annotated[Session, Depends(get_db)],
    document_ids: Annotated[list[UUID], Query()],
) -> None:
    document_service.delete_documents(session, document_ids)


@router.get("/{document_id}/file", summary="Download document for preview (full body, not chunked)")
def get_document_file(
    document_id: UUID,
    session: Annotated[Session, Depends(get_db)],
) -> Response:
    doc = doc_repo.get_document(session, document_id)
    if doc is None or not doc.url.startswith("s3://"):
        raise HTTPException(status_code=404, detail="Document not found")
    try:
        obj = get_s3_object(doc.url)
    except (ValueError, ClientError):
        raise HTTPException(status_code=404, detail="Document not found") from None
    media = doc.content_type or obj.get("ContentType") or "application/octet-stream"
    data: bytes = obj["Body"].read()
    return Response(
        content=data,
        media_type=media,
        headers={
            "Content-Disposition": f'inline; filename="{doc.name}"',
        },
    )
