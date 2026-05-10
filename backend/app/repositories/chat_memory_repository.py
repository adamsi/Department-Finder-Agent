from uuid import UUID, uuid4

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.schemas import ChatMessage, ChatMetadata


def create_conversation(session: Session, app_passkey: str, description: str) -> UUID:
    new_id = uuid4()
    session.execute(
        text(
            "INSERT INTO conversations (id, app_passkey, description) "
            "VALUES (:id, :app_passkey, :description)"
        ),
        {"id": new_id, "app_passkey": app_passkey, "description": description},
    )
    return new_id


def get_all_conversations_for_passkey(
    session: Session, app_passkey: str
) -> list[ChatMetadata]:
    rows = session.execute(
        text(
            "SELECT c.id AS conversation_id, c.description FROM conversations c "
            "WHERE c.app_passkey = :app_passkey "
            "ORDER BY ("
            "SELECT COALESCE(MAX(m.sequence_number), 0) FROM chat_memory m "
            "WHERE m.conversation_id = c.id"
            ") DESC"
        ),
        {"app_passkey": app_passkey},
    ).mappings()
    return [
        ChatMetadata(
            conversation_id=str(r["conversation_id"]),
            description=r["description"],
        )
        for r in rows
    ]


def get_chat_messages(session: Session, conversation_id: UUID) -> list[ChatMessage]:
    rows = session.execute(
        text(
            "SELECT content, role FROM chat_memory "
            "WHERE conversation_id = :conversation_id ORDER BY sequence_number ASC"
        ),
        {"conversation_id": conversation_id},
    ).mappings()
    return [ChatMessage.model_validate(dict(r)) for r in rows]


def save_message(
    session: Session,
    conversation_id: UUID,
    user_text: str,
    assistant_text: str,
) -> None:
    session.execute(
        text(
            "INSERT INTO chat_memory (id, conversation_id, role, content) "
            "VALUES (:id, :conversation_id, 'human', :content)"
        ),
        {"id": uuid4(), "conversation_id": conversation_id, "content": user_text},
    )
    session.execute(
        text(
            "INSERT INTO chat_memory (id, conversation_id, role, content) "
            "VALUES (:id, :conversation_id, 'ai', :content)"
        ),
        {"id": uuid4(), "conversation_id": conversation_id, "content": assistant_text},
    )
    session.commit()


def delete_conversation(session: Session, conversation_id: UUID) -> None:
    tid = str(conversation_id)
    session.execute(
        text("DELETE FROM checkpoints WHERE thread_id = :tid"),
        {"tid": tid},
    )
    session.execute(
        text("DELETE FROM checkpoint_blobs WHERE thread_id = :tid"),
        {"tid": tid},
    )
    session.execute(
        text("DELETE FROM checkpoint_writes WHERE thread_id = :tid"),
        {"tid": tid},
    )
    session.execute(
        text("DELETE FROM chat_memory WHERE conversation_id = :conversation_id"),
        {"conversation_id": conversation_id},
    )
    session.execute(
        text("DELETE FROM conversations WHERE id = :conversation_id"),
        {"conversation_id": conversation_id},
    )
