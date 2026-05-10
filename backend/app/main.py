import asyncio
import sys
import warnings

from langchain_core._api.deprecation import LangChainPendingDeprecationWarning

warnings.filterwarnings(
    "ignore"
)

# Windows-only: async psycopg (e.g. LangChain PGEngine) needs SelectorEventLoop. Linux/macOS/Docker: omit.
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from dotenv import load_dotenv

load_dotenv()

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.agent.graphs.supervisor_graph import (
    close_supervisor_graph,
    init_supervisor_graph,
)
from app.api.routers import auth_router, conversation_router, document_router, websocket_router
from app.auth import require_ws_auth, session_cookie_middleware

# will pass app object (web application) to uvicorn (the embedded server)
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.middleware("http")(session_cookie_middleware)
app.include_router(auth_router.router)
app.include_router(document_router.router)
app.include_router(conversation_router.router)
app.include_router(websocket_router.router, dependencies=[Depends(require_ws_auth)])

@app.on_event("startup")
def init():
    print("Initialization started...")
    init_supervisor_graph()
    print("Initialization completed successfully.")


@app.on_event("shutdown")
def shutdown():
    close_supervisor_graph()
