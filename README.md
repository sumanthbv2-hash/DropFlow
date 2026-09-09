# YourPad - Collaborative Shared Online Workspace

YourPad is a modern, feature-rich collaborative online workspace inspired by Dontpad, but significantly enhanced with multi-format content blocks (Rich Text, Code Editor, Images, Video, Audio, Files, PDFs, Links & Embeds), real-time WebSocket presence, role permissions, password protection, auto-save, workspace search, and optional expiration policies.

---

## Features

- **Multi-Format Content Blocks**:
  - **Text**: Rich text editing with toolbar (Bold, Italic, Underline, Headings, Bullet/Numbered Lists, Quotes, Links, Undo/Redo) and debounced auto-save.
  - **Code**: Code editor supporting 10+ programming languages (Python, JS, TS, HTML, CSS, SQL, C++, Java, JSON) with line numbers and syntax highlighting (no server code execution).
  - **Image**: Drag & drop upload (JPG, PNG, WebP, GIF), dynamic dimension detection, image replacement, and preview.
  - **Video**: Drag & drop upload (MP4, WebM) with built-in video player and upload progress handling.
  - **Audio**: Track player with duration, play/pause controls, and file size metadata.
  - **File**: Custom document uploads (DOCX, PPTX, XLSX, ZIP, TXT, CSV) with extension badges and instant download.
  - **PDF**: Embedded inline PDF viewer with page navigation and download support.
  - **Link / Embed**: URL detection with Open Graph metadata and automatic YouTube video player embeds.

- **Real-Time Collaboration & Presence**:
  - WebSocket connection tracking online users per pad.
  - Real-time event broadcasting for created, updated, reordered, or deleted blocks and workspace title updates.

- **Security & Workspace Control**:
  - **Password Protection**: Optional SHA-256 salted password hashing to lock pads.
  - **Permissions**: Owner, Editor, and Viewer permission model.
  - **Expiration Policy**: Auto-purging of expired workspaces and physical files (1 hour, 1 day, 7 days, 30 days, or Never).
  - **File Security**: Path traversal protection, MIME-type validation, and file-size enforcement.

- **Search & Productivity**:
  - **In-Workspace Search**: Instant query search across text, code, file names, and link titles with jump-to-block navigation.
  - **Sharing**: One-click URL copy, QR Code generator, and public/private visibility control.
  - **Dark / Light Mode**: Full theme toggle support.

---

## Recommended Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, QR Code SVG.
- **Backend**: Python FastAPI, SQLAlchemy ORM, Pydantic V2, WebSockets, Pytest.
- **Database**: SQLite (Zero-config local development) / PostgreSQL (Production ready).
- **Storage**: Storage abstraction (`LocalStorageService` for local `./storage` and `S3StorageService` for AWS S3).
- **Orchestration**: Docker Compose for single-command stack deployment (PostgreSQL + Redis + FastAPI + Next.js).

---

## Folder Structure

```
yourpad/
│
├── frontend/                 # Next.js Frontend Application
│   ├── app/                  # App Router: Landing Page (/) & Pad Workspace (/pad/[slug])
│   ├── components/           # UI Components, Block Editors, Header & Modals
│   │   ├── blocks/           # Content block components (TextBlock, ImageBlock, CodeBlock, etc.)
│   │   └── modals/           # ShareModal, PasswordModal, SettingsModal, SearchModal
│   ├── hooks/                # Custom React hooks (useWebSocket)
│   ├── lib/                  # API client helpers (api.ts)
│   ├── types/                # TypeScript type definitions
│   └── package.json
│
├── backend/                  # Python FastAPI Backend Application
│   ├── app/
│   │   ├── api/              # REST Endpoints (workspaces, blocks, files, search)
│   │   ├── models/           # SQLAlchemy DB Models (Workspace, ContentBlock, FileRecord)
│   │   ├── schemas/          # Pydantic V2 Validation Schemas
│   │   ├── services/         # Business logic (workspace, block, auth, cleanup)
│   │   ├── storage/          # Local / AWS S3 Storage Abstraction
│   │   ├── websocket/        # Real-time WebSocket Connection Manager
│   │   └── main.py           # FastAPI Application Factory & Lifespan Tasks
│   ├── tests/                # Pytest Test Suite
│   └── requirements.txt
│
├── storage/                  # Local directory for file uploads
├── docker-compose.yml        # Docker Compose configuration
├── .env.example              # Environment variables template
├── README.md                 # Project Overview & Guide
└── ARCHITECTURE.md           # System Architecture Specification
```

