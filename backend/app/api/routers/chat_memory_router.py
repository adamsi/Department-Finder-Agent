from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import ChatMessage, ChatMetadata
from app.services import chat_memory_service

router = APIRouter(prefix="/conversations")


@router.get("", summary="List conversations for a user")
def get_all_conversations(
    session: Annotated[Session, Depends(get_db)],
    user_id: Annotated[
        UUID,
        Query(description="Until auth is wired, pass the user id explicitly."),
    ],
) -> list[ChatMetadata]:
    return chat_memory_service.get_all_conversations(session, user_id)


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
