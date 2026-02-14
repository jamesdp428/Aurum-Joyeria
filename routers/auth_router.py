from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from typing import List
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
import secrets
import uuid

from supabase_client import supabase
from schemas import UsuarioCreate, UsuarioLogin, Token
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token
)
from email_service import send_verification_email, send_password_reset_email

router = APIRouter(prefix="/auth")

# ========== FUNCIÓN AUXILIAR PARA TIMEZONE ==========

def utc_now():
    """Retorna datetime con timezone UTC"""
    return datetime.now(timezone.utc)

# ========== SCHEMAS ADICIONALES ==========

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class RequestPasswordResetRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    code: str
    new_password: str

class VerifyEmailCodeRequest(BaseModel):
    code: str

# ========== HELPER FUNCTIONS ==========

def create_user_session_data(user: dict) -> dict:
    """Crea datos de sesión del usuario"""
    return {
        "id": str(user["id"]),
        "email": user["email"],
        "nombre": user["nombre"],
        "rol": user["rol"],
        "email_verificado": user.get("email_verified", False)
    }

def get_current_user_from_token(token: str) -> dict:
    """Obtiene usuario desde token"""
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )
    
    user = supabase.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado"
        )
    
    return user

# ========== REGISTRO ==========

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UsuarioCreate, request: Request):
    """Registra un nuevo usuario"""
    
    try:
        # Verificar si el email ya existe
        existing_user = supabase.get_user_by_email(user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está registrado"
            )
        
        verification_code = secrets.token_urlsafe(32)
        
        # Crear usuario
        new_user_data = {
            "id": str(uuid.uuid4()),
            "email": user_data.email,
            "nombre": user_data.nombre,
            "password_hash": hash_password(user_data.password),
            "rol": "usuario",
            "email_verified": False,
            "verification_code": verification_code,
            "verification_expires": (utc_now() + timedelta(hours=24)).isoformat(),
            "created_at": utc_now().isoformat()
        }
        
        new_user = supabase.create_user(new_user_data)
        
        if not new_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear usuario"
            )
        
        # 🔥 ENVIAR EMAIL DE VERIFICACIÓN
        try:
            send_verification_email(
                to_email=new_user["email"],
                nombre=new_user["nombre"],
                code=verification_code
            )
            print(f"✅ Email de verificación enviado a {new_user['email']}")
        except Exception as email_error:
            print(f"⚠️ Error enviando email de verificación: {email_error}")
            # No fallar el registro si el email falla
        
        # Crear token
        access_token = create_access_token(data={"sub": str(new_user["id"])})
        
        # Guardar sesión
        request.session["user"] = create_user_session_data(new_user)
        
        print(f"✅ Usuario registrado: {new_user['email']}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": new_user
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error en registro: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

# ========== LOGIN ==========

@router.post("/login", response_model=Token)
async def login(user_data: UsuarioLogin, request: Request):
    """Inicia sesión"""
    
    try:
        print(f"🔐 Intentando login para: {user_data.email}")
        
        # Buscar usuario por email
        user = supabase.get_user_by_email(user_data.email)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email o contraseña incorrectos"
            )
        
        # Verificar contraseña
        if not verify_password(user_data.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email o contraseña incorrectos"
            )
        
        # Crear token
        access_token = create_access_token(data={"sub": str(user["id"])})
        
        # Guardar sesión
        request.session["user"] = create_user_session_data(user)
        
        print(f"✅ Login exitoso: {user['email']} (rol: {user['rol']})")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error en login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@router.post("/logout")
async def logout_endpoint(request: Request):
    """Cierra sesión"""
    request.session.clear()
    return {"message": "Sesión cerrada exitosamente"}

# ========== PERFIL ==========

