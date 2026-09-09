import os
import uuid
from pathlib import Path
from typing import BinaryIO
from app.config import settings
from app.storage.base import BaseStorageService

class LocalStorageService(BaseStorageService):
    def __init__(self, base_dir: str = None):
        self.base_dir = Path(base_dir or settings.LOCAL_STORAGE_DIR).resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _sanitize_filename(self, filename: str) -> str:
        # Strip directory path components to prevent path traversal
        clean_name = Path(filename).name
        # Keep extension safe
        ext = Path(clean_name).suffix
        safe_prefix = str(uuid.uuid4().hex[:12])
        return f"{safe_prefix}_{clean_name}"

    def save_file(self, file_obj: BinaryIO, filename: str, content_type: str) -> str:
        safe_name = self._sanitize_filename(filename)
        file_path = self.base_dir / safe_name
        
        with open(file_path, "wb") as f:
            file_obj.seek(0)
            while chunk := file_obj.read(1024 * 1024):
                f.write(chunk)
                
        return safe_name

    def delete_file(self, storage_path: str) -> bool:
        # Ensure path stays within base_dir
        target_path = (self.base_dir / Path(storage_path).name).resolve()
        if not str(target_path).startswith(str(self.base_dir)):
            raise ValueError("Path traversal attempt detected")
            
        if target_path.exists():
            os.remove(target_path)
            return True
        return False

    def get_url(self, storage_path: str) -> str:
        safe_name = Path(storage_path).name
        return f"/api/files/download/{safe_name}"
