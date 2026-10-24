"""
Archivo de configuración WSGI para PythonAnywhere.
Copia y pega este contenido en el archivo WSGI de la pestaña Web en PythonAnywhere:
/var/www/tuusuario_pythonanywhere_com_wsgi.py
"""
import sys
import os

# 1. Configurar la ruta a tu proyecto en PythonAnywhere
# Reemplaza 'tuusuario' con tu nombre de usuario exacto en pythonanywhere.com
username = os.environ.get("USER", "tuusuario")
project_home = f"/home/{username}/sst-seguridad-app"

if project_home not in sys.path:
    sys.path.insert(0, project_home)

# 2. Clave secreta para JWT tokens en la nube
os.environ.setdefault("SECRET_KEY", "sst-cloud-secret-token-key-2026-production")

# 3. Adaptador ASGI (FastAPI) a WSGI para el servidor de PythonAnywhere
from a2wsgi import ASGIMiddleware
from app.main import app

# PythonAnywhere busca obligatoriamente una variable llamada 'application'
application = ASGIMiddleware(app)
