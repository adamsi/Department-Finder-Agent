from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from typing import Annotated
from app.agent.graphs.supervisor_graph import invoke_supervisor
from app.db import get_db

router = APIRouter(prefix="/ws")

@router.websocket("/chat/{conversation_id}")
async def chat_ws(websocket: WebSocket, conversation_id: str, session: Annotated[Session, Depends(get_db)]):
    await websocket.accept()

    try:
        while True:
            message = await websocket.receive_text()
            async for ai_response in invoke_supervisor(session, conversation_id, message):
                await websocket.send_text(ai_response)
    except WebSocketDisconnect:
        print("Client disconnected")