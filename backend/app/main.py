from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from app.api.routers import chat_memory_router, document_router

# will pass app object (web application) to uvicorn (the embedded server)
app = FastAPI()
app.include_router(document_router.router)
app.include_router(chat_memory_router.router)

@app.on_event("startup")
def init():
    print("Initializing...")
