from fastapi import UploadFile
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_postgres import PGEngine, PGVectorStore

from app.agent.models import embeddings_model
from app.settings import settings

pg_engine = PGEngine.from_connection_string(
    url=settings.db_url,
)

vector_store = PGVectorStore.create_sync(
    engine=pg_engine,
    table_name="document_vector_store",
    schema_name=settings.db_schema,
    embedding_service=embeddings_model,
    id_column="id",
    metadata_json_column="metadata",
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
