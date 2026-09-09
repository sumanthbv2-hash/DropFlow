from app.config import settings
from app.storage.base import BaseStorageService
from app.storage.local_storage import LocalStorageService
from app.storage.s3_storage import S3StorageService

def get_storage_service() -> BaseStorageService:
    if settings.STORAGE_TYPE.lower() == "s3":
        return S3StorageService()
    return LocalStorageService()
