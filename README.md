# SST — Aplicación Web para Reporte y Gestión de Condiciones Inseguras e Incidentes

![Python](https://img.shields.io/badge/Python-3.12-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)
![SQLite](https://img.shields.io/badge/SQLite-WAL_Mode-003B57.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)
![Tests](https://img.shields.io/badge/Tests-19%20Passed-success.svg)

---

## 1. Descripción del Proyecto

Esta aplicación web es una solución informática profesional, autónoma e integral diseñada para **digitalizar, estandarizar y gestionar el ciclo de vida completo de notificaciones de seguridad laboral**: condiciones inseguras, actos inseguros, incidentes, accidentes y observaciones preventivas.

Sustituye la comunicación verbal o informal (WhatsApp, notas en papel, avisos de pasillo) por un **canal digital formal, rápido y con trazabilidad inalterable**:
$$\text{OBSERVAR} \longrightarrow \text{REPORTAR} \longrightarrow \text{REGISTRAR} \longrightarrow \text{ANALIZAR} \longrightarrow \text{ACTUAR} \longrightarrow \text{SEGUIR} \longrightarrow \text{VERIFICAR} \longrightarrow \text{CERRAR}$$

El sistema ha sido calibrado inicialmente con un banco de pruebas representativo de un **taller industrial de soldadura y calderería pesada**, pero su arquitectura es completamente modular y aplicable a cualquier organización productiva o de servicios.

> [!IMPORTANT]
> **Independencia de ISO 45001**: La aplicación **no** tiene por objetivo implementar ni certificar la norma ISO 45001, ni constituye por sí misma un Sistema de Gestión de SST completo. Es una herramienta técnica independiente y funcional desarrollada en el marco de un trabajo final de Higiene y Seguridad en el Trabajo. Para más detalles, consultar [ACADEMIC_CONTEXT.md](file:///C:/Users/exel_/.gemini/antigravity/scratch/sst-seguridad-app/ACADEMIC_CONTEXT.md).

---

## 2. Características y Funcionalidades Principales

### Para el Trabajador (Mobile-First)
* **Reporte ultrarrápido (1 a 2 minutos)**: Formulario optimizado para smartphones con lenguaje llano ("¿Qué observaste o qué ocurrió?").
* **Identificado o Anónimo**: Opción de reportar anónimamente con código de seguimiento único (`SST-2026-XXXXX`).
* **Fotografías directas**: Captura instantánea desde la cámara o selección de galería con previsualización interactiva.
* **Alerta de Peligro Inmediato**: Aviso visual de emergencia instruyendo la comunicación verbal/radial inmediata si la situación reviste riesgo inminente.
* **Seguimiento público**: Consulta del estado de resolución sin necesidad de iniciar sesión mediante el código del reporte.

### Para el Responsable de Higiene y Seguridad (SST)
* **Triaje y Clasificación en 8 Estados**: *Reportado, En revisión, En análisis, Acción asignada, En proceso, Pendiente de verificación, Cerrado, Descartado*.
* **Evaluación Técnica de Riesgos ($R = P \times C$)**:
  - Matriz paramétrica de $5 \times 5$: Probabilidad (1-5) $\times$ Consecuencia (1-5).
  - Cálculo automático de niveles: *Bajo, Moderado, Importante, Alto, Crítico* con código de colores y prioridades de intervención.
* **Gestión de Acciones y Jerarquía de Controles**:
  - Creación de acciones tipificadas según: *Eliminación, Sustitución, Control de ingeniería, Control administrativo, EPP*.
  - Asignación de responsables y fechas límite con alertas de vencimiento.
* **Carga y Verificación de Evidencias**: Registro fotográfico de la solución implementada y validación formal de eficacia antes del cierre.
* **Regla de Negocio para Cierre**: Bloqueo de cierre si existen acciones pendientes sin justificación expresa.
* **Trazabilidad e Inmutabilidad**: Bitácora histórica (*Audit Log*) que registra cada evento con usuario, fecha y hora exacta.

### Analítica, Reportabilidad e Informes
* **Dashboard Interactivo**: KPIs en tiempo real (abiertos, cerrados, incidentes, vencidos, tiempo medio de resolución) y gráficos interactivos con Chart.js (distribución por tipo, sectores críticos, niveles de riesgo y evolución temporal).
* **Filtros Temporales**: Visualización por 7 días, 30 días, 90 días, año en curso o histórico.
* **Emisión de Informes Formales en PDF**: Ficha técnica completa maquetada con ReportLab, incluyendo tablas, imágenes y espacio de firmas.
* **Exportación de Datos**: Descarga de planillas en formato Excel (`.xlsx`) y archivos CSV.

### Para el Administrador
* Gestión de usuarios y asignación de roles (RBAC).
* Gestión del catálogo de sectores y ubicaciones operativas del taller.
* **Restauración de Datos de Demostración**: Botón para resetear la base de datos a los casos de prueba iniciales con un solo clic.

---

## 3. Stack Tecnológico

| Capa | Componente | Justificación |
|---|---|---|
| **Backend Framework** | **FastAPI 0.115+** | API REST asíncrona de alto rendimiento con validación tipada estricta mediante Pydantic v2 y documentación interactiva automática OpenAPI/Swagger. |
| **Entorno & Paquetes** | **Python 3.12 + uv** | Ejecución inmediata y gestión ultrarrápida de dependencias sin requerir permisos de administrador en Windows. |
| **Base de Datos** | **SQLite 3 (WAL Mode) + SQLAlchemy 2.0** | Persistencia relacional autocontenida sin requerir servidores externos de base de datos. Modo WAL para alta concurrencia. |
| **Frontend** | **HTML5 + Tailwind CSS + Vanilla JS Modular** | Arquitectura Single Page Application (SPA) responsiva sin compiladores complejos ni dependencias frágiles de npm. |
| **Visualización** | **Chart.js 4.4** | Renderizado dinámico de gráficos de dona, barras y líneas para el dashboard. |
| **Generación PDF** | **ReportLab 5.0** | Maquetación vectorial formal y profesional de informes técnicos institucionales. |
| **Exportación Excel** | **openpyxl 3.1** | Generación de libros de cálculo enriquecidos con estilos corporativos. |
| **Testing** | **pytest 9.1** | Suite de pruebas unitarias e integración de ciclo de vida completo. |

---

## 4. Usuarios de Demostración (Modo Demo)

La aplicación incluye tres usuarios de prueba preconfigurados con contraseña común:

| Rol | Usuario | Contraseña | Nombre Completo | Perfil |
|---|---|---|---|---|
| **Trabajador** | `operario1` | `password123` | Carlos Soldador | Reporta situaciones y consulta sus propios registros. |
| **Responsable SST** | `seguridad` | `password123` | Lic. María Martínez | Evalúa riesgos, asigna acciones y cierra reportes. |
| **Administrador** | `admin` | `password123` | Ing. Roberto Gómez | Administra usuarios, sectores y reseteo demo. |

> [!TIP]
> En la parte superior de la aplicación web se encuentra una **Barra de Acceso Rápido** que permite iniciar sesión con un solo clic en cualquiera de estos perfiles para agilizar las presentaciones y defensas.

---

## 5. Instalación y Ejecución

### Prerrequisitos
- Windows 10/11, Linux o macOS.
- Gestor de paquetes `uv` (o Python 3.12 estándar).

### Ejecución Inmediata
Abrir una terminal en el directorio del proyecto y ejecutar:

```powershell
# Iniciar el servidor web
uv run python run.py
```

La aplicación quedará disponible en:
- **Portal Web (SPA)**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Documentación Swagger / OpenAPI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Documentación ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 6. Ejecución de la Suite de Pruebas

Para verificar la integridad del código, el motor de riesgos y el ciclo de vida completo:

```powershell
uv run python -m pytest -v
```

Resultado esperado: **19 pruebas aprobadas al 100%**.

---

## 7. Estructura del Proyecto

```
sst-seguridad-app/
├── app/
│   ├── config.py              # Variables de entorno y configuración
│   ├── database.py            # Conexión SQLAlchemy y modo WAL
│   ├── main.py                # Entrada FastAPI, middlewares y rutas
│   ├── models/                # Entidades ORM (User, Report, Risk, Action, Audit, etc.)
│   ├── schemas/               # Esquemas Pydantic v2
│   ├── services/              # Lógica de dominio (Auth, Risk, Audit, Seed, Export)
│   ├── routers/               # Controladores API REST
│   └── static/                # Frontend SPA, estilos CSS y subidas de fotos
├── tests/                     # Suite de pruebas automatizadas
├── data/                      # Base de datos SQLite (sst_database.db)
├── run.py                     # Script de arranque
├── README.md                  # Este documento
├── ARCHITECTURE.md            # Especificación de arquitectura detallada
├── USER_GUIDE.md              # Manual de usuario paso a paso
└── ACADEMIC_CONTEXT.md        # Relación con el trabajo académico de SST
```

---

## 8. Futuras Ampliaciones

La arquitectura modular permite incorporar en etapas posteriores:
1. Módulo de Inspecciones de Seguridad y Checklists periódicos.
2. Gestión y registro de entrega de Elementos de Protección Personal (EPP).
3. Permisos de Trabajo Seguro (PTS) para trabajos en caliente y altura.
4. Notificaciones push vía WhatsApp / Telegram mediante webhooks desacoplados.
