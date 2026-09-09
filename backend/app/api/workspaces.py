from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.schemas.schemas import (
    WorkspaceCreate,
    WorkspaceUpdate,
    WorkspaceResponse,
    WorkspaceVerifyPassword
)
from app.services.workspace_service import (
    create_workspace,
    get_workspace_by_slug,
    update_workspace,
    delete_workspace
)
from app.services.auth_service import verify_password
from app.websocket.manager import manager

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])

def check_workspace_access(workspace, x_workspace_password: Optional[str] = None):
    """Utility to verify password protection on a workspace."""
    if workspace.password_hash:
        if not x_workspace_password or not verify_password(x_workspace_password, workspace.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Workspace is password protected. Invalid or missing password."
            )

@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
def create_new_workspace(data: WorkspaceCreate, db: Session = Depends(get_db)):
    ws = create_workspace(db, data)
    return WorkspaceResponse(
        id=ws.id,
        slug=ws.slug,
        title=ws.title,
        owner_id=ws.owner_id,
        visibility=ws.visibility,
        has_password=ws.password_hash is not None,
        created_at=ws.created_at,
        updated_at=ws.updated_at,
        expires_at=ws.expires_at
    )

@router.get("/{slug}", response_model=WorkspaceResponse)
def read_workspace(
    slug: str,
    db: Session = Depends(get_db),
    x_workspace_password: Optional[str] = Header(None)
):
    ws = get_workspace_by_slug(db, slug)
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found or expired")
    
    # If password protected, require password match
    check_workspace_access(ws, x_workspace_password)

    return WorkspaceResponse(
        id=ws.id,
        slug=ws.slug,
        title=ws.title,
        owner_id=ws.owner_id,
        visibility=ws.visibility,
        has_password=ws.password_hash is not None,
        created_at=ws.created_at,
        updated_at=ws.updated_at,
        expires_at=ws.expires_at
    )

@router.post("/{slug}/verify-password")
def verify_workspace_password(
    slug: str,
    body: WorkspaceVerifyPassword,
    db: Session = Depends(get_db)
):
    ws = get_workspace_by_slug(db, slug)
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
        
    if not ws.password_hash:
        return {"valid": True, "message": "No password required"}

    if verify_password(body.password, ws.password_hash):
        return {"valid": True}
    
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password")

@router.patch("/{id}", response_model=WorkspaceResponse)
async def update_workspace_details(
    id: str,
    data: WorkspaceUpdate,
    db: Session = Depends(get_db),
    x_workspace_password: Optional[str] = Header(None)
):
    from app.models.models import Workspace
    ws = db.query(Workspace).filter(Workspace.id == id).first()
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    check_workspace_access(ws, x_workspace_password)

    updated_ws = update_workspace(db, ws, data)
    
    # Broadcast title update over WS if title changed
    if data.title:
        await manager.broadcast_json(updated_ws.slug, {
            "type": "title_updated",
            "title": updated_ws.title
        })

    return WorkspaceResponse(
        id=updated_ws.id,
        slug=updated_ws.slug,
        title=updated_ws.title,
        owner_id=updated_ws.owner_id,
        visibility=updated_ws.visibility,
        has_password=updated_ws.password_hash is not None,
        created_at=updated_ws.created_at,
        updated_at=updated_ws.updated_at,
        expires_at=updated_ws.expires_at
    )

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workspace_by_id(
    id: str,
    db: Session = Depends(get_db),
    x_workspace_password: Optional[str] = Header(None)
):
    from app.models.models import Workspace
    ws = db.query(Workspace).filter(Workspace.id == id).first()
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    check_workspace_access(ws, x_workspace_password)
    delete_workspace(db, ws)
    return None
