from app.agent.models import llm_model
from app.agent.prompts import chat_title_prompt

_chain = chat_title_prompt | llm_model


def generate_chat_title(message: str) -> str:
    msg = _chain.invoke({"message": message})
    return msg.content
