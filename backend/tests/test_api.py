import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db

# Use in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_yourpad.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test_yourpad.db"):
        try:
            os.remove("./test_yourpad.db")
        except Exception:
            pass

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_workspace_creation_and_retrieval():
    # 1. Create pad
    create_resp = client.post("/api/workspaces", json={"title": "My Test Pad", "slug": "test-pad-101"})
    assert create_resp.status_code == 201
    data = create_resp.json()
    assert data["slug"] == "test-pad-101"
    assert data["title"] == "My Test Pad"

    # 2. Retrieve pad by slug
    get_resp = client.get(f"/api/workspaces/{data['slug']}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == data["id"]

def test_content_block_lifecycle():
    # Create pad
    pad_resp = client.post("/api/workspaces", json={"title": "Block Pad"})
    ws_id = pad_resp.json()["id"]
    ws_slug = pad_resp.json()["slug"]

    # 1. Create Text Block
    block_resp = client.post(f"/api/workspaces/{ws_id}/blocks", json={
        "type": "text",
        "data": {"text": "Hello world from test"}
    })
    assert block_resp.status_code == 201
    block = block_resp.json()
    assert block["type"] == "text"
    assert block["data"]["text"] == "Hello world from test"

    # 2. List Blocks
    list_resp = client.get(f"/api/workspaces/{ws_id}/blocks")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1

    # 3. Update Block
    update_resp = client.patch(f"/api/blocks/{block['id']}", json={
        "data": {"text": "Updated text"}
    })
    assert update_resp.status_code == 200
    assert update_resp.json()["data"]["text"] == "Updated text"

    # 4. Search Block
    search_resp = client.get(f"/api/workspaces/{ws_slug}/search?q=Updated")
    assert search_resp.status_code == 200
    assert len(search_resp.json()["results"]) == 1

    # 5. Delete Block
    del_resp = client.delete(f"/api/blocks/{block['id']}")
    assert del_resp.status_code == 204

def test_workspace_password_protection():
    # Create protected pad
    pad_resp = client.post("/api/workspaces", json={
        "title": "Secret Pad",
        "password": "supersecretpassword"
    })
    ws_slug = pad_resp.json()["slug"]

    # Attempt access without password header -> 401
    unauth_resp = client.get(f"/api/workspaces/{ws_slug}")
    assert unauth_resp.status_code == 401

    # Access with valid password header -> 200
    auth_resp = client.get(f"/api/workspaces/{ws_slug}", headers={"x-workspace-password": "supersecretpassword"})
    assert auth_resp.status_code == 200
