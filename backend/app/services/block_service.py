from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.models.models import ContentBlock
from app.schemas.schemas import ContentBlockCreate, ContentBlockUpdate, BlockReorderItem

def get_workspace_blocks(db: Session, workspace_id: str) -> List[ContentBlock]:
    return db.query(ContentBlock).filter(
        ContentBlock.workspace_id == workspace_id
    ).order_by(ContentBlock.position.asc()).all()

def create_block(db: Session, workspace_id: str, data: ContentBlockCreate) -> ContentBlock:
    if data.position is None:
        # Put at the end
        max_pos = db.query(ContentBlock.position).filter(
            ContentBlock.workspace_id == workspace_id
        ).order_by(ContentBlock.position.desc()).first()
        
        position = (max_pos[0] + 1) if max_pos else 0
    else:
        position = data.position

    block = ContentBlock(
        workspace_id=workspace_id,
        type=data.type,
        position=position,
        data=data.data or {},
        created_by=data.created_by
    )
    
    db.add(block)
    db.commit()
    db.refresh(block)
    return block

def update_block(db: Session, block: ContentBlock, data: ContentBlockUpdate) -> ContentBlock:
    if data.data is not None:
        # Merge or replace block data
        current_data = dict(block.data or {})
        current_data.update(data.data)
        block.data = current_data
        
    if data.position is not None:
        block.position = data.position

    block.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(block)
    return block

def reorder_blocks(db: Session, workspace_id: str, items: List[BlockReorderItem]):
    for item in items:
        db.query(ContentBlock).filter(
            ContentBlock.id == item.id,
            ContentBlock.workspace_id == workspace_id
        ).update({"position": item.position, "updated_at": datetime.now(timezone.utc)})
    db.commit()

def delete_block(db: Session, block: ContentBlock):
    db.delete(block)
    db.commit()
