from abc import ABC, abstractmethod
from typing import BinaryIO

class BaseStorageService(ABC):
    @abstractmethod
    def save_file(self, file_obj: BinaryIO, filename: str, content_type: str) -> str:
        """Saves file and returns relative storage path or key."""
        pass

    @abstractmethod
    def delete_file(self, storage_path: str) -> bool:
        """Deletes file from storage."""
        pass

    @abstractmethod
    def get_url(self, storage_path: str) -> str:
        """Returns public URL for stored file."""
        pass
