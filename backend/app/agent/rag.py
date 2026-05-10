from fastapi import UploadFile
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_postgres import PGVector

from app.agent.models import embeddings_model
from app.settings import settings
 
vector_store = PGVector(
    embeddings=embeddings_model,
    collection_name="document_vector_store",
    connection=settings.db_url,
    use_jsonb=True
)
splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    add_start_index=True,
)


# ingestion
async def ingest_docs(files: dict[str, UploadFile]):
    docs = []
    for file_id, file in files.items():
        content = (await file.read()).decode("utf-8")
        docs.append(
            Document(page_content=content,
                     metadata={"document_id": file_id,
                                "source": file.filename})
        )
    chunks = splitter.split_documents(docs)
    vector_store.add_documents(chunks)


def delete_docs(doc) -> None:
    vector_store.delete(ids=[str(doc.id)])


# retrieval
def get_rag_context(query: str):
    chunks = vector_store.similarity_search(query=query, k= 5)
    return "\n\n".join(
        [f"{chunk}" for chunk in chunks]
    )
