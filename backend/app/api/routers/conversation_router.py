from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import get_app_passkey
from app.db import get_db
from app.schemas import ChatMessage, ChatMetadata, ChatStart
from app.services import chat_memory_service

router = APIRouter(prefix="/conversations")


class CreateConversationBody(BaseModel):
    message: str


@router.post("", summary="Start a new conversation", response_model=ChatStart)
def create_conversation(
    session: Annotated[Session, Depends(get_db)],
    app_passkey: Annotated[str, Depends(get_app_passkey)],
    body: CreateConversationBody,
) -> ChatStart:
    return chat_memory_service.create_conversation(session, app_passkey, body.message)


@router.get("", summary="List conversations for the logged-in passkey")
def get_all_conversations(
    session: Annotated[Session, Depends(get_db)],
    app_passkey: Annotated[str, Depends(get_app_passkey)],
) -> list[ChatMetadata]:
    return chat_memory_service.get_all_conversations(session, app_passkey)


@router.get(
    "/{conversation_id}",
    summary="Get messages for a conversation",
    response_model=list[ChatMessage],
)
def get_chat_messages(
    session: Annotated[Session, Depends(get_db)],
    conversation_id: UUID,
) -> list[ChatMessage]:
    return chat_memory_service.get_chat_messages(session, conversation_id)


@router.delete("/{conversation_id}", summary="Delete a conversation", status_code=204)
def delete_conversation(
    session: Annotated[Session, Depends(get_db)],
    conversation_id: UUID,
) -> None:
    chat_memory_service.delete_conversation(session, conversation_id)
