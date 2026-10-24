# GUÍA DE USUARIO — SISTEMA SST
## Manual Operativo para Trabajadores, Responsables de Seguridad y Administradores

---

### 1. Acceso Rápido y Modo Demostración

La aplicación cuenta con una **Barra de Acceso Rápido** en el extremo superior de la pantalla que permite alternar entre los tres roles con un solo clic:

* 👷 **Carlos Soldador (Trabajador)**: `operario1` / `password123`
* 🛡️ **Lic. María Martínez (Responsable SST)**: `seguridad` / `password123`
* ⚙️ **Ing. Roberto Gómez (Administrador)**: `admin` / `password123`

---

### 2. Manual para el Trabajador

El perfil del trabajador ha sido optimizado con enfoque *Mobile-First* para que cualquier operario en planta pueda notificar una situación en menos de 2 minutos.

#### 2.1 Cómo Crear un Nuevo Reporte
1. En la pantalla principal, presiona el botón grande amarillo **[+ NUEVO REPORTE]**.
2. **Paso 1: Tipo de Situación**: Toca sobre la tarjeta correspondiente:
   - *Condición Insegura*: Si hay un defecto físico o ambiental (ej: cables pelados, estantería inestable).
   - *Acto Inseguro*: Si una persona está realizando una tarea de forma peligrosa (ej: soldar sin careta).
   - *Incidente*: Si ocurrió un suceso que casi provoca un daño pero no hubo heridos (ej: desprendimiento de disco sin lesión).
   - *Accidente*: Si existió un daño corporal o a la salud.
   - *Observación Preventiva*: Una sugerencia de mejora de seguridad.
3. **Paso 2: Ubicación**: Selecciona el sector del taller (ej: *Área de soldadura*, *Área de amolado*, etc.).
4. **Paso 3: ¿Qué observaste o qué ocurrió?**: Escribe con tus propias palabras lo que viste de forma sencilla.
5. **Paso 4: Nivel de Urgencia**: Elige entre *Baja*, *Media*, *Alta* o *Crítica*.
6. **Paso 5: Peligro Inmediato**:
   - Si existe riesgo grave e inminente de accidente, activa el switch.
   - Aparecerá una advertencia de seguridad recordando avisar verbalmente de forma inmediata a la supervisión de planta.
7. **Paso 6: Fotografías**: Toca el recuadro para tomar una fotografía con la cámara de tu teléfono o elegir de la galería. Puedes adjuntar varias fotos.
8. **Paso 7: Anonimato**: Si prefieres que tu nombre no figure en el registro, activa la opción **"Reportar de forma anónima"**.
9. Presiona **[ENVIAR REPORTE]**.

#### 2.2 Pantalla de Confirmación y Código Único
Al enviar, verás un cartel de confirmación con tu **Número de Reporte Único** (ej: `SST-2026-00001`). 
Puedes presionar **[Ver detalle del reporte]** para seguir la evolución.

#### 2.3 Cómo Consultar el Estado de un Reporte (Incluso sin Iniciar Sesión)
1. En la barra superior o en el inicio, toca **[Consultar Código]**.
2. Escribe el número (ej: `SST-2026-00001`) y presiona **Buscar**.
3. Podrás ver en qué etapa está: si fue analizado, si se le asignó una acción y cuándo fue resuelto.

---

### 3. Manual para el Responsable de Seguridad (SST)

El Responsable de SST dispone de herramientas técnicas avanzadas para el triaje, evaluación de riesgos, asignación de tareas bajo la jerarquía de controles e informes.

#### 3.1 Gestión de la Bandeja General
1. Ingresa a la **Bandeja General** desde el menú superior.
2. Utiliza los filtros facetados para segmentar por:
   - Tipo de situación.
   - Sector del taller.
   - Estado del reporte (8 estados disponibles).
   - Nivel de riesgo (Bajo, Moderado, Importante, Alto, Crítico).
   - Buscador por texto libre o código.
