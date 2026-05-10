import secrets

from fastapi import HTTPException, Request, WebSocket, WebSocketException, status
from starlette.responses import JSONResponse

from app.settings import settings

SESSION_COOKIE = "session"


def _session_cookie_ok(cookie: str | None) -> bool:
    if cookie is None:
        return False
    return secrets.compare_digest(cookie, settings.api_passkey)


async def session_cookie_middleware(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)
    if request.url.path.startswith("/auth"):
        return await call_next(request)
    if not _session_cookie_ok(request.cookies.get(SESSION_COOKIE)):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    return await call_next(request)


def get_app_passkey(request: Request) -> str:
    key = request.cookies.get(SESSION_COOKIE)
    if key is None:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return key


async def require_ws_auth(websocket: WebSocket) -> None:
    if not _session_cookie_ok(websocket.cookies.get(SESSION_COOKIE)):
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="Unauthorized")