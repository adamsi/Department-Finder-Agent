import sys
from collections.abc import AsyncIterator

from langgraph.constants import START, END
from langgraph.graph import StateGraph, MessagesState

from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from app.db import db_url_for_libpq
from app.agent.models import llm_model
from app.agent.prompts import supervisor_prompt
from app.agent.rag import get_rag_context
from app.repositories.chat_memory_repository import save_message
from app.settings import settings


# state
class SupervisorState(MessagesState):
    user_prompt: str
    rag_context: str

checkpointer_cm = None
graph = None


async def init_supervisor_graph():
    """Open async Postgres checkpointer (required for ``graph.astream`` / ``aget_tuple``)."""
    global checkpointer_cm, graph

    cm = AsyncPostgresSaver.from_conn_string(
        db_url_for_libpq(settings.db_connection_url),
    )
    checkpointer = await cm.__aenter__()
    try:
        await checkpointer.setup()
        graph = builder.compile(checkpointer=checkpointer)
    except BaseException:
        await cm.__aexit__(*sys.exc_info())
        checkpointer_cm = None
        raise
    checkpointer_cm = cm


async def close_supervisor_graph():
    global checkpointer_cm, graph
    graph = None
    if checkpointer_cm is not None:
        await checkpointer_cm.__aexit__(None, None, None)
        checkpointer_cm = None


def retrieve_rag(state: SupervisorState):
    return {
        "rag_context": get_rag_context(state["user_prompt"])
    }

def generate_answer(state: SupervisorState):
    chain = supervisor_prompt | llm_model
    response = chain.invoke(
        {
            "rag_context": state["rag_context"],
            "user_prompt": state["user_prompt"],
        }
    )

    return {"messages": [response]}

# builder
builder = StateGraph(SupervisorState)

# nodes
builder.add_node("retrieve_rag", retrieve_rag)
builder.add_node("generate_answer", generate_answer)

# edges
builder.add_edge(START, "retrieve_rag")
builder.add_edge("retrieve_rag", "generate_answer")
builder.add_edge("generate_answer", END)


async def invoke_supervisor(db, conversation_id: str, user_prompt: str) -> AsyncIterator[str]:
    chunks: list[str] = []

    async for msg, _ in graph.astream(
        {
            "messages": [{"role": "user", "content": user_prompt}],
            "user_prompt": user_prompt,
        },
        config={"configurable": {"thread_id": conversation_id}},
        stream_mode="messages",
    ):
        content = msg.content

        if isinstance(content, str) and content:
            chunks.append(content)
            yield content

    answer = "".join(chunks)
    save_message(db, conversation_id, user_prompt, answer)