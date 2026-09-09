import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, JSON, Enum
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    workspaces = relationship("Workspace", back_populates="owner")

class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(String, primary_key=True, default=generate_uuid)
    slug = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False, default="Untitled Pad")
    owner_id = Column(String, ForeignKey("users.id"), nullable=True)
    visibility = Column(String, default="public") # public, private
    password_hash = Column(String, nullable=True) # Optional password protection
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=True) # Optional expiration timestamp

    owner = relationship("User", back_populates="workspaces")
    members = relationship("WorkspaceMember", back_populates="workspace", cascade="all, delete-orphan")
    blocks = relationship("ContentBlock", back_populates="workspace", cascade="all, delete-orphan", order_by="ContentBlock.position")
    files = relationship("FileRecord", back_populates="workspace", cascade="all, delete-orphan")

class WorkspaceMember(Base):
    __tablename__ = "workspace_members"

    id = Column(String, primary_key=True, default=generate_uuid)
    workspace_id = Column(String, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    role = Column(String, default="editor") # owner, editor, viewer
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    workspace = relationship("Workspace", back_populates="members")

class ContentBlock(Base):
    __tablename__ = "content_blocks"

    id = Column(String, primary_key=True, default=generate_uuid)
    workspace_id = Column(String, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String, nullable=False) # text, image, video, audio, file, pdf, code, link, embed
    position = Column(Integer, nullable=False, default=0)
    data = Column(JSON, nullable=False, default=dict)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    workspace = relationship("Workspace", back_populates="blocks")
    files = relationship("FileRecord", back_populates="block", cascade="all, delete-orphan")

class FileRecord(Base):
    __tablename__ = "files"

    id = Column(String, primary_key=True, default=generate_uuid)
    workspace_id = Column(String, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    block_id = Column(String, ForeignKey("content_blocks.id", ondelete="CASCADE"), nullable=True, index=True)
    original_filename = Column(String, nullable=False)
    storage_path = Column(String, nullable=False)
    mime_type = Column(String, nullable=False)
    size = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    workspace = relationship("Workspace", back_populates="files")
    block = relationship("ContentBlock", back_populates="files")
