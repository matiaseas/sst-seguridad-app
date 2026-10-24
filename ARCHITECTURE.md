# ARQUITECTURA DEL SISTEMA — SST SOFTWARE
## Aplicación Web para Reporte y Gestión de Condiciones Inseguras e Incidentes

---

### 1. Visión General de la Arquitectura

La aplicación adopta una **Arquitectura en Capas Limpia (Clean Layered Architecture)** orientada a microservicios desacoplados. Este patrón garantiza la independencia del framework, la alta testabilidad del dominio y la capacidad de evolución hacia motores de base de datos más robustos (ej. PostgreSQL) sin requerir modificaciones en la lógica de negocio.

```
+-------------------------------------------------------------------------+
|                         CAPA DE PRESENTACIÓN                            |
|  Single Page Application (SPA) - HTML5 Semántico + Tailwind CSS 3.4    |
|  Controladores de vista en Vanilla JS (ES Modules)                     |
|  Visualizaciones interactivas con Chart.js 4.4                          |
+-------------------------------------------------------------------------+
                                    | (JSON / REST API / FormData)
                                    v
+-------------------------------------------------------------------------+
|                     CAPA DE ENRUTAMIENTO Y CONTROL                      |
|  FastAPI Routers (/api/auth, /api/reports, /api/risks, /api/actions...) |
|  Middlewares: Auth JWT, CORS, Cabeceras de Seguridad, Error Handling    |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                       CAPA DE SERVICIOS DE DOMINIO                      |
|  * AuthService: Criptografía bcrypt y gestión de claims JWT             |
|  * RiskEngineService: Cálculo matricial paramétrico 5x5 (P x C)         |
|  * AuditService: Registro inmutable estrictamente append-only           |
|  * ExportService: Generador vectorial PDF (ReportLab) y Excel (openpyxl)|
|  * SeedService: Semillero industrial y reseteo demo                     |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                     CAPA DE ACCESO A DATOS (ORM)                        |
|  SQLAlchemy 2.0 (Modelos declarativos, relaciones 1:N y 1:1 tipadas)    |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                       BASE DE DATOS RELACIONAL                          |
|  SQLite 3 configurada en modo WAL (Write-Ahead Logging)                 |
|  (Intercambiable a PostgreSQL mediante la variable DATABASE_URL)        |
+-------------------------------------------------------------------------+
```

---

### 2. Principios de Diseño Aplicados

1. **Separación de Responsabilidades (SoC)**:
   - Los controladores (routers) únicamente reciben peticiones HTTP, validan esquemas mediante Pydantic y delegan la ejecución a los servicios o al ORM.
   - El motor de cálculo de riesgo (`RiskEngineService`) no interactúa con la base de datos; opera como una función pura que recibe valores de probabilidad y consecuencia y retorna puntuación, criticidad y prioridad de intervención.
2. **Defensa en Profundidad y Seguridad (RBAC)**:
   - Control de acceso por roles (*Role-Based Access Control*) integrado en cada endpoint mediante inyección de dependencias (`require_roles(["responsable_sst", "administrador"])`).
   - Las contraseñas nunca se almacenan en texto plano; se utiliza `bcrypt` con sal aleatoria generada por hardware.
3. **Inmutabilidad de la Auditoría**:
   - La tabla `audit_logs` está diseñada bajo el principio *append-only*. Ningún usuario de la aplicación (ni siquiera administradores desde la interfaz) puede modificar o borrar registros históricos de auditoría.
4. **Optimización Multimedia**:
   - Las fotografías subidas desde smartphones se procesan con `Pillow` en el backend, redimensionándolas si superan $1920 \times 1080$ píxeles y comprimiéndolas con calidad 85%, optimizando el almacenamiento y el ancho de banda.

---

### 3. Modelo de Dominio y Datos (ER)

