from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, Role
from app.models.report import Location
from app.schemas.user import UserOut, UserCreate, RoleOut
from app.schemas.report import LocationOut
from app.services.auth_service import require_roles, hash_password
from app.services.seed_service import seed_database

router = APIRouter(prefix="/admin", tags=["Administración"])

@router.get("/users", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["administrador"]))
):
    """Lista todos los usuarios del sistema."""
    return db.query(User).all()

@router.get("/roles", response_model=List[RoleOut])
def list_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["administrador"]))
):
    """Lista todos los roles disponibles."""
    return db.query(Role).all()

@router.post("/users", response_model=UserOut)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["administrador"]))
):
    """Crea un nuevo usuario en la plataforma."""
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El nombre de usuario ya existe.")
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El correo electrónico ya existe.")

    role = db.query(Role).filter(Role.id == data.role_id).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rol inválido.")

    user = User(
        username=data.username,
        email=data.email,
        full_name=data.full_name,
        password_hash=hash_password(data.password),
        role_id=data.role_id,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)

@router.post("/locations", response_model=LocationOut)
def create_location(
    name: str,
    description: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["administrador"]))
):
    """Agrega un nuevo sector o ubicación operativa."""
    if db.query(Location).filter(Location.name == name.strip()).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La ubicación ya se encuentra registrada.")

    loc = Location(name=name.strip(), description=description.strip(), is_active=True)
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return LocationOut.model_validate(loc)

@router.post("/reset-demo")
def reset_demo(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["administrador"]))
):
    """Restaura la base de datos completa con los casos de demostración iniciales."""
    seed_database(db, reset=True)
    return {"message": "Base de datos restablecida con éxito a los datos de demostración del taller de soldadura."}
