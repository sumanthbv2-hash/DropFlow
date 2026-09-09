from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Any, Dict
from datetime import datetime

# --- Workspace Schemas ---
class WorkspaceCreate(BaseModel):
    title: Optional[str] = "Untitled Pad"
    slug: Optional[str] = None
    visibility: Optional[str] = "public"
    password: Optional[str] = None
    expires_in_seconds: Optional[int] = None

class WorkspaceUpdate(BaseModel):
    title: Optional[str] = None
    visibility: Optional[str] = None
    password: Optional[str] = None
    remove_password: Optional[bool] = False
    expires_in_seconds: Optional[int] = None

class WorkspaceVerifyPassword(BaseModel):
    password: str

class WorkspaceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    slug: str
    title: str
    owner_id: Optional[str] = None
    visibility: str
    has_password: bool
    created_at: datetime
    updated_at: datetime
    expires_at: Optional[datetime] = None

# --- Content Block Schemas ---
class ContentBlockCreate(BaseModel):
    type: str # text, image, video, audio, file, pdf, code, link, embed
    position: Optional[int] = None
    data: Optional[Dict[str, Any]] = {}
    created_by: Optional[str] = None

class ContentBlockUpdate(BaseModel):
    data: Optional[Dict[str, Any]] = None
    position: Optional[int] = None

class BlockReorderItem(BaseModel):
    id: str
    position: int

class BlockReorderRequest(BaseModel):
    blocks: List[BlockReorderItem]

class ContentBlockResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: str
    type: str
    position: int
    data: Dict[str, Any]
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

# --- File Schemas ---
class FileRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: str
    block_id: Optional[str] = None
    original_filename: str
    mime_type: str
    size: int
    url: str
    created_at: datetime

# --- Search Schema ---
class SearchResultItem(BaseModel):
    block_id: str
    type: str
    snippet: str
    matched_field: str

class SearchResponse(BaseModel):
    workspace_slug: str
    query: str
    results: List[SearchResultItem]