@router.get("/me")
async def get_current_user_profile(request: Request):
    """Obtiene el perfil del usuario actual"""
    
    # Primero intentar obtener desde sesión o token
    user_session = request.session.get("user")
    user_id = None
    
    if user_session:
        user_id = user_session.get("id")
    else:
        # Intentar desde token
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                user = get_current_user_from_token(token)
                user_id = user.get("id")
            except HTTPException:
                pass
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado"
        )
    
    # Obtener datos frescos desde Supabase
    user = supabase.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Actualizar sesión con datos frescos
    request.session["user"] = create_user_session_data(user)
    
    print(f"✅ Perfil obtenido: {user['email']}")
    
    return user

@router.put("/me")
async def update_profile(nombre: str, request: Request):
    """Actualiza el perfil"""
    
    user_session = request.session.get("user")
    if not user_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado"
        )
    
    user_id = user_session["id"]
    updated_user = supabase.update_user(user_id, {"nombre": nombre})
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar usuario"
        )
    
    # Actualizar sesión con datos frescos
    request.session["user"] = create_user_session_data(updated_user)
    
    print(f"✅ Perfil actualizado: {updated_user['email']}")
    
    return updated_user

# ========== CAMBIO DE CONTRASEÑA ==========

@router.post("/change-password")
async def change_password(request_data: ChangePasswordRequest, request: Request):
    """Cambia la contraseña del usuario"""
    
    user_session = request.session.get("user")
    if not user_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado"
        )
    
    # Obtener datos frescos de la DB
    user = supabase.get_user_by_id(user_session["id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    if not verify_password(request_data.current_password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta"
        )
    
    if len(request_data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe tener al menos 6 caracteres"
        )
    
    new_hash = hash_password(request_data.new_password)
    supabase.update_user(user["id"], {"password_hash": new_hash})
    
    print(f"✅ Contraseña cambiada: {user['email']}")
    
    return {"message": "Contraseña actualizada exitosamente"}

# ========== VERIFICACIÓN DE EMAIL ==========

@router.post("/verify-email-code")
async def verify_email_with_code(request_data: VerifyEmailCodeRequest, request: Request):
    """Verifica el email con código manual"""
    
    user_session = request.session.get("user")
    if not user_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado"
        )
    
    # Obtener datos frescos de la DB
    user = supabase.get_user_by_id(user_session["id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    if user.get("email_verified"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está verificado"
        )
    
    if not user.get("verification_code"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay código de verificación pendiente"
        )
    
    if user["verification_code"] != request_data.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código inválido"
        )
    
    # Verificar expiración
    expires = datetime.fromisoformat(user["verification_expires"].replace('Z', '+00:00'))
    if utc_now() > expires:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El código ha expirado"
        )
    
    # Verificar email
    updated_user = supabase.update_user(user["id"], {
        "email_verified": True,
        "verification_code": None,
        "verification_expires": None
    })
    
    # Actualizar sesión con datos frescos
    request.session["user"] = create_user_session_data(updated_user)
    
    print(f"✅ Email verificado: {updated_user['email']}")
    
    return {"message": "Email verificado exitosamente"}

