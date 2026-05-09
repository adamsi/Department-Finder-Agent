from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from app.api.routers import document_router

# will pass app object (web application) to uvicorn (the embedded server)
app = FastAPI()
app.include_router(document_router.router)

@app.on_event("startup")
def init():
    print("Initializing...")