---

## Getting Started (Local Development in VS Code)

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.9 or higher)
- **VS Code**

---

### Step 1: Backend Setup

1. Open a terminal in VS Code at the project root (`yourpad/`).
2. Create and activate a Python virtual environment:

   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install backend dependencies:

   ```bash
   pip install --only-binary=:all: -r backend/requirements.txt
   ```

4. Start the FastAPI backend server:

   ```bash
   # Make sure PYTHONPATH points to backend directory
   # Windows (PowerShell):
   $env:PYTHONPATH="backend"; .\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000

   # macOS / Linux:
   PYTHONPATH=backend uvicorn app.main:app --reload --port 8000
   ```

   The backend will start at `http://localhost:8000`. API documentation is available at `http://localhost:8000/docs`.

---

### Step 2: Frontend Setup

1. Open a new terminal tab in VS Code and navigate to `frontend/`:

   ```bash
   cd frontend
   ```

2. Install Node dependencies (if not already installed):

   ```bash
   npm install
   ```

3. Start the Next.js development server:

   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`.

---

## Environment Variables Configuration

Copy `.env.example` to `.env` in the root directory:

```env
PORT=8000
HOST=0.0.0.0
DEBUG=True
SECRET_KEY=yourpad-local-development-secret-key-39201948

# Database (Default: SQLite for zero-setup local dev)
DATABASE_URL=sqlite:///./yourpad.db
# For PostgreSQL: DATABASE_URL=postgresql://yourpad:yourpadpass@localhost:5432/yourpad

# Storage Configuration
STORAGE_TYPE=local
LOCAL_STORAGE_DIR=./storage
MAX_FILE_SIZE_MB=50

# S3 Configuration (Optional for AWS production)
# AWS_ACCESS_KEY_ID=your_key
# AWS_SECRET_ACCESS_KEY=your_secret
# AWS_REGION=us-east-1
# S3_BUCKET_NAME=yourpad-bucket

NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

---

## Running Backend Automated Tests

Run Pytest suite to verify API endpoints, database operations, permissions, and validation logic:

```bash
# Windows (PowerShell):
$env:PYTHONPATH="backend"; .\venv\Scripts\python.exe -m pytest backend/tests/test_api.py

# macOS / Linux:
PYTHONPATH=backend ./venv/bin/pytest backend/tests/test_api.py
```

---

## Running with Docker Compose (PostgreSQL + Redis + FastAPI + Next.js)

To run the complete production stack with PostgreSQL and Redis:

```bash
docker-compose up --build
```

---

## File Upload Architecture

File storage uses an abstract interface (`BaseStorageService`):
- **Local Storage (`LocalStorageService`)**: Saves uploads under `./storage/` with UUID filename sanitization to eliminate path traversal vulnerabilities.
- **S3 Storage (`S3StorageService`)**: Ready for cloud migration by setting `STORAGE_TYPE=s3` in `.env`.

---

## WebSocket & Real-Time Sync Architecture

- WebSockets connect at `ws://localhost:8000/ws/pad/{slug}?client_id={id}`.
- Tracks live presence (number of active connected users per workspace).
- Broadcasts `presence_update`, `block_created`, `block_updated`, `block_deleted`, `blocks_reordered`, and `title_updated` events across connected clients.

---

## Future Production Deployment Guide

1. **Database**: Point `DATABASE_URL` to a managed PostgreSQL instance (e.g. AWS RDS, Supabase, Neon).
2. **Storage**: Set `STORAGE_TYPE=s3` and configure AWS S3 bucket credentials.
3. **WebSockets**: Enable Redis backplane (`REDIS_URL`) for horizontal scaling across multiple FastAPI backend pods.
4. **Frontend**: Deploy `frontend` to Vercel, Netlify, or AWS Amplify with `NEXT_PUBLIC_API_URL` pointing to backend domain.
