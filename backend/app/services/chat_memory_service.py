from uuid import UUID

from sqlalchemy.orm import Session

from app.agent.chat_title import generate_chat_title
from app.repositories import chat_memory_repository as chat_repo
from app.schemas import ChatMessage, ChatMetadata, ChatStart


def create_conversation(
    session: Session, app_passkey: str, initial_message: str
) -> ChatStart:
    description = generate_chat_title(initial_message)
    with session.begin():
        conv_id = chat_repo.create_conversation(session, app_passkey, description)
    return ChatStart(chatId=str(conv_id), description=description)


def save_message(
    session: Session,
    conversation_id: UUID,
    user_text: str,
    assistant_text: str,
) -> None:
    chat_repo.save_message(session, conversation_id, user_text, assistant_text)


def get_all_conversations(session: Session, app_passkey: str) -> list[ChatMetadata]:
    return chat_repo.get_all_conversations_for_passkey(session, app_passkey)


def get_chat_messages(session: Session, conversation_id: UUID) -> list[ChatMessage]:
    return chat_repo.get_chat_messages(session, conversation_id)


def delete_conversation(session: Session, conversation_id: UUID) -> None:
    with session.begin():
        chat_repo.delete_conversation(session, conversation_id)
