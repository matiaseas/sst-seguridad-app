import os
import sys
from pathlib import Path
from pydantic import BaseModel

IS_FROZEN = getattr(sys, "frozen", False)

if IS_FROZEN:
    # Directorio temporal de extracción de recursos empaquetados (HTML, CSS, JS)
    BUNDLE_DIR = Path(sys._MEIPASS)
    # Directorio donde reside el archivo .exe (para persistir datos y fotos)
    EXE_DIR = Path(sys.executable).parent
    BASE_DIR = BUNDLE_DIR
    DATA_DIR = EXE_DIR / "data"
    UPLOAD_DIR = DATA_DIR / "uploads"
    STATIC_DIR = BUNDLE_DIR / "app" / "static"
else:
    BASE_DIR = Path(__file__).resolve().parent.parent
    DATA_DIR = BASE_DIR / "data"
    UPLOAD_DIR = BASE_DIR / "app" / "static" / "uploads"
    STATIC_DIR = BASE_DIR / "app" / "static"

DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseModel):
    PROJECT_NAME: str = "SST - Gestión de Condiciones e Incidentes"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "sst-super-secret-key-for-jwt-tokens-2026-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 horas para facilitar demostración
    
    # Base de datos SQLite local en modo WAL
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR.as_posix()}/sst_database.db")
    
    # Rutas
    BASE_DIR: Path = BASE_DIR
    UPLOAD_DIR: Path = UPLOAD_DIR
    DATA_DIR: Path = DATA_DIR
    STATIC_DIR: Path = STATIC_DIR
    IS_FROZEN: bool = IS_FROZEN
    
    # Configuración de Negocio por defecto
    ALLOW_ANONYMOUS_REPORTS: bool = True
    REPORT_CODE_PREFIX: str = "SST"
    CURRENT_YEAR: int = 2026

settings = Settings()
