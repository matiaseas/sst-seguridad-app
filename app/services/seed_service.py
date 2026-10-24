from datetime import datetime, timedelta, timezone
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import Role, User
from app.models.report import ReportType, Location, Report, Attachment
from app.models.risk import RiskAssessment
from app.models.action import Action, ActionEvidence
from app.models.audit import AuditLog
from app.models.notification import Notification, SystemSetting
from app.services.auth_service import hash_password
from app.services.risk_service import risk_service

def generate_sample_image(filename: str, title: str, subtitle: str, color_bg: tuple):
    """Genera una imagen ilustrativa industrial para los datos de prueba."""
    img_path = settings.UPLOAD_DIR / filename
    if img_path.exists():
        return f"/static/uploads/{filename}"

    width, height = 800, 600
    image = Image.new("RGB", (width, height), color=color_bg)
    draw = ImageDraw.Draw(image)

    # Marco industrial con borde
    draw.rectangle([20, 20, width - 20, height - 20], outline=(255, 255, 255), width=4)
    draw.rectangle([30, 30, width - 30, 100], fill=(20, 30, 45))

    # Título y encabezado
    draw.text((50, 45), "REGISTRO FOTOGRÁFICO DE SEGURIDAD INDUSTRIAL", fill=(255, 204, 0))
    draw.text((50, 70), "TALLER DE SOLDADURA Y MONTAJE INDUSTRIAL", fill=(200, 220, 240))

    # Contenido central
    draw.rectangle([50, 140, width - 50, height - 100], fill=(30, 41, 59))
    draw.text((70, 180), f"SITUACIÓN: {title}", fill=(255, 255, 255))
    draw.text((70, 220), f"DETALLE: {subtitle}", fill=(180, 200, 220))
    draw.text((70, 280), "EVIDENCIA CAPTURADA EN CAMPO", fill=(148, 163, 184))
    
    # Sello de fecha/hora simulado
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    draw.text((70, 450), f"REGISTRO AUTOMÁTICO: {now_str}", fill=(100, 116, 139))
    draw.text((70, 475), "VERIFICADO POR DPTO. HIGIENE Y SEGURIDAD", fill=(34, 197, 94))

    image.save(img_path, format="JPEG", quality=85)
    return f"/static/uploads/{filename}"