# 🔥 NUEVO: Reenviar código de verificación
@router.post("/resend-verification")
async def resend_verification(request: Request):
    """Reenvía el código de verificación por email"""
    
    user_session = request.session.get("user")
    if not user_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado"
        )
    
    # Obtener datos frescos de la DB
    user = supabase.get_user_by_id(user_session["id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    if user.get("email_verified"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está verificado"
        )
    
    # Generar nuevo código
    new_code = secrets.token_urlsafe(32)
    new_expires = (utc_now() + timedelta(hours=24)).isoformat()
    
    # Actualizar usuario con nuevo código
    supabase.update_user(user["id"], {
        "verification_code": new_code,
        "verification_expires": new_expires
    })
    
    # Enviar email
    try:
        send_verification_email(
            to_email=user["email"],
            nombre=user["nombre"],
            code=new_code
        )
        print(f"✅ Código de verificación reenviado a {user['email']}")
        return {"message": "Código de verificación enviado a tu email"}
    except Exception as e:
        print(f"❌ Error enviando email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al enviar el email"
        )

# 🔥 NUEVO: Solicitar recuperación de contraseña
@router.post("/request-password-reset")
async def request_password_reset(request_data: RequestPasswordResetRequest):
    """Solicita un código para recuperar contraseña"""
    
    user = supabase.get_user_by_email(request_data.email)
    
    # Por seguridad, siempre responder OK aunque el email no exista
    if not user:
        print(f"⚠️ Intento de reset para email inexistente: {request_data.email}")
        return {"message": "Si el email existe, recibirás un código de recuperación"}
    
    # Generar código de recuperación
    reset_code = secrets.token_urlsafe(32)
    reset_expires = (utc_now() + timedelta(hours=1)).isoformat()
    
    # Guardar código en el usuario
    supabase.update_user(user["id"], {
        "password_reset_code": reset_code,
        "password_reset_expires": reset_expires
    })
    
    # Enviar email
    try:
        send_password_reset_email(
            to_email=user["email"],
            nombre=user["nombre"],
            code=reset_code
        )
        print(f"✅ Código de recuperación enviado a {user['email']}")
    except Exception as e:
        print(f"❌ Error enviando email de recuperación: {e}")
    
    return {"message": "Si el email existe, recibirás un código de recuperación"}

# 🔥 NUEVO: Restablecer contraseña con código
@router.post("/reset-password")
async def reset_password(request_data: ResetPasswordRequest):
    """Restablece la contraseña usando un código de recuperación"""
    
    if len(request_data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe tener al menos 6 caracteres"
        )
    
    # Buscar usuario por código de recuperación
    # Nota: Supabase REST API no permite filtrar por campos que no son id/email fácilmente
    # Necesitaremos obtener todos los usuarios y buscar (no ideal, pero funcional)
    all_users = supabase.get_all_users()
    
    user = None
    for u in all_users:
        if u.get("password_reset_code") == request_data.code:
            user = u
            break
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código inválido o expirado"
        )
    
    # Verificar expiración
    if user.get("password_reset_expires"):
        expires = datetime.fromisoformat(user["password_reset_expires"].replace('Z', '+00:00'))
        if utc_now() > expires:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El código ha expirado"
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código inválido"
        )
    
    # Actualizar contraseña y limpiar código
    new_hash = hash_password(request_data.new_password)
    supabase.update_user(user["id"], {
        "password_hash": new_hash,
        "password_reset_code": None,
        "password_reset_expires": None
    })
    
    print(f"✅ Contraseña restablecida para: {user['email']}")
    
    return {"message": "Contraseña restablecida exitosamente"}

# ========== ADMIN ==========

@router.get("/users")
async def list_users(skip: int = 0, limit: int = 100, request: Request = None):
    """Lista todos los usuarios (solo admin)"""
    
    user_session = request.session.get("user")
    if not user_session or user_session.get("rol") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos de administrador"
        )
    
    users = supabase.get_all_users(skip, limit)
    return users

# 🔥 CORREGIDO: Eliminar cuenta
@router.delete("/delete-account")
async def delete_account(request: Request):
    """Elimina la cuenta del usuario actual"""
    
    user_session = request.session.get("user")
    if not user_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado"
        )
    
    user_id = user_session["id"]
    
    # Verificar si es admin
    if user_session.get("rol") == "admin":
        # Verificar que no sea el último admin
        all_users = supabase.get_all_users()
        admin_count = sum(1 for u in all_users if u.get("rol") == "admin")
        
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No puedes eliminar la última cuenta de administrador"
            )
    
    # Eliminar usuario
    try:
        success = supabase.delete_user(user_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al eliminar cuenta"
            )
        
        # Limpiar sesión
        request.session.clear()
        
        print(f"✅ Cuenta eliminada: {user_session['email']}")
        
        return {"message": "Cuenta eliminada exitosamente"}
        
    except Exception as e:
        print(f"❌ Error eliminando cuenta: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al eliminar cuenta"
        )