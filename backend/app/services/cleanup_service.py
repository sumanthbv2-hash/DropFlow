from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.models import Workspace, FileRecord
from app.storage.factory import get_storage_service

def purge_expired_workspaces():
    """Finds expired workspaces, deletes linked physical files, and removes DB records."""
    db: Session = SessionLocal()
    storage = get_storage_service()
    
    try:
        now = datetime.now(timezone.utc)
        expired_pads = db.query(Workspace).filter(
            Workspace.expires_at.isnot(None),
            Workspace.expires_at <= now
        ).all()
        
        for pad in expired_pads:
            # Delete physical files
            files = db.query(FileRecord).filter(FileRecord.workspace_id == pad.id).all()
            for f in files:
                try:
                    storage.delete_file(f.storage_path)
                except Exception as e:
                    print(f"Error deleting storage file {f.storage_path}: {e}")
                    
            db.delete(pad)
            
        if expired_pads:
            db.commit()
            print(f"[Cleanup] Purged {len(expired_pads)} expired workspace(s).")
    except Exception as e:
        print(f"[Cleanup Error] {e}")
        db.rollback()
    finally:
        db.close()
