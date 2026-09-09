# YourPad Architecture Specification

This document details the architectural design, component interactions, database schema, security features, and WebSocket protocols of **YourPad**.

---

## High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT BROWSER                                    |
|                                                                                   |
|  Next.js 14 Frontend (App Router, React 18, Tailwind CSS, Lucide Icons, TypeScript) |
|  - Landing Page (/)                                                               |
|  - Pad Workspace (/pad/[slug])                                                    |
|  - Custom Hooks: useWebSocket                                                     |
+--------------------------+--------------------------------+-----------------------+
                           |                                |
                   HTTP / REST APIs                   WebSocket Connection
               (JSON & Multipart Uploads)            (ws://.../ws/pad/{slug})
                           |                                |
+--------------------------v--------------------------------v-----------------------+
|                                FASTAPI BACKEND SERVER                             |
|                                                                                   |
|  +----------------------+  +---------------------+  +--------------------------+  |
|  | REST API Routers     |  | WebSocket Manager   |  | Background Services      |  |
|  | - Workspaces Router  |  | - Active Connections|  | - Cleanup Worker (Purge) |  |
|  | - Blocks Router      |  | - Presence Count    |  | - Storage Abstraction    |  |
|  | - Files Router       |  | - Event Broadcaster |  | - PBKDF2 Password Auth   |  |
|  | - Search Router      |  |                     |  |                          |  |
|  +----------+-----------+  +----------+----------+  +------------+-------------+  |
+-------------|-------------------------|--------------------------|----------------+
              |                         |                          |
              v                         v                          v
+-----------------------------+  +---------------+  +-------------------------------+
|     DATABASE LAYER          |  | REDIS (Opt)   |  |    STORAGE LAYER              |
|  SQLAlchemy ORM             |  | WebSocket     |  | BaseStorageService            |
|  - SQLite (Local Dev)       |  | Pub/Sub Broker|  | - LocalStorageService         |
|  - PostgreSQL (Production)  |  +---------------+  |   (./storage/ directory)      |
+-----------------------------+                     | - S3StorageService (AWS S3)   |
                                                    +-------------------------------+
```

---

## Key Components

### 1. Frontend Layer (`/frontend`)
- **App Router (`app/`)**: Provides `/` (Landing Page) and `/pad/[slug]` (Pad Workspace Page).
- **Header Component (`components/Header.tsx`)**: Displays sync state ("Saved", "Saving...", "Offline"), online user presence badge, editable pad title, theme toggle, and trigger buttons for Share, Settings, and Search modals.
- **Content Blocks (`components/blocks/`)**:
  - `TextBlock`: Rich text formatting with debounced auto-save.
  - `CodeBlock`: Multi-language editor with line numbers and syntax styling.
  - `ImageBlock`, `VideoBlock`, `AudioBlock`, `PdfBlock`, `FileBlock`: File preview, player controls, metadata display, and replacement.
  - `LinkBlock`: Link detection & YouTube embed player.
  - `BlockWrapper`: Contextual block control bar (drag handle, duplicate, move up/down, delete confirmation).
- **Modals (`components/modals/`)**:
  - `ShareModal`: Copy URL, QR code display, access rights info.
  - `PasswordModal`: Unlocks password-protected workspaces.
  - `SettingsModal`: Custom title, password setting, and expiration timer (Never, 1 hr, 1 day, 7 days, 30 days).
  - `SearchModal`: Real-time query search across workspace contents with jump-to-block navigation.

---

### 2. Backend API & Services Layer (`/backend/app`)
- **Workspace Service (`services/workspace_service.py`)**: Generates unique slugs, manages metadata, checks expiration timestamps.
- **Content Block Service (`services/block_service.py`)**: Handles CRUD operations and position reordering for content blocks.
- **Auth & Security Service (`services/auth_service.py`)**: Hashes pad passwords using PBKDF2-SHA256 with random 16-byte hex salts.
- **WebSocket Manager (`websocket/manager.py`)**: Manages per-pad WebSocket connections, tracks active online user count, and broadcasts block mutation events to all connected clients.
- **Expiration Cleanup Service (`services/cleanup_service.py`)**: Async worker that periodically purges expired workspaces and deletes associated physical files from storage.

---

### 3. Database Schema (`/backend/app/models/models.py`)

#### `workspaces` Table
- `id` (String, PK)
- `slug` (String, Unique Index)
- `title` (String)
- `owner_id` (String, FK to users.id, optional)
- `visibility` (String: "public" or "private")
- `password_hash` (String, optional)
- `created_at` (DateTime)
- `updated_at` (DateTime)
- `expires_at` (DateTime, optional)

#### `content_blocks` Table
- `id` (String, PK)
- `workspace_id` (String, FK to workspaces.id)
- `type` (String: "text", "image", "video", "audio", "file", "pdf", "code", "link", "embed")
- `position` (Integer)
- `data` (JSON)
- `created_by` (String, optional)
- `created_at` (DateTime)
- `updated_at` (DateTime)

#### `files` Table
- `id` (String, PK)
- `workspace_id` (String, FK to workspaces.id)
- `block_id` (String, FK to content_blocks.id, optional)
- `original_filename` (String)
- `storage_path` (String)
- `mime_type` (String)
- `size` (Integer)
- `created_at` (DateTime)

---

## WebSocket Communication Protocol

### Connection URL
`ws://localhost:8000/ws/pad/{slug}?client_id={clientId}`

### Server-to-Client Broadcast Events

1. **`presence_update`**:
   ```json
   {
     "type": "presence_update",
     "slug": "my-pad-123",
     "active_users": 3
   }
   ```

2. **`block_created`**:
   ```json
   {
     "type": "block_created",
     "block": { "id": "blk_123", "type": "text", "position": 0, "data": { "text": "Hello" } }
   }
   ```

3. **`block_updated`**:
   ```json
   {
     "type": "block_updated",
     "block": { "id": "blk_123", "type": "text", "position": 0, "data": { "text": "Updated content" } }
   }
   ```

4. **`block_deleted`**:
   ```json
   {
     "type": "block_deleted",
     "block_id": "blk_123"
   }
   ```

5. **`blocks_reordered`**:
   ```json
   {
     "type": "blocks_reordered",
     "order": [ { "id": "blk_123", "position": 0 }, { "id": "blk_456", "position": 1 } ]
   }
   ```

6. **`title_updated`**:
   ```json
   {
     "type": "title_updated",
     "title": "New Workspace Title"
   }
   ```

---

## Security Implementation

1. **Path Traversal Protection**: File download endpoints sanitize filenames using `Path(filename).name` and verify that resolved absolute paths remain strictly within `LOCAL_STORAGE_DIR`.
2. **Password Security**: Passwords are never stored in plaintext. They are salted with 16-byte random salts and hashed via PBKDF2-HMAC-SHA256 (100,000 iterations).
3. **MIME & File Size Validation**: Upload requests validate content types against allowed MIME types and enforce the configured `MAX_FILE_SIZE_MB` (default: 50MB).
4. **No Server Execution**: Code blocks are treated purely as text with syntax highlighting. User-supplied code is never executed on the backend.
