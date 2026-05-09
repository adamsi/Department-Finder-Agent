from uuid import UUID

from sqlalchemy.orm import Session

from app.repositories import chat_memory_repository as chat_repo
from app.schemas import ChatMessage, ChatMetadata


def save_message(
    session: Session,
    conversation_id: UUID,
    user_text: str,
    assistant_text: str,
) -> None:
    chat_repo.save_message(session, conversation_id, user_text, assistant_text)


def get_all_conversations(session: Session, user_id: UUID) -> list[ChatMetadata]:
    return chat_repo.get_all_conversations_for_user(session, user_id)


def get_chat_messages(session: Session, conversation_id: UUID) -> list[ChatMessage]:
    return chat_repo.get_chat_messages(session, conversation_id)


def delete_conversation(session: Session, conversation_id: UUID) -> None:
    with session.begin():
        chat_repo.delete_conversation(session, conversation_id)
