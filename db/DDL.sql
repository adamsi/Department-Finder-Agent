DROP SCHEMA IF EXISTS prod CASCADE;
CREATE SCHEMA prod;

CREATE EXTENSION IF NOT EXISTS vector;


-- LangChain PGVector tables (collection_name "document_vector_store" is a row in langchain_pg_collection)
CREATE TABLE prod.langchain_pg_collection (
    uuid UUID PRIMARY KEY,
    name VARCHAR NOT NULL UNIQUE,
    cmetadata JSON
);

CREATE TABLE prod.langchain_pg_embedding (
    id VARCHAR PRIMARY KEY,
    collection_id UUID NOT NULL REFERENCES prod.langchain_pg_collection(uuid) ON DELETE CASCADE,
    embedding vector(1536),
    document TEXT,
    cmetadata JSONB
);

CREATE INDEX idx_langchain_pg_embedding_collection_id
    ON prod.langchain_pg_embedding(collection_id);

CREATE INDEX ix_cmetadata_gin
    ON prod.langchain_pg_embedding
    USING gin (cmetadata jsonb_path_ops);

-- Speeds up similarity_search (cosine distance, k=5 in rag.py)
CREATE INDEX idx_langchain_pg_embedding_hnsw
    ON prod.langchain_pg_embedding
    USING hnsw (embedding vector_cosine_ops);

CREATE TABLE prod.s3_folders (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    parent_id UUID,
    CONSTRAINT fk_parent FOREIGN KEY (parent_id) REFERENCES prod.s3_folders (id)
);

CREATE TABLE prod.s3_documents (
    id UUID PRIMARY KEY,
    url TEXT,
    name VARCHAR(255),
    content_type VARCHAR(255),
    folder_id UUID,
    CONSTRAINT fk_folder FOREIGN KEY (folder_id) REFERENCES prod.s3_folders (id)
);

CREATE INDEX idx_s3_documents_folder_id ON prod.s3_documents(folder_id);
CREATE INDEX idx_s3_folders_parent_id ON prod.s3_folders(parent_id);

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE SEQUENCE prod.conversation_sequence START 1;

CREATE TABLE prod.conversations (
    id UUID PRIMARY KEY,
    app_passkey TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT now()
);


CREATE TABLE prod.chat_memory (
    id UUID PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES prod.conversations(id) ON DELETE CASCADE,
    sequence_number BIGINT DEFAULT nextval('prod.conversation_sequence'),
    role TEXT NOT NULL,
    content TEXT NOT NULL
);
