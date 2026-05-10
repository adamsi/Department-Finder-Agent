from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI

from app.agent.graphs.supervisor_graph import (
    close_supervisor_graph,
    init_supervisor_graph,
)
from app.api.routers import chat_memory_router, document_router, websocket_router

# will pass app object (web application) to uvicorn (the embedded server)
app = FastAPI()
app.include_router(document_router.router)
app.include_router(chat_memory_router.router)
app.include_router(websocket_router.router)

@app.on_event("startup")
def init():
    print("Initialization started...")
    init_supervisor_graph()
    print("Initialization completed successfully.")


@app.on_event("shutdown")
def shutdown():
    close_supervisor_graph()

