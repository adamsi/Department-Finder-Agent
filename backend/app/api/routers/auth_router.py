import secrets

from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel

from app.auth import SESSION_COOKIE
from app.settings import settings

router = APIRouter(prefix="/auth")


class LoginRequest(BaseModel):
    passkey: str


@router.post("/login")
def login(body: LoginRequest, response: Response) -> dict[str, bool]:
    if not secrets.compare_digest(body.passkey, settings.api_passkey):
        raise HTTPException(status_code=401, detail="Invalid passkey")
    response.set_cookie(
        key=SESSION_COOKIE,
        value=body.passkey,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=60 * 60 * 24 * 10,  # 10 days
    )
    return {"ok": True}
