from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.models.models import Workspace, ContentBlock
from app.schemas.schemas import SearchResponse, SearchResultItem
from app.services.auth_service import verify_password

router = APIRouter(prefix="/api", tags=["search"])

@router.get("/workspaces/{slug}/search", response_model=SearchResponse)
def search_workspace_content(
    slug: str,
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    x_workspace_password: Optional[str] = Header(None)
):
    ws = db.query(Workspace).filter(Workspace.slug == slug).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    if ws.password_hash:
        if not x_workspace_password or not verify_password(x_workspace_password, ws.password_hash):
            raise HTTPException(status_code=401, detail="Password required")

    blocks = db.query(ContentBlock).filter(ContentBlock.workspace_id == ws.id).all()
    results: List[SearchResultItem] = []
    
    query_lower = q.lower()
    
    for b in blocks:
        data = b.data or {}
        matched = False
        matched_field = ""
        snippet = ""
        
        if b.type == "text":
            text_content = data.get("text", "") or data.get("content", "")
            if query_lower in text_content.lower():
                matched = True
                matched_field = "text"
                idx = text_content.lower().find(query_lower)
                start = max(0, idx - 20)
                end = min(len(text_content), idx + len(query_lower) + 30)
                snippet = text_content[start:end]
        elif b.type == "code":
            code = data.get("code", "")
            if query_lower in code.lower():
                matched = True
                matched_field = "code"
                snippet = code[:80]
        elif b.type in ("file", "pdf", "image", "video", "audio"):
            filename = data.get("original_filename", "") or data.get("filename", "")
            caption = data.get("caption", "")
            if query_lower in filename.lower() or query_lower in caption.lower():
                matched = True
                matched_field = "filename" if query_lower in filename.lower() else "caption"
                snippet = filename or caption
        elif b.type in ("link", "embed"):
            url = data.get("url", "")
            title = data.get("title", "")
            if query_lower in url.lower() or query_lower in title.lower():
                matched = True
                matched_field = "url/title"
                snippet = title or url

        if matched:
            results.append(SearchResultItem(
                block_id=b.id,
                type=b.type,
                snippet=snippet,
                matched_field=matched_field
            ))

    return SearchResponse(
        workspace_slug=slug,
        query=q,
        results=results
    )
