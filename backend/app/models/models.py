from __future__ import annotations

from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, String, Uuid
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class S3Folder(Base):
    __tablename__ = "s3_folders"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(255))
    parent_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("s3_folders.id"),
        nullable=True,
    )
    subfolders: Mapped[list[S3Folder]] = relationship(
        back_populates="parent",
    )
    parent: Mapped[S3Folder | None] = relationship(
        back_populates="subfolders",
        remote_side=lambda: [S3Folder.id],
    )
    documents: Mapped[list["S3Document"]] = relationship(
        back_populates="parent_folder",
    )


class S3Document(Base):
    __tablename__ = "s3_documents"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    url: Mapped[str] = mapped_column(String)
    name: Mapped[str] = mapped_column(String(255))
    content_type: Mapped[str] = mapped_column(String(255))
    folder_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("s3_folders.id"),
    )
    parent_folder: Mapped[S3Folder | None] = relationship(
        back_populates="documents",
    )
