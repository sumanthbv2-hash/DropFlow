from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.models import Workspace, ContentBlock
from app.schemas.schemas import (
    ContentBlockCreate,
    ContentBlockUpdate,
    ContentBlockResponse,
    BlockReorderRequest
)
from app.services.block_service import (
    get_workspace_blocks,
    create_block,
    update_block,
    reorder_blocks,
    delete_block
)
from app.services.auth_service import verify_password
from app.websocket.manager import manager

router = APIRouter(prefix="/api", tags=["content-blocks"])

def check_workspace_access_by_id(db: Session, workspace_id: str, x_workspace_password: Optional[str] = None) -> Workspace:
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    if ws.password_hash:
        if not x_workspace_password or not verify_password(x_workspace_password, ws.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Password required")
    return ws

@router.get("/workspaces/{workspace_id}/blocks", response_model=List[ContentBlockResponse])
def list_workspace_blocks(
    workspace_id: str,
    db: Session = Depends(get_db),
    x_workspace_password: Optional[str] = Header(None)
):
    check_workspace_access_by_id(db, workspace_id, x_workspace_password)
    blocks = get_workspace_blocks(db, workspace_id)
    return blocks

@router.post("/workspaces/{workspace_id}/blocks", response_model=ContentBlockResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace_block(
    workspace_id: str,
    data: ContentBlockCreate,
    db: Session = Depends(get_db),
    x_workspace_password: Optional[str] = Header(None)
):
    ws = check_workspace_access_by_id(db, workspace_id, x_workspace_password)
    block = create_block(db, workspace_id, data)
    
    resp = ContentBlockResponse.model_validate(block)
    
    # Broadcast WS event
    await manager.broadcast_json(ws.slug, {
        "type": "block_created",
        "block": resp.model_dump(mode="json")
    })
    
    return resp

@router.patch("/blocks/{id}", response_model=ContentBlockResponse)
async def update_block_endpoint(
    id: str,
    data: ContentBlockUpdate,
    db: Session = Depends(get_db),
    x_workspace_password: Optional[str] = Header(None)
):
    block = db.query(ContentBlock).filter(ContentBlock.id == id).first()
    if not block:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content block not found")
        
    ws = check_workspace_access_by_id(db, block.workspace_id, x_workspace_password)
    updated = update_block(db, block, data)
    
    resp = ContentBlockResponse.model_validate(updated)
    
    # Broadcast WS event
    await manager.broadcast_json(ws.slug, {
        "type": "block_updated",
        "block": resp.model_dump(mode="json")
    })
    
    return resp

@router.post("/workspaces/{workspace_id}/blocks/reorder", status_code=status.HTTP_200_OK)
async def reorder_workspace_blocks(
    workspace_id: str,
    body: BlockReorderRequest,
    db: Session = Depends(get_db),
    x_workspace_password: Optional[str] = Header(None)
):
    ws = check_workspace_access_by_id(db, workspace_id, x_workspace_password)
    reorder_blocks(db, workspace_id, body.blocks)
    
    await manager.broadcast_json(ws.slug, {
        "type": "blocks_reordered",
        "order": [item.model_dump() for item in body.blocks]
    })
    
    return {"message": "Blocks reordered successfully"}

@router.delete("/blocks/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_block_endpoint(
    id: str,
    db: Session = Depends(get_db),
    x_workspace_password: Optional[str] = Header(None)
):
    block = db.query(ContentBlock).filter(ContentBlock.id == id).first()
    if not block:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content block not found")
        
    ws = check_workspace_access_by_id(db, block.workspace_id, x_workspace_password)
    block_id = block.id
    delete_block(db, block)
    
    await manager.broadcast_json(ws.slug, {
        "type": "block_deleted",
        "block_id": block_id
    })
    
    return None
