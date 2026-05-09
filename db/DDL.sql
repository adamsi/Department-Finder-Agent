DROP SCHEMA IF EXISTS prod CASCADE;
CREATE SCHEMA prod;

CREATE EXTENSION IF NOT EXISTS vector;


CREATE TABLE prod.document_vector_store (
    id UUID PRIMARY KEY,
    content TEXT,
    metadata JSONB,
    embedding vector(1536)
);

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
CREATE SEQUENCE prod_agent.conversation_sequence START 1;

CREATE TABLE prod.conversations (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT,
    created_at TIMESTAMP DEFAULT now()
);


CREATE TABLE prod.chat_memory (
    id UUID PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL
);