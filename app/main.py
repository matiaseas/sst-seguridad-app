import io
import socket
from typing import Optional
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
import qrcode

from app.config import settings
from app.database import engine, Base, SessionLocal
import app.models
from app.services.seed_service import seed_database

# Importar enrutadores
from app.routers.auth import router as auth_router
from app.routers.reports import router as reports_router
from app.routers.risks import router as risks_router
from app.routers.actions import router as actions_router
from app.routers.dashboard import router as dashboard_router
from app.routers.export import router as export_router
from app.routers.admin import router as admin_router
from app.routers.notifications import router as notifications_router

import shutil

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Copiar fotos demo iniciales si no están en UPLOAD_DIR
    bundled_uploads = settings.STATIC_DIR / "uploads"
    if bundled_uploads.exists() and bundled_uploads != settings.UPLOAD_DIR:
        for f in bundled_uploads.glob("*"):
            target = settings.UPLOAD_DIR / f.name
            if not target.exists() and f.is_file():
                try:
                    shutil.copy2(f, target)
                except Exception:
                    pass

    # Inicialización de tablas y datos semilla al arrancar
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db, reset=False)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="API REST profesional para el reporte, evaluación y gestión de condiciones inseguras e incidentes laborales (SST).",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cabeceras de seguridad
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# Montar enrutadores de la API bajo /api
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(risks_router, prefix=settings.API_V1_STR)
app.include_router(actions_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)
app.include_router(export_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router, prefix=settings.API_V1_STR)

# Montar archivos estáticos
app.mount("/static/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")
app.mount("/static", StaticFiles(directory=str(settings.STATIC_DIR)), name="static")

# Ruta raíz para servir el portal SPA
@app.get("/", include_in_schema=False)
async def serve_index():
    index_file = settings.STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return JSONResponse({
        "status": "online",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "message": "API de Gestión SST operativa. Portal frontend en carga."
    })

def get_local_ip() -> str:
    """Detecta la dirección IP local de la PC en la red LAN/Wi-Fi."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

@app.get("/api/health", tags=["Salud"])
async def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "version": settings.VERSION,
        "allow_anonymous": settings.ALLOW_ANONYMOUS_REPORTS
    }

@app.get("/api/system/network-info", tags=["Sistema"])
async def get_network_info(request: Request):
    """Retorna la IP local o dominio público para conectar dispositivos móviles."""
    host = request.headers.get("host", "")
    # Si estamos en un hosting en la nube (ej: pythonanywhere, render) con dominio público
    if host and not host.startswith("localhost") and not host.startswith("127.0.0.1"):
        scheme = "https" if request.headers.get("x-forwarded-proto") == "https" else request.url.scheme
        base = f"{scheme}://{host}"
        return {
            "local_ip": host,
            "port": 443 if scheme == "https" else 80,
            "mobile_url": base,
            "report_url": f"{base}#new_report",
            "status": "online"
        }

    ip = get_local_ip()
    return {
        "local_ip": ip,
        "port": 8000,
        "mobile_url": f"http://{ip}:8000",
        "report_url": f"http://{ip}:8000#new_report",
        "status": "online"
    }

@app.get("/api/system/qr-code", tags=["Sistema"])
async def get_qr_code(request: Request, target_url: Optional[str] = None):
    """Genera dinámicamente el código QR para escanear desde teléfonos móviles."""
    if target_url:
        url = target_url
    else:
        host = request.headers.get("host", "")
        if host and not host.startswith("localhost") and not host.startswith("127.0.0.1"):
            scheme = "https" if request.headers.get("x-forwarded-proto") == "https" else request.url.scheme
            url = f"{scheme}://{host}#new_report"
        else:
            url = f"http://{get_local_ip()}:8000#new_report"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")

