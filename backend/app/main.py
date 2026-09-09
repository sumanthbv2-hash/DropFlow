import asyncio
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.api.workspaces import router as workspaces_router
from app.api.blocks import router as blocks_router
from app.api.files import router as files_router
from app.api.search import router as search_router
from app.websocket.manager import manager
from app.services.cleanup_service import purge_expired_workspaces

# Create database tables automatically on startup
Base.metadata.create_all(bind=engine)

async def periodic_cleanup_task():
    while True:
        try:
            purge_expired_workspaces()
        except Exception as e:
            print(f"[Cleanup Error] {e}")
        await asyncio.sleep(60) # Run cleanup every 60 seconds

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: launch background cleanup task
    cleanup_task = asyncio.create_task(periodic_cleanup_task())
    yield
    # Shutdown
    cleanup_task.cancel()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="YourPad - Real-time Collaborative Multi-Content Workspace API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(workspaces_router)
app.include_router(blocks_router)
app.include_router(files_router)
app.include_router(search_router)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME}

@app.websocket("/ws/pad/{slug}")
async def websocket_endpoint(
    websocket: WebSocket,
    slug: str,
    client_id: str = Query(...)
):
    await manager.connect(slug, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(slug, websocket)
        await manager.broadcast_presence(slug)
    except Exception as e:
        manager.disconnect(slug, websocket)
        await manager.broadcast_presence(slug)
