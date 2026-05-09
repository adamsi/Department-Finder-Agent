from typing import Optional
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

class S3Folder(Base):
    __tablename__ = "s3_folders"

    id: Mapped[int] = mapped_column(primary_key=True)
    parent_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("s3_folders.id"),
        nullable=True,
    )
    subfolders: Mapped[list["S3Folder"]] = relationship(
        back_populates="parent",
    )
    parent: Mapped[Optional["S3Folder"]] = relationship(
        back_populates="subfolders",
        remote_side=lambda: [S3Folder.id],
    )
    documents: Mapped[list["S3Document"]] = relationship(
        back_populates="parent_folder",
    )

class S3Document(Base):
    __tablename__ = "s3_documents"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    url: Mapped[str] = mapped_column(String)
    name: Mapped[str] = mapped_column(String)
    content_type: Mapped[str] = mapped_column("content_type", String)
    folder_id: Mapped[int] = mapped_column(ForeignKey("s3_folders.id"))
    parent_folder: Mapped[Optional["S3Folder"]] = relationship(
        back_populates="documents",
    )