```
[roles] 1 ──── N [users] 1 ──── N [reports] 1 ──── 1 [risk_assessments]
                    │                │
                    │                ├──── N [attachments] 1 ──── 0..1 [action_evidences]
                    │                │                                          │
                    │                ├──── N [actions] 1 ───────────────────────┘
                    │                │
                    │                └──── N [audit_logs]
                    │
                    └──── N [notifications]
```

* **`reports`**: Entidad central. Posee un código correlativo con índice único (`SST-2026-XXXXX`), estado del ciclo de vida, nivel de urgencia, indicador de peligro inminente y relación opcional con el usuario reportante (anulable en caso de reporte anónimo).
* **`risk_assessments`**: Evaluación técnica del especialista. Almacena la probabilidad (1 a 5), consecuencia (1 a 5), puntaje ($R = P \times C$) y observaciones metodológicas.
* **`actions`**: Medidas de control estructuradas bajo la **Jerarquía de Controles**: *Eliminación, Sustitución, Control de ingeniería, Control administrativo, Equipo de protección personal*.
* **`action_evidences`**: Vincula una fotografía y una nota de verificación como prueba concluyente de que la medida fue efectivamente ejecutada.

---

### 4. Ciclo de Vida y Máquina de Estados

La transición de estados se encuentra gobernada por reglas de negocio estrictas:

```mermaid
stateDiagram-v2
    [*] --> Reportado: Trabajador envía situación
    Reportado --> En_Revisión: SST realiza triaje
    Reportado --> En_Análisis: SST evalúa riesgo P x C
    En_Revisión --> En_Análisis: SST analiza causas
    En_Análisis --> Acción_Asignada: SST crea medida de control
    Acción_Asignada --> En_Proceso: Responsable inicia tarea
    En_Proceso --> Pendiente_de_Verificación: Ejecutor sube evidencia fotográfica
    Acción_Asignada --> Pendiente_de_Verificación: Ejecutor completa acción
    Pendiente_de_Verificación --> Cerrado: SST verifica eficacia y dictamina cierre
    Reportado --> Descartado: SST dictamina con justificación
    En_Revisión --> Descartado: SST dictamina con justificación
    Cerrado --> [*]
    Descartado --> [*]
```

> [!NOTE]
> **Regla de Negocio para Cierre**: Un reporte no puede ser marcado como `Cerrado` si tiene acciones en estado `Pendiente` o `En proceso`, salvo que el Responsable de Seguridad ingrese un motivo de excepción justificado que queda registrado en la bitácora de auditoría.

---

### 5. Estrategia de Concurrencia y Persistencia

Para evitar bloqueos de base de datos en entornos Windows durante demostraciones simultáneas, SQLite se inicializa con los siguientes pragmas nativos:
* `PRAGMA foreign_keys = ON;`: Garantiza la integridad referencial y el borrado/actualización en cascada.
* `PRAGMA journal_mode = WAL;`: Activa el modo *Write-Ahead Logging*, permitiendo que múltiples lecturas coexistan con escrituras sin generar excepciones de `database is locked`.
* `PRAGMA busy_timeout = 5000;`: Define una ventana de tolerancia de 5 segundos para reintentos transparentes de escritura.

---

### 6. Escalabilidad y Ampliaciones Futuras

El sistema se encuentra desacoplado para soportar los siguientes módulos en versiones 2.0+:
1. **Migración a PostgreSQL**: Modificar la variable de entorno `DATABASE_URL=postgresql+psycopg2://user:pass@host:5432/sst_db` sin cambiar una sola línea de código del ORM.
2. **Módulo de Inspecciones de Seguridad**: Creación de una entidad `inspections` con relación a `locations` y generación automática de reportes de condición insegura ante no conformidades.
3. **Módulo de Permisos de Trabajo Seguro (PTS)**: Verificación previa a trabajos de alto riesgo (corte y soldadura en espacios confinados).
4. **Pasarelas de Mensajería (Webhooks)**: Desacople de `NotificationService` hacia proveedores de mensajería (Twilio, WhatsApp Business API o Telegram Bots).
