from pydantic import BaseModel


class ChatMetadata(BaseModel):
    conversation_id: str
    description: str | None = None


class ChatMessage(BaseModel):
    content: str
    role: str


class ChatStart(BaseModel):
    chatId: str
    description: str
