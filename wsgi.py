"""
Archivo de configuración WSGI para PythonAnywhere.
Copia y pega este contenido en el archivo WSGI de la pestaña Web en PythonAnywhere:
/var/www/matiaseas_pythonanywhere_com_wsgi.py
"""
import sys
import os
import asyncio
from io import BytesIO

# 1. Configurar la ruta a tu proyecto en PythonAnywhere
username = os.environ.get("USER", "matiaseas")
project_home = f"/home/{username}/sst-seguridad-app"

if project_home not in sys.path:
    sys.path.insert(0, project_home)

# 2. Clave secreta para JWT
os.environ.setdefault("SECRET_KEY", "sst-cloud-secret-production-2026")

# 3. Importar la aplicación FastAPI
from app.main import app

# 4. Adaptador directo y 100% compatible con uWSGI (sin hilos en segundo plano)
# PythonAnywhere tiene el soporte de sub-hilos (threading) deshabilitado en su servidor web uWSGI.
# Este adaptador corre el ciclo de eventos asíncronos directamente en el hilo de la petición HTTP,
# evitando que la página se quede cargando eternamente.

def build_scope(environ):
    headers = []
    for k, v in environ.items():
        if k.startswith("HTTP_"):
            headers.append((k[5:].lower().replace("_", "-").encode("latin1"), v.encode("latin1")))
        elif k in ("CONTENT_TYPE", "CONTENT_LENGTH"):
            headers.append((k.lower().replace("_", "-").encode("latin1"), v.encode("latin1")))

    path = environ.get("PATH_INFO", "/")
    query_string = environ.get("QUERY_STRING", "").encode("latin1")
    method = environ.get("REQUEST_METHOD", "GET")
    scheme = environ.get("HTTP_X_FORWARDED_PROTO", environ.get("wsgi.url_scheme", "https"))
    server_name = environ.get("SERVER_NAME", "localhost")
    server_port = int(environ.get("SERVER_PORT", 443 if scheme == "https" else 80))

    return {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": method,
        "scheme": scheme,
        "path": path,
        "query_string": query_string,
        "root_path": "",
        "headers": headers,
        "server": (server_name, server_port),
    }

def application(environ, start_response):
    scope = build_scope(environ)
    content_length = int(environ.get("CONTENT_LENGTH", 0) or 0)
    body_bytes = environ["wsgi.input"].read(content_length) if content_length > 0 else b""

    status_code = 200
    res_headers = []
    res_body = []

    async def run():
        nonlocal status_code, res_headers, res_body

        async def receive():
            return {
                "type": "http.request",
                "body": body_bytes,
                "more_body": False
            }

        async def send(message):
            nonlocal status_code, res_headers, res_body
            if message["type"] == "http.response.start":
                status_code = message["status"]
                res_headers = [
                    (k.decode("latin1"), v.decode("latin1"))
                    for k, v in message.get("headers", [])
                ]
            elif message["type"] == "http.response.body":
                body = message.get("body", b"")
                if body:
                    res_body.append(body)

        await app(scope, receive, send)

    try:
        asyncio.run(run())
    except Exception as e:
        status_code = 500
        res_headers = [("Content-Type", "text/plain; charset=utf-8")]
        res_body = [f"Error interno del servidor: {e}".encode("utf-8")]

    # HTTP Status line
    from http import HTTPStatus
    try:
        phrase = HTTPStatus(status_code).phrase
    except Exception:
        phrase = "OK" if status_code == 200 else "Error"

    start_response(f"{status_code} {phrase}", res_headers)
    return res_body
