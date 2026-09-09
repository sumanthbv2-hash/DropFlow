import os
from pathlib import Path
from dotenv import load_dotenv

# Load root .env if present
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    PROJECT_NAME: str = "YourPad"
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "t")
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "default-secret-key-change-in-prod")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./yourpad.db")
    
    # Storage
    STORAGE_TYPE: str = os.getenv("STORAGE_TYPE", "local")
    LOCAL_STORAGE_DIR: str = os.getenv("LOCAL_STORAGE_DIR", "./storage")
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "50"))
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "*"
    ]

settings = Settings()
