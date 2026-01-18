# auth.py - Sistema de autenticación completo (CORREGIDO)

from datetime import datetime, timedelta, timezone  # ✅ Agregar timezone
from typing import Optional
import uuid
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv

from db import get_db
from models import Usuario

load_dotenv()

# ========================================
# CONFIGURACIÓN
# ========================================

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 días

# Contexto para hashing de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security scheme para tokens Bearer
security = HTTPBearer()

# ========================================
# FUNCIONES DE HASHING
# ========================================

def hash_password(password: str) -> str:
    """Hashea una contraseña usando bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica que una contraseña coincida con su hash"""
    return pwd_context.verify(plain_password, hashed_password)

# ========================================
# FUNCIONES JWT
# ========================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Crea un token JWT
    
    Args:
        data: Datos a codificar en el token (típicamente user_id y email)
        expires_delta: Tiempo de expiración personalizado
        
    Returns:
        Token JWT codificado
    """
    to_encode = data.copy()
    
    # ✅ CORRECCIÓN: Usar datetime.now(timezone.utc) en lugar de datetime.utcnow()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    # ✅ IMPORTANTE: Convertir UUID a string si existe 'sub' con UUID
    if 'sub' in to_encode and isinstance(to_encode['sub'], uuid.UUID):
        to_encode['sub'] = str(to_encode['sub'])
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """
    Decodifica y valida un token JWT
    
    Args:
        token: Token JWT a decodificar
        
    Returns:
        Payload del token si es válido, None si es inválido
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

# ========================================
# AUTENTICACIÓN DE USUARIO
# ========================================

def authenticate_user(db: Session, email: str, password: str) -> Optional[Usuario]:
    """
    Autentica un usuario por email y contraseña
    
    Args:
        db: Sesión de base de datos
        email: Email del usuario
        password: Contraseña en texto plano
        
    Returns:
        Usuario si las credenciales son correctas, None si no
    """
    usuario = db.query(Usuario).filter(Usuario.email == email).first()
    
    if not usuario:
        return None
    
    if not verify_password(password, usuario.password_hash):
        return None
    
    return usuario

# ========================================
# OBTENER USUARIO ACTUAL (TOKEN)
# ========================================

async def get_current_user_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Usuario:
    """
    Obtiene el usuario actual desde un token Bearer
    Usado para endpoints API que requieren autenticación
    
    Args:
        credentials: Credenciales HTTP Bearer (token)
        db: Sesión de base de datos
        
    Returns:
        Usuario autenticado
        
    Raises:
        HTTPException: Si el token es inválido o el usuario no existe
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise credentials_exception
    
    user_id_str: str = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception
    
    # ✅ Convertir string de vuelta a UUID
    try:
        user_uuid = uuid.UUID(user_id_str)
    except (ValueError, AttributeError, TypeError):
        raise credentials_exception
    
    # ✅ Buscar usuario por UUID correcto
    usuario = db.query(Usuario).filter(Usuario.id == user_uuid).first()
    
    if usuario is None:
        raise credentials_exception
    
    return usuario

# ========================================
# OBTENER USUARIO ACTUAL (SESIÓN)
# ========================================

def get_current_user_session(request: Request) -> Optional[dict]:
    """
    Obtiene el usuario actual desde la sesión
    Usado para páginas HTML que usan cookies de sesión
    
    Args:
        request: Request object de FastAPI
        
    Returns:
        Diccionario con datos del usuario si está logueado, None si no
    """
    user_data = request.session.get("user")
    return user_data

def require_user_session(request: Request) -> dict:
    """
    Requiere que el usuario esté autenticado via sesión
    Lanza excepción si no está logueado
    
    Args:
        request: Request object de FastAPI
        
    Returns:
        Diccionario con datos del usuario
        
    Raises:
        HTTPException: Si no hay usuario en sesión
    """
    user = get_current_user_session(request)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado"
        )
    return user

# ========================================
# AUTENTICACIÓN HÍBRIDA (TOKEN O SESIÓN)
# ========================================

def get_current_user_hybrid(request: Request, db: Session) -> Optional[dict]:
    """
    Obtiene el usuario actual desde token Bearer o sesión
    Intenta primero con sesión, luego con token
    
    Args:
        request: Request object de FastAPI
        db: Sesión de base de datos
        
    Returns:
        Diccionario con datos del usuario si está autenticado, None si no
    """
    # Intentar obtener desde sesión primero
    user_session = get_current_user_session(request)
    if user_session:
        return user_session
    
    # Intentar obtener desde token Bearer
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        payload = decode_access_token(token)
        
        if payload:
            user_id_str = payload.get("sub")
            if user_id_str:
                try:
                    # ✅ Convertir string a UUID
                    user_uuid = uuid.UUID(user_id_str)
                    
                    # ✅ Buscar usuario por UUID
                    usuario = db.query(Usuario).filter(Usuario.id == user_uuid).first()
                    
                    if usuario:
                        return {
                            "id": str(usuario.id),  # ✅ Convertir UUID a string para JSON
                            "email": usuario.email,
                            "nombre": usuario.nombre,
                            "rol": usuario.rol,
                            "email_verificado": usuario.email_verified
                        }
                except (ValueError, AttributeError, TypeError):
                    pass  # UUID inválido, ignorar
    
    return None

# ========================================
# VERIFICACIÓN DE ROLES
# ========================================

def require_admin(user: dict) -> dict:
    """
    Verifica que el usuario tenga rol de administrador
    
    Args:
        user: Diccionario con datos del usuario
        
    Returns:
        Usuario si es admin
        
    Raises:
        HTTPException: Si el usuario no es admin
    """
    if not user or user.get("rol") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos de administrador"
        )
    return user

async def get_current_admin(
    current_user: Usuario = Depends(get_current_user_token)
) -> Usuario:
    """
    Obtiene el usuario actual y verifica que sea administrador
    Usado como dependencia en endpoints que requieren permisos de admin
    
    Args:
        current_user: Usuario actual obtenido del token
        
    Returns:
        Usuario si es administrador
        
    Raises:
        HTTPException: Si el usuario no es administrador
    """
    if current_user.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos de administrador"
        )
    return current_user

# ========================================
# UTILIDADES
# ========================================

def create_user_session_data(usuario: Usuario) -> dict:
    """
    Crea un diccionario con los datos del usuario para almacenar en sesión
    
    Args:
        usuario: Objeto Usuario de la base de datos
        
    Returns:
        Diccionario con datos seguros del usuario (sin contraseña)
    """
    return {
        "id": str(usuario.id),  # ✅ Convertir UUID a string
        "email": usuario.email,
        "nombre": usuario.nombre,
        "rol": usuario.rol,
        "email_verificado": usuario.email_verified
    }

def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Valida la fortaleza de una contraseña
    
    Args:
        password: Contraseña a validar
        
    Returns:
        Tupla (es_válida, mensaje_error)
    """
    if len(password) < 6:
        return False, "La contraseña debe tener al menos 6 caracteres"
    
    # Aquí puedes agregar más validaciones si quieres
    # Por ejemplo: mayúsculas, números, caracteres especiales
    
    return True, ""