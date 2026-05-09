from uuid import UUID

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.schemas import ChatMessage, ChatMetadata


def get_all_conversations_for_user(session: Session, user_id: UUID) -> list[ChatMetadata]:
    rows = session.execute(
        text(
            "SELECT conversation_id, description FROM conversations "
            "WHERE user_id = :user_id ORDER BY sequence_number DESC"
        ),
        {"user_id": user_id},
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
            'SELECT content, "type" FROM chat_messages '
            "WHERE conversation_id = :conversation_id ORDER BY id ASC"
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
            'INSERT INTO chat_messages (conversation_id, role, content) '
            "VALUES (:conversation_id, 'human', :content)"
        ),
        {"conversation_id": conversation_id, "content": user_text},
    )
    session.execute(
        text(
            'INSERT INTO chat_messages (conversation_id, role, content) '
            "VALUES (:conversation_id, 'ai', :content)"
        ),
        {"conversation_id": conversation_id, "content": assistant_text},
    )


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
        text("DELETE FROM chat_messages WHERE conversation_id = :conversation_id"),
        {"conversation_id": conversation_id},
    )
    session.execute(
        text("DELETE FROM conversations WHERE id = :conversation_id"),
        {"conversation_id": conversation_id},
    )
