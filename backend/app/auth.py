from fastapi import WebSocket, WebSocketException, status
from starlette.requests import Request
from starlette.responses import JSONResponse

SESSION_COOKIE = "session"

async def session_cookie_middleware(request: Request, call_next):
    if request.url.path.startswith("/auth"):
        return await call_next(request)
    if request.cookies.get(SESSION_COOKIE) != "authenticated":
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    return await call_next(request)


async def require_ws_auth(websocket: WebSocket) -> None:
    if websocket.cookies.get(SESSION_COOKIE) != "authenticated":
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="Unauthorized")
