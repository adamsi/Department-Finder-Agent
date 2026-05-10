from functools import lru_cache
from urllib.parse import quote

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openai_api_key: str = Field(..., alias="OPENAI_API_KEY")
    llm_model: str = Field(..., alias="LLM_MODEL")
    embeddings_model: str = Field(..., alias="EMBEDDINGS_MODEL")
    db_url: str = Field(..., alias="DB_URL")
    db_schema: str = Field(default="public", alias="DB_SCHEMA")
    s3_bucket: str = Field(..., alias="S3_BUCKET")
    s3_region: str = Field(..., alias="S3_REGION")
    s3_endpoint_url: str | None = Field(default=None, alias="S3_ENDPOINT_URL")
    api_passkey: str = Field(..., alias="APP_PASSKEY")

    @property
    def db_connection_url(self) -> str:
        # `extensions` is included so the pgvector `vector` type (installed in
        # the `extensions` schema on Supabase) resolves while DDL still lands
        # in `db_schema`.
        search_path = quote(f"{self.db_schema}", safe="")
        options = f"options=-c%20search_path%3D{search_path}"
        separator = "&" if "?" in self.db_url else "?"
        return f"{self.db_url}{separator}{options}"


@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()