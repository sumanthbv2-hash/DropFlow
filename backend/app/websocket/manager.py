import json
from typing import Dict, List, Set
from fastapi import WebSocket, WebSocketDisconnect

class ConnectionManager:
    def __init__(self):
        # Maps slug -> List[WebSocket]
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, slug: str, websocket: WebSocket):
        await websocket.accept()
        if slug not in self.active_connections:
            self.active_connections[slug] = []
        self.active_connections[slug].append(websocket)
        
        # Broadcast updated presence count
        await self.broadcast_presence(slug)

    def disconnect(self, slug: str, websocket: WebSocket):
        if slug in self.active_connections:
            if websocket in self.active_connections[slug]:
                self.active_connections[slug].remove(websocket)
            if not self.active_connections[slug]:
                del self.active_connections[slug]

    async def broadcast_presence(self, slug: str):
        if slug not in self.active_connections:
            return
            
        count = len(self.active_connections[slug])
        message = {
            "type": "presence_update",
            "slug": slug,
            "active_users": count
        }
        await self.broadcast_json(slug, message)

    async def broadcast_json(self, slug: str, message: dict, sender: WebSocket = None):
        if slug not in self.active_connections:
            return
            
        dead_sockets = []
        for connection in self.active_connections[slug]:
            if connection != sender:
                try:
                    await connection.send_json(message)
                except Exception:
                    dead_sockets.append(connection)
                    
        for dead in dead_sockets:
            self.disconnect(slug, dead)

manager = ConnectionManager()
