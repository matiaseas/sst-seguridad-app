import sys
import os
import time
import webbrowser
import threading
import multiprocessing
import uvicorn

# Soporte de congelamiento para PyInstaller en Windows
multiprocessing.freeze_support()

def open_browser():
    time.sleep(1.2)
    try:
        webbrowser.open("http://127.0.0.1:8000")
    except Exception:
        pass

def get_local_ip() -> str:
    """Detecta la dirección IP local de la PC en la red LAN/Wi-Fi."""
    import socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def main():
    local_ip = get_local_ip()
    print("=" * 68)
    print("  SST - SISTEMA DE GESTIÓN DE CONDICIONES E INCIDENTES")
    print("  Taller Industrial de Soldadura y Montaje (Standalone Portable)")
    print("=" * 68)
    print(f"  > En esta PC (Localhost):     http://127.0.0.1:8000")
    if local_ip != "127.0.0.1":
        print(f"  > Desde Celular (Misma Wi-Fi): http://{local_ip}:8000")
    print(f"  > Documentación Swagger API:  http://127.0.0.1:8000/docs")
    print("=" * 68)
    print("  * CONEXIÓN DESDE EL CELULAR / TABLET EN EL TALLER:")
    print("    1. Conecta el teléfono a la misma red Wi-Fi de esta PC.")
    print(f"    2. Ingresa a: http://{local_ip}:8000 o escanea el QR en la app.")
    print("  * Presione Ctrl+C en esta consola para cerrar la aplicación.")
    print("=" * 68)
    print()

    # Abrir el navegador automáticamente en esta PC
    threading.Thread(target=open_browser, daemon=True).start()

    from app.main import app
    # Escuchar en 0.0.0.0 permite conexiones desde cualquier dispositivo en la misma Wi-Fi
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False, log_level="info")

if __name__ == "__main__":
    main()
