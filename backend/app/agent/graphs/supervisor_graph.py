from typing import Any
from uuid import UUID

from langchain_core.messages import AIMessage, HumanMessage
from langgraph.constants import START, END
from langgraph.graph import StateGraph, MessagesState

from app.agent.models import llm_model
from app.agent.prompts import supervisor_prompt
from app.agent.rag_service import get_rag_context
from app.db import SessionLocal
from app.repositories.chat_memory_repository import save_message


# state
class SupervisorState(MessagesState):
    user_prompt: str
    rag_context: str


def retrieve_rag(state: SupervisorState):
    return {
        "rag_context": get_rag_context(state["user_prompt"])
    }

def generate_answer(state: SupervisorState):
    chain = supervisor_prompt | llm_model
    response = chain.invoke({
        "rag_context": state["rag_context"],
        "user_prompt": state["user_prompt"]
    })

    return {
        "messages": [response]
    }

# builder
builder = StateGraph(SupervisorState)

# nodes
builder.add_node("retrieve_rag", retrieve_rag)
builder.add_node("generate_answer", generate_answer)

# edges
builder.add_edge(START, "retrieve_rag")
builder.add_edge("retrieve_rag", "generate_answer")
builder.add_edge("generate_answer", END)