3. Toca sobre cualquier fila para abrir la **Ficha Técnica 360°**.

#### 3.2 Evaluación Técnica de Riesgos (Matriz 5x5)
1. En la ficha del reporte, localiza el panel derecho **"Evaluación de Riesgo"**.
2. Desplaza los selectores:
   - **Probabilidad (P)**: 1 (Muy baja) a 5 (Muy alta).
   - **Consecuencia (C)**: 1 (Leve) a 5 (Muy grave).
3. El sistema calculará en tiempo real:
   $$R = P \times C \quad (1 \text{ a } 25)$$
   - $\le 4$: **Bajo** (Verde)
   - $5 - 9$: **Moderado** (Amarillo)
   - $10 - 14$: **Importante** (Naranja)
   - $15 - 19$: **Alto** (Rojo)
   - $20 - 25$: **Crítico** (Rojo oscuro)
4. Agrega notas técnicas u observaciones y presiona **[Guardar Evaluación Técnica]**.
5. El sistema registrará el evento en la auditoría y moverá el reporte al estado **"En análisis"**.

#### 3.3 Asignación de Acciones Correctivas y Preventivas
1. En la sección **"Plan de Acciones y Controles"**, presiona **[+ Asignar Acción]**.
2. Describe la medida requerida.
3. Selecciona la **Jerarquía de Controles**:
   - *Eliminación* (eliminar físicamente el peligro).
   - *Sustitución* (reemplazar el peligro por algo más seguro).
   - *Control de ingeniería* (aislar a las personas del peligro: guardas, pasacables, ventilación).
   - *Control administrativo* (cambiar la forma de trabajar: capacitación, procedimientos, señalética).
   - *Equipo de protección personal (EPP)* (proteger al trabajador con indumentaria reglamentaria).
4. Elige el responsable de ejecución y la fecha límite.
5. Presiona **Crear Acción**. El reporte pasará automáticamente a **"Acción asignada"**.

#### 3.4 Carga y Verificación de Evidencias
1. Cuando la medida esté implementada, el ejecutor o el responsable presiona **[📷 Subir Evidencia]**.
2. Adjunta la fotografía del trabajo terminado (ej: pasacables instalado, baranda colocada) y notas explicativas. La acción pasa a **"Completada"**.
3. El Responsable de SST inspecciona la solución y presiona **[✓ Verificar Eficacia]**, pasando la acción al estado **"Verificada"**.

#### 3.5 Cierre Formal del Reporte
1. En la barra superior de la ficha, selecciona en el desplegable de estados la opción **"Cerrar Reporte..."**.
2. El sistema validará que todas las acciones asignadas estén completadas o verificadas.
3. Ingresa el **Dictamen Final de Cierre** que quedará registrado en la bitácora histórica.

#### 3.6 Emisión de Informes Formales (PDF y Excel)
* **Informe individual en PDF**: En cualquier reporte, pulsa **[Descargar Informe PDF]**. Se generará una ficha formal con membrete institucional, evaluación matricial, plan de acciones, fotografías y líneas de firmas para impresión o archivo digital.
* **Exportación general a Excel y CSV**: En la Bandeja General, pulsa **[Exportar Excel]** o **[Exportar CSV]** para obtener la planilla completa de control gerencial.

---

### 4. Manual para el Administrador

1. Accede a la pestaña **Administración** del menú superior.
2. **Gestión de Usuarios**: Pulsa **[+ Agregar Usuario]** para dar de alta nuevo personal con roles de Trabajador, SST o Administrador.
3. **Gestión de Sectores**: Pulsa **[+ Agregar Sector]** para incorporar nuevas áreas operativas del taller (ej: Bahía de Pintura, Sector Calderería Pesada).
4. **Restaurar Datos de Demostración**:
   - Si realizaste pruebas y deseas volver a los casos iniciales limpios del taller de soldadura para una presentación formal, presiona **[Restaurar Base Demo]**.
   - El sistema reiniciará la base con los 4 casos de soldadura predefinidos y fotografías de muestra.
