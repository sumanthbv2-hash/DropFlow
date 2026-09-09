import re
import secrets
import string
from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.models.models import Workspace
from app.schemas.schemas import WorkspaceCreate, WorkspaceUpdate
from app.services.auth_service import hash_password

def generate_random_slug(length: int = 8) -> str:
    alphabet = string.ascii_lowercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))

def sanitize_slug(slug: str) -> str:
    slug = slug.strip().lower()
    slug = re.sub(r'[^a-z0-9\-]', '-', slug)
    slug = re.sub(r'-+', '-', slug).strip('-')
    return slug or generate_random_slug()

def create_workspace(db: Session, data: WorkspaceCreate) -> Workspace:
    if data.slug:
        slug = sanitize_slug(data.slug)
    else:
        slug = f"pad-{generate_random_slug(6)}"
        
    # Ensure unique slug
    existing = db.query(Workspace).filter(Workspace.slug == slug).first()
    if existing:
        slug = f"{slug}-{generate_random_slug(4)}"
        
    pwd_hash = hash_password(data.password) if data.password else None
    
    expires_at = None
    if data.expires_in_seconds and data.expires_in_seconds > 0:
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=data.expires_in_seconds)

    workspace = Workspace(
        slug=slug,
        title=data.title or "Untitled Pad",
        visibility=data.visibility or "public",
        password_hash=pwd_hash,
        expires_at=expires_at
    )
    
    db.add(workspace)
    db.commit()
    db.refresh(workspace)
    return workspace

def get_workspace_by_slug(db: Session, slug: str) -> Optional[Workspace]:
    workspace = db.query(Workspace).filter(Workspace.slug == slug).first()
    if not workspace:
        return None
        
    # Check if expired
    if workspace.expires_at:
        # ensure timezone aware comparison
        now = datetime.now(timezone.utc)
        exp = workspace.expires_at.replace(tzinfo=timezone.utc) if workspace.expires_at.tzinfo is None else workspace.expires_at
        if now > exp:
            return None # Expired pads are considered non-existent
            
    return workspace

def update_workspace(db: Session, workspace: Workspace, data: WorkspaceUpdate) -> Workspace:
    if data.title is not None:
        workspace.title = data.title
        
    if data.visibility is not None:
        workspace.visibility = data.visibility
        
    if data.remove_password:
        workspace.password_hash = None
    elif data.password:
        workspace.password_hash = hash_password(data.password)
        
    if data.expires_in_seconds is not None:
        if data.expires_in_seconds <= 0:
            workspace.expires_at = None
        else:
            workspace.expires_at = datetime.now(timezone.utc) + timedelta(seconds=data.expires_in_seconds)

    workspace.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(workspace)
    return workspace

def delete_workspace(db: Session, workspace: Workspace):
    db.delete(workspace)
    db.commit()
