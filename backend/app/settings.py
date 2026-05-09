from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    openai_api_key: str = Field(..., alias="OPENAI_API_KEY")
    llm_model: str = Field(..., alias="LLM_MODEL")
    embeddings_model: str = Field(..., alias="EMBEDDINGS_MODEL")
    db_url: str = Field(..., alias="DB_URL")

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()