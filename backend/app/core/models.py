from langchain.chat_models import init_chat_model
from langchain_openai import OpenAIEmbeddings

from app.settings import settings

llm_model = init_chat_model(
    model=settings.llm_model
)

embeddings_model = OpenAIEmbeddings(
    model=settings.embeddings_model
)