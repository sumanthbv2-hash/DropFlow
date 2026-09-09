import os
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File as FastAPIFile, Form, status, Header
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
from app.config import settings
from app.database import get_db
from app.models.models import Workspace, FileRecord
from app.schemas.schemas import FileRecordResponse
from app.storage.factory import get_storage_service
from app.services.auth_service import verify_password

router = APIRouter(prefix="/api/files", tags=["files"])
storage = get_storage_service()

ALLOWED_MIME_TYPES = {
    # Images
    "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml",
    # Videos
    "video/mp4", "video/webm", "video/ogg",
    # Audio
    "audio/mpeg", "audio/wav", "audio/ogg", "audio/mp3", "audio/webm",
    # Documents
    "application/pdf", "text/plain", "text/csv",
    "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/zip", "application/x-zip-compressed", "application/octet-stream"
}

@router.post("/upload", response_model=FileRecordResponse, status_code=status.HTTP_201_CREATED)
async def upload_file_endpoint(
    workspace_id: str = Form(...),
    block_id: Optional[str] = Form(None),
    file: UploadFile = FastAPIFile(...),
    db: Session = Depends(get_db),
    x_workspace_password: Optional[str] = Header(None)
):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    if ws.password_hash:
        if not x_workspace_password or not verify_password(x_workspace_password, ws.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Password required")

    # Size check
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum size limit of {settings.MAX_FILE_SIZE_MB}MB"
        )

    mime_type = file.content_type or "application/octet-stream"
    if mime_type not in ALLOWED_MIME_TYPES:
        # Fallback soft check based on extension for arbitrary document uploads
        ext = Path(file.filename).suffix.lower()
        if not ext:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {mime_type}"
            )

    storage_path = storage.save_file(file.file, file.filename, mime_type)
    file_url = storage.get_url(storage_path)

    file_record = FileRecord(
        workspace_id=workspace_id,
        block_id=block_id,
        original_filename=file.filename,
        storage_path=storage_path,
        mime_type=mime_type,
        size=file_size
    )

    db.add(file_record)
    db.commit()
    db.refresh(file_record)

    return FileRecordResponse(
        id=file_record.id,
        workspace_id=file_record.workspace_id,
        block_id=file_record.block_id,
        original_filename=file_record.original_filename,
        mime_type=file_record.mime_type,
        size=file_record.size,
        url=file_url,
        created_at=file_record.created_at
    )

@router.get("/download/{filename}")
def download_local_file(filename: str):
    base_dir = Path(settings.LOCAL_STORAGE_DIR).resolve()
    target_path = (base_dir / Path(filename).name).resolve()
    
    # Path traversal safety check
    if not str(target_path).startswith(str(base_dir)):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    if not target_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
        
    return FileResponse(target_path)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file_endpoint(
    id: str,
    db: Session = Depends(get_db),
    x_workspace_password: Optional[str] = Header(None)
):
    file_record = db.query(FileRecord).filter(FileRecord.id == id).first()
    if not file_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    ws = db.query(Workspace).filter(Workspace.id == file_record.workspace_id).first()
    if ws and ws.password_hash:
        if not x_workspace_password or not verify_password(x_workspace_password, ws.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Password required")

    try:
        storage.delete_file(file_record.storage_path)
    except Exception as e:
        print(f"File delete error: {e}")

    db.delete(file_record)
    db.commit()
    return None
