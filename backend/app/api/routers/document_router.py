from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.models import S3Document, S3Folder
from app.services import document_service

router = APIRouter(prefix="/documents")


@router.post("", summary="Upload new documents")
async def create_documents(
    session: Annotated[Session, Depends(get_db)],
    parent_folder_id: Annotated[int, Form()],
    files: Annotated[list[UploadFile], File()],
) -> list[S3Document]:
    return await document_service.create_new_documents(session, files, parent_folder_id)


@router.patch("/edit/{document_id}", summary="Edit a document")
async def edit_document(
    document_id: int,
    file: UploadFile,
    session: Annotated[Session, Depends(get_db)],
) -> S3Document:
    return await document_service.edit_document(session, file, document_id)


@router.delete("/delete", summary="Delete documents by ids")
async def delete_documents(
    session: Annotated[Session, Depends(get_db)],
    document_ids: Annotated[list[int], Query()],
) -> None:
    document_service.delete_documents(session, document_ids)


@router.get("", summary="Get root folder")
def get_root_folder(
    session: Annotated[Session, Depends(get_db)],
) -> S3Folder:
    return document_service.get_root_folder(session)
