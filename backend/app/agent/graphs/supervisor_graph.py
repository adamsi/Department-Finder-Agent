from langgraph.constants import START, END
from langgraph.graph import StateGraph, MessagesState

from langgraph.checkpoint.postgres import PostgresSaver
from app.agent.models import llm_model
from app.agent.prompts import supervisor_prompt
from app.agent.rag_service import get_rag_context
from app.repositories.chat_memory_repository import save_message
from app.settings import settings


# state
class SupervisorState(MessagesState):
    user_prompt: str
    rag_context: str

checkpointer_ctx = None
graph = None

def init_supervisor_graph():
    global checkpointer_ctx, graph

    checkpointer_ctx = PostgresSaver.from_conn_string(settings.db_url)
    checkpointer = checkpointer_ctx.__enter__()

    checkpointer.setup()
    graph = builder.compile(checkpointer=checkpointer)


def close_supervisor_graph():
    if checkpointer_ctx:
        checkpointer_ctx.__exit__(None, None, None)


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


def invoke_supervisor(db, conversation_id: str, user_prompt: str):
    answer = ""

    for msg, _ in graph.stream(
        {
            "messages": [{"role": "user", "content": user_prompt}],
            "user_prompt": user_prompt,
        },
        config={"configurable": {"thread_id": conversation_id}},
        stream_mode="messages",
    ):
        content = msg.content

        if isinstance(content, str) and content:
            answer += content
            yield content

    save_message(db, conversation_id, user_prompt, answer)