def seed_database(db: Session, reset: bool = False):
    """Semillero de datos profesionales para el entorno de demostración."""
    if reset:
        # Limpiar todas las tablas
        db.query(ActionEvidence).delete()
        db.query(Action).delete()
        db.query(RiskAssessment).delete()
        db.query(Attachment).delete()
        db.query(AuditLog).delete()
        db.query(Notification).delete()
        db.query(Report).delete()
        db.query(SystemSetting).delete()
        db.query(User).delete()
        db.query(Role).delete()
        db.query(Location).delete()
        db.query(ReportType).delete()
        db.commit()

    # 1. ROLES
    role_trabajador = db.query(Role).filter(Role.name == "trabajador").first()
    if not role_trabajador:
        role_trabajador = Role(name="trabajador", description="Operario de planta. Puede reportar y consultar sus registros.")
        role_sst = Role(name="responsable_sst", description="Responsable SST. Evalúa riesgos, asigna acciones y cierra reportes.")
        role_admin = Role(name="administrador", description="Administrador del sistema. Configuración global y gestión de usuarios.")
        db.add_all([role_trabajador, role_sst, role_admin])
        db.commit()
    else:
        role_sst = db.query(Role).filter(Role.name == "responsable_sst").first()
        role_admin = db.query(Role).filter(Role.name == "administrador").first()

    # 2. USUARIOS DEMO (Contraseña común para demo: 'password123')
    hashed_pwd = hash_password("password123")
    
    user_worker = db.query(User).filter(User.username == "operario1").first()
    if not user_worker:
        user_worker = User(
            username="operario1",
            email="carlos.soldador@industria.com",
            full_name="Carlos Soldador",
            password_hash=hashed_pwd,
            role_id=role_trabajador.id,
            is_active=True
        )
        user_sst = User(
            username="seguridad",
            email="maria.martinez@industria.com",
            full_name="Lic. María Martínez (SST)",
            password_hash=hashed_pwd,
            role_id=role_sst.id,
            is_active=True
        )
        user_admin = User(
            username="admin",
            email="admin@industria.com",
            full_name="Ing. Roberto Gómez (Admin)",
            password_hash=hashed_pwd,
            role_id=role_admin.id,
            is_active=True
        )
        db.add_all([user_worker, user_sst, user_admin])
        db.commit()
    else:
        user_sst = db.query(User).filter(User.username == "seguridad").first()
        user_admin = db.query(User).filter(User.username == "admin").first()

    # 3. TIPOS DE REPORTE
    types_data = [
        {"name": "Condición insegura", "description": "Fallo o defecto físico en equipos, materiales o entorno", "color_badge": "amber", "icon": "alert-triangle"},
        {"name": "Acto inseguro", "description": "Comportamiento u omisión que viola un procedimiento seguro", "color_badge": "orange", "icon": "user-x"},
        {"name": "Incidente", "description": "Suceso acaecido en el trabajo sin lesiones pero con potencial de daño", "color_badge": "blue", "icon": "alert-circle"},
        {"name": "Accidente", "description": "Suceso que causa lesión corporal o daño a la salud", "color_badge": "red", "icon": "shield-alert"},
        {"name": "Observación preventiva", "description": "Detección temprana o sugerencia de mejora de seguridad", "color_badge": "teal", "icon": "eye"},
        {"name": "Otro", "description": "Otra situación relacionada con higiene y seguridad", "color_badge": "gray", "icon": "help-circle"},
    ]
    for t in types_data:
        if not db.query(ReportType).filter(ReportType.name == t["name"]).first():
            db.add(ReportType(**t))
    db.commit()

    # 4. UBICACIONES (Taller de Soldadura)
    locations_list = [
        "Área de soldadura",
        "Área de corte",
        "Área de amolado",
        "Área de almacenamiento",
        "Área de recepción",
        "Área de mantenimiento",
        "Área de máquinas",
        "Patio / exterior",
        "Oficina",
        "Vestuario",
        "Otro"
    ]
    for loc_name in locations_list:
        if not db.query(Location).filter(Location.name == loc_name).first():
            db.add(Location(name=loc_name, description=f"Sector operativo: {loc_name}", is_active=True))
    db.commit()

    # 5. PARÁMETROS GLOBALES
    if not db.query(SystemSetting).filter(SystemSetting.key == "allow_anonymous").first():
        db.add(SystemSetting(key="allow_anonymous", value="true", description="Permitir reportes anónimos"))
        db.add(SystemSetting(key="company_name", value="Taller Metalúrgico y Soldadura Industrial S.A.", description="Razón Social"))
        db.commit()

    # Verificar si ya existen reportes
    if db.query(Report).count() > 0:
        return

    # 6. CASOS DE DEMOSTRACIÓN (Basados en el documento de especificación)
    type_condicion = db.query(ReportType).filter(ReportType.name == "Condición insegura").first()
    type_incidente = db.query(ReportType).filter(ReportType.name == "Incidente").first()
    type_acto = db.query(ReportType).filter(ReportType.name == "Acto inseguro").first()

    loc_soldadura = db.query(Location).filter(Location.name == "Área de soldadura").first()
    loc_amolado = db.query(Location).filter(Location.name == "Área de amolado").first()
    loc_almacen = db.query(Location).filter(Location.name == "Área de almacenamiento").first()

    now = datetime.now(timezone.utc)

    # --- EJEMPLO 1: Condición insegura en Soldadura ---
    img1 = generate_sample_image(
        "demo_cables_pasillo.jpg",
        "CABLES ELECTRICOS EN ZONA DE CIRCULACION",
        "Cables de alimentacion de soldadora cruzando el pasillo principal",
        (15, 23, 42)
    )
    rep1 = Report(
        code="SST-2026-00001",
        report_type_id=type_condicion.id,
        location_id=loc_soldadura.id,
        reporter_id=user_worker.id,
        description="Se observan cables eléctricos atravesando una zona de circulación sin pasacables ni protección mecánica.",
        urgency="Alta",
        immediate_danger=False,
        is_anonymous=False,
        status="Acción asignada",
        created_at=now - timedelta(days=3),
        updated_at=now - timedelta(days=2)
    )
    db.add(rep1)
    db.flush()

    att1 = Attachment(
        report_id=rep1.id,
        file_path=img1,
        file_name="demo_cables_pasillo.jpg",
        file_size=45200,
        mime_type="image/jpeg",
        is_evidence=False,
        created_at=rep1.created_at
    )
    db.add(att1)

    # Evaluación de riesgo: P=4, C=3 => R=12 (Alto)
    calc1 = risk_service.calculate_risk(4, 3)
    risk1 = RiskAssessment(
        report_id=rep1.id,
        assessor_id=user_sst.id,
        probability=4,
        consequence=3,
        risk_score=calc1["risk_score"],
        risk_level=calc1["risk_level"],
        methodology="Matriz 5x5 (P x C)",
        observations="Riesgo de tropiezos y electrocución por deterioro de aislación bajo tránsito de carretillas.",
        created_at=now - timedelta(days=2)
    )
    db.add(risk1)

    # Acción de Control de Ingeniería
    act1 = Action(
        report_id=rep1.id,
        assigned_to_id=user_worker.id,
        description="Instalar rampa pasacables de goma de alta resistencia y señalizar demarcación amarilla en el suelo.",
        action_type="Acción correctiva",
        control_hierarchy="Control de ingeniería",
        status="En proceso",
        due_date=now + timedelta(days=2),
        created_at=now - timedelta(days=2),
        observations="Se gestionó el pedido a pañol para colocación inmediata."
    )
    db.add(act1)

    # Auditoría
    db.add(AuditLog(
        report_id=rep1.id,
        user_id=user_worker.id,
        action_type="CREACION",
        details="Reporte creado por Carlos Soldador desde terminal móvil.",
        created_at=rep1.created_at
    ))
    db.add(AuditLog(
        report_id=rep1.id,
        user_id=user_sst.id,
        action_type="EVALUACION_RIESGO",
        details="Evaluación técnica registrada: P=4 x C=3 = 12 (Nivel Alto).",
        created_at=now - timedelta(days=2)
    ))
    db.add(AuditLog(
        report_id=rep1.id,
        user_id=user_sst.id,
        action_type="ACCION_CREADA",
        details="Acción correctiva de ingeniería asignada a Carlos Soldador con vencimiento programado.",
        created_at=now - timedelta(days=2)
    ))

    # --- EJEMPLO 2: Incidente en Amolado ---
    img2 = generate_sample_image(
        "demo_pantalla_facial.jpg",
        "IMPACTO DE PARTICULA EN PANTALLA FACIAL",
        "Desprendimiento de fragmento durante tarea de desbaste",
        (30, 41, 59)
    )
    rep2 = Report(
        code="SST-2026-00002",
        report_type_id=type_incidente.id,
        location_id=loc_amolado.id,
        reporter_id=user_worker.id,
        description="Durante el uso de una amoladora se desprendió una partícula que impactó contra la pantalla facial. La protección evitó una lesión ocular directa.",
        urgency="Media",
        immediate_danger=False,
        is_anonymous=False,
        status="En análisis",
        created_at=now - timedelta(days=2),
        updated_at=now - timedelta(days=1)
    )
    db.add(rep2)
    db.flush()

    att2 = Attachment(
        report_id=rep2.id,
        file_path=img2,
        file_name="demo_pantalla_facial.jpg",
        file_size=51200,
        mime_type="image/jpeg",
        is_evidence=False,
        created_at=rep2.created_at
    )
    db.add(att2)

    # Evaluación: P=3, C=2 => R=6 (Moderado)
    calc2 = risk_service.calculate_risk(3, 2)
    risk2 = RiskAssessment(
        report_id=rep2.id,
        assessor_id=user_sst.id,
        probability=3,
        consequence=2,
        risk_score=calc2["risk_score"],
        risk_level=calc2["risk_level"],
        methodology="Matriz 5x5 (P x C)",
        observations="Eficacia comprobada del EPP utilizado. Requiere revisión del estado del disco y revoluciones de la amoladora.",
        created_at=now - timedelta(days=1)
    )
    db.add(risk2)

    act2 = Action(
        report_id=rep2.id,
        assigned_to_id=user_admin.id,
        description="Inspeccionar guarda de seguridad y verificar RPM máximas de los discos de desbaste en stock.",
        action_type="Acción preventiva",
        control_hierarchy="Control administrativo",
        status="Pendiente",
        due_date=now + timedelta(days=4),
        created_at=now - timedelta(days=1)
    )
    db.add(act2)

    db.add(AuditLog(
        report_id=rep2.id,
        user_id=user_worker.id,
        action_type="CREACION",
        details="Notificación de incidente con EPP protector.",
        created_at=rep2.created_at
    ))

    # --- EJEMPLO 3: Condición insegura en Almacenamiento ---
    img3 = generate_sample_image(
        "demo_material_inestable.jpg",
        "MATERIAL METALICO ALMACENADO INESTABLE",
        "Perfiles y tubos de acero sin calces de contencion en estanteria",
        (44, 25, 25)
    )
    rep3 = Report(
        code="SST-2026-00003",
        report_type_id=type_condicion.id,
        location_id=loc_almacen.id,
        reporter_id=None, # Reporte anónimo de ejemplo!
        description="Se observa material metálico almacenado de manera inestable con peligro de rodamiento sobre el pasillo de carga.",
        urgency="Alta",
        immediate_danger=False,
        is_anonymous=True,
        status="Reportado",
        created_at=now - timedelta(hours=8),
        updated_at=now - timedelta(hours=8)
    )
    db.add(rep3)
    db.flush()

    att3 = Attachment(
        report_id=rep3.id,
        file_path=img3,
        file_name="demo_material_inestable.jpg",
        file_size=48900,
        mime_type="image/jpeg",
        is_evidence=False,
        created_at=rep3.created_at
    )
    db.add(att3)

    db.add(AuditLog(
        report_id=rep3.id,
        user_id=None,
        action_type="CREACION",
        details="Reporte emitido de manera anónima por personal de planta.",
        created_at=rep3.created_at
    ))

    # --- EJEMPLO 4: Acto inseguro en Soldadura (Cerrado) ---
    img4 = generate_sample_image(
        "demo_soldadura_sin_mascara.jpg",
        "TAREA DE SOLDADURA SIN MASCARA FACIAL",
        "Operario punteando estructura sin proteccion ocular completa",
        (30, 20, 45)
    )
    rep4 = Report(
        code="SST-2026-00004",
        report_type_id=type_acto.id,
        location_id=loc_soldadura.id,
        reporter_id=user_sst.id,
        description="Se observa una tarea de soldadura realizada sin utilizar correctamente la protección facial reglamentaria.",
        urgency="Media",
        immediate_danger=False,
        is_anonymous=False,
        status="Cerrado",
        close_reason="Se verificó la realización de la inducción y el compromiso firmado del personal del turno.",
        created_at=now - timedelta(days=6),
        updated_at=now - timedelta(days=4),
        closed_at=now - timedelta(days=4)
    )
    db.add(rep4)
    db.flush()

    att4 = Attachment(
        report_id=rep4.id,
        file_path=img4,
        file_name="demo_soldadura_sin_mascara.jpg",
        file_size=42100,
        mime_type="image/jpeg",
        is_evidence=False,
        created_at=rep4.created_at
    )
    db.add(att4)

    calc4 = risk_service.calculate_risk(4, 3)
    risk4 = RiskAssessment(
        report_id=rep4.id,
        assessor_id=user_sst.id,
        probability=4,
        consequence=3,
        risk_score=calc4["risk_score"],
        risk_level=calc4["risk_level"],
        methodology="Matriz 5x5 (P x C)",
        observations="Riesgo de queratoconjuntivitis actínica (ojo de soldador) por radiación ultravioleta.",
        created_at=now - timedelta(days=6)
    )
    db.add(risk4)

    act4 = Action(
        report_id=rep4.id,
        assigned_to_id=user_worker.id,
        description="Charla de 5 minutos sobre radiación UV e importancia del uso continuo de máscara fotosensible.",
        action_type="Acción correctiva",
        control_hierarchy="Control administrativo",
        status="Verificada",
        due_date=now - timedelta(days=5),
        completed_at=now - timedelta(days=5),
        verified_at=now - timedelta(days=4),
        created_at=now - timedelta(days=6),
        observations="Capacitación realizada a todo el equipo de soldadura del turno mañana."
    )
    db.add(act4)

    # Evidencia de cierre
    img_ev4 = generate_sample_image(
        "demo_charla_asistencia.jpg",
        "PLANILLA DE ASISTENCIA CAPACITACION UV",
        "Firma de compromiso de uso obligatorio de EPP facial",
        (10, 50, 30)
    )
    att_ev4 = Attachment(
        report_id=rep4.id,
        file_path=img_ev4,
        file_name="demo_charla_asistencia.jpg",
        file_size=39000,
        mime_type="image/jpeg",
        is_evidence=True,
        created_at=now - timedelta(days=5)
    )
    db.add(att_ev4)
    db.flush()

    db.add(ActionEvidence(
        action_id=act4.id,
        attachment_id=att_ev4.id,
        notes="Se adjunta registro firmado de asistencia a la charla de 5 minutos.",
        created_at=now - timedelta(days=5)
    ))

    db.add(AuditLog(
        report_id=rep4.id,
        user_id=user_sst.id,
        action_type="CREACION",
        details="Observación registrada durante recorrido de seguridad.",
        created_at=rep4.created_at
    ))
    db.add(AuditLog(
        report_id=rep4.id,
        user_id=user_sst.id,
        action_type="CIERRE",
        details="Reporte cerrado satisfactoriamente tras verificación de la medida preventiva.",
        created_at=now - timedelta(days=4)
    ))

    # Notificaciones iniciales
    db.add(Notification(
        user_id=user_worker.id,
        report_id=rep1.id,
        title="Acción asignada",
        message="Se te ha asignado la acción: 'Instalar rampa pasacables de goma de alta resistencia'.",
        is_read=False,
        created_at=now - timedelta(days=2)
    ))
    db.add(Notification(
        user_id=user_sst.id,
        report_id=rep3.id,
        title="Nuevo reporte recibido",
        message="Se recibió un reporte anónimo en Área de almacenamiento con Urgencia Alta.",
        is_read=False,
        created_at=now - timedelta(hours=8)
    ))

    db.commit()

