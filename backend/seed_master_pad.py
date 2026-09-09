import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import SessionLocal, Base, engine
from app.models.models import Workspace, ContentBlock
from app.services.auth_service import hash_password

db = SessionLocal()

slug = 'master-design-2026'
existing = db.query(Workspace).filter(Workspace.slug == slug).first()
if existing:
    db.delete(existing)
    db.commit()

ws = Workspace(
    slug=slug,
    title='🚀 Master Design Workspace 2026',
    visibility='public',
    password_hash=hash_password('YourPad2026!')
)
db.add(ws)
db.commit()
db.refresh(ws)

# Add sample blocks
b1 = ContentBlock(
    workspace_id=ws.id,
    type='text',
    position=0,
    data={'text': '<h1>✨ Welcome to YourPad Master Workspace!</h1><p>This is a <b>secure, real-time collaborative pad</b>. You unlocked this page with your unique code and password!</p><ul><li><b>Real-time collaboration</b> via WebSockets</li><li><b>Password protected</b> & auto-saved</li><li>Supports <b>Code, Images, Videos, Audio, PDFs, Files & Links</b></li></ul>'}
)

b2 = ContentBlock(
    workspace_id=ws.id,
    type='code',
    position=1,
    data={
        'language': 'python',
        'code': '# YourPad Real-Time Collaboration Engine\nimport asyncio\nfrom fastapi import FastAPI, WebSocket\n\napp = FastAPI(title="YourPad Engine")\n\n@app.websocket("/ws/pad/{slug}")\nasync def pad_websocket(websocket: WebSocket, slug: str):\n    await websocket.accept()\n    print(f"Connected client to pad: {slug}")\n    await websocket.send_json({"type": "presence", "status": "online"})\n'
    }
)

b3 = ContentBlock(
    workspace_id=ws.id,
    type='link',
    position=2,
    data={
        'url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'title': 'YouTube Embedded Showcase Video'
    }
)

db.add_all([b1, b2, b3])
db.commit()
print("Successfully created master pad 'master-design-2026' with password 'YourPad2026!'")
