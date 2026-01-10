from fastapi import APIRouter, Depends, HTTPException, status, Request  # ← AGREGAR Request
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
import secrets

from db import get_db
from models import Usuario
from schemas import UsuarioCreate, UsuarioLogin, UsuarioResponse, Token
from auth import (
    hash_password,
    authenticate_user,
    create_access_token,
    get_current_user_token,
    get_current_admin,
    verify_password
)
from email_service import send_verification_email, send_email_change_verification

router = APIRouter(prefix="/auth")

# ========== FUNCIÓN AUXILIAR PARA TIMEZONE ==========

def utc_now():
    """Retorna datetime con timezone UTC"""
    return datetime.now(timezone.utc)

# ========== SCHEMAS ADICIONALES ==========

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class RequestEmailChangeRequest(BaseModel):
    new_email: str

class ConfirmEmailChangeRequest(BaseModel):
    code: str

class VerifyEmailCodeRequest(BaseModel):
    code: str

# ========== REGISTRO CON VERIFICACIÓN ==========

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UsuarioCreate, db: Session = Depends(get_db)):
    """Registra un nuevo usuario y envía email de verificación"""
    
    existing_user = db.query(Usuario).filter(Usuario.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    verification_code = secrets.token_urlsafe(32)
    
    new_user = Usuario(
        email=user_data.email,
        nombre=user_data.nombre,
        password_hash=hash_password(user_data.password),
        rol="usuario",
        email_verified=False,
        verification_code=verification_code,
        verification_expires=utc_now() + timedelta(hours=24)
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Enviar email de verificación
    send_verification_email(new_user.email, new_user.nombre, verification_code)
    
    # Crear token PERO el usuario debe verificar antes de usar la app
    access_token = create_access_token(data={"sub": str(new_user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }

# ========== VERIFICAR EMAIL ==========

@router.get("/verify-email", response_class=HTMLResponse)
async def verify_email(code: str, db: Session = Depends(get_db)):
    """Verifica el email con el código recibido"""
    
    user = db.query(Usuario).filter(Usuario.verification_code == code).first()
    
    if not user:
        return """
        <html>
            <head>
                <title>Error - Aurum Joyería</title>
                <style>
                    body { font-family: Arial; background: #000; color: #fff; text-align: center; padding: 50px; }
                    .container { background: #1a1a1a; border: 2px solid #f44336; border-radius: 20px; padding: 40px; max-width: 500px; margin: 0 auto; }
                    h1 { color: #f44336; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>❌ Código Inválido</h1>
                    <p>El código de verificación no es válido.</p>
                    <a href="/" style="color: #f9dc5e;">Volver al inicio</a>
                </div>
            </body>
        </html>
        """
    
    # Comparar fechas con timezone
    if utc_now() > user.verification_expires:
        return """
        <html>
            <head>
                <title>Expirado - Aurum Joyería</title>
                <style>
                    body { font-family: Arial; background: #000; color: #fff; text-align: center; padding: 50px; }
                    .container { background: #1a1a1a; border: 2px solid #ff9800; border-radius: 20px; padding: 40px; max-width: 500px; margin: 0 auto; }
                    h1 { color: #ff9800; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>⏰ Código Expirado</h1>
                    <p>El código de verificación ha expirado. Solicita uno nuevo desde tu perfil.</p>
                    <a href="/perfil" style="color: #f9dc5e;">Ir a mi perfil</a>
                </div>
            </body>
        </html>
        """
    
    # Verificar email
    user.email_verified = True
    user.verification_code = None
    user.verification_expires = None
    db.commit()
    
    return """
    <html>
        <head>
            <title>Verificado - Aurum Joyería</title>
            <meta http-equiv="refresh" content="3;url=/">
            <style>
                body { font-family: Arial; background: #000; color: #fff; text-align: center; padding: 50px; }
                .container { background: linear-gradient(145deg, #1e1e1e, #2a2a2a); border: 2px solid #f9dc5e; border-radius: 20px; padding: 40px; max-width: 500px; margin: 0 auto; }
                h1 { color: #f9dc5e; }
                .checkmark { font-size: 80px; color: #4CAF50; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="checkmark">✓</div>
                <h1>¡Email Verificado!</h1>
                <p>Tu cuenta ha sido verificada exitosamente.</p>
                <p>Serás redirigido en 3 segundos...</p>
                <a href="/" style="color: #f9dc5e;">Ir ahora</a>
            </div>
        </body>
    </html>
    """

# ========== REENVIAR CÓDIGO ==========

@router.post("/resend-verification")
async def resend_verification(
    current_user: Usuario = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    """Reenvía el código de verificación"""
    
    if current_user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está verificado"
        )
    
    verification_code = secrets.token_urlsafe(32)
    current_user.verification_code = verification_code
    current_user.verification_expires = utc_now() + timedelta(hours=24)
    db.commit()
    
    send_verification_email(current_user.email, current_user.nombre, verification_code)
    
    return {"message": "Código reenviado exitosamente"}

# ========== VERIFICAR EMAIL CON CÓDIGO MANUAL ==========

@router.post("/verify-email-code")
async def verify_email_with_code(
    request: VerifyEmailCodeRequest,
    current_user: Usuario = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    """Verifica el email con código manual (desde perfil)"""
    
    if current_user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está verificado"
        )
    
    if not current_user.verification_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay código de verificación pendiente"
        )
    
    if current_user.verification_code != request.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código inválido"
        )
    
    if utc_now() > current_user.verification_expires:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El código ha expirado"
        )
    
    # Verificar email
    current_user.email_verified = True
    current_user.verification_code = None
    current_user.verification_expires = None
    db.commit()
    
    return {"message": "Email verificado exitosamente"}

# ========== LOGIN - ¡AQUÍ ESTÁ EL FIX! ==========

@router.post("/login", response_model=Token)
async def login(
    user_data: UsuarioLogin, 
    request: Request,  # ← AGREGAR Request
    db: Session = Depends(get_db)
):
    """Inicia sesión"""
    
    user = authenticate_user(db, user_data.email, user_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # ✅ CRÍTICO: Usar str(user.id) en lugar de user.email
    access_token = create_access_token(data={"sub": str(user.id)})
    
    # ✅ NUEVO: Guardar sesión en el servidor
    request.session["user"] = {
        "id": str(user.id),
        "email": user.email,
        "nombre": user.nombre,
        "rol": user.rol,
        "email_verificado": user.email_verified
    }
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }
    
@router.post("/logout")
async def logout_endpoint(request: Request):
    """Cierra sesión y limpia la sesión del servidor"""
    request.session.clear()
    return {"message": "Sesión cerrada exitosamente"}

# ========== PERFIL ==========

@router.get("/me", response_model=UsuarioResponse)
async def get_current_user_profile(current_user: Usuario = Depends(get_current_user_token)):
    """Obtiene el perfil del usuario actual"""
    return current_user

@router.put("/me", response_model=UsuarioResponse)
async def update_profile(
    nombre: str = None,
    current_user: Usuario = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    """Actualiza el perfil"""
    
    if nombre:
        current_user.nombre = nombre
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

# ========== CAMBIO DE CONTRASEÑA ==========

@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: Usuario = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    """Cambia la contraseña del usuario"""
    
    # Verificar contraseña actual
    if not verify_password(request.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta"
        )
    
    # Validar nueva contraseña
    if len(request.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe tener al menos 6 caracteres"
        )
    
    # Actualizar contraseña
    current_user.password_hash = hash_password(request.new_password)
    db.commit()
    
    return {"message": "Contraseña actualizada exitosamente"}

# ========== CAMBIO DE EMAIL ==========

@router.post("/request-email-change")
async def request_email_change(
    request: RequestEmailChangeRequest,
    current_user: Usuario = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    """Solicita cambio de email"""
    
    # Verificar que el nuevo email no esté en uso
    existing = db.query(Usuario).filter(Usuario.email == request.new_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está en uso"
        )
    
    # Generar código
    code = secrets.token_urlsafe(32)
    
    # Guardar solicitud pendiente
    current_user.pending_email = request.new_email
    current_user.pending_email_code = code
    current_user.pending_email_expires = utc_now() + timedelta(hours=1)
    db.commit()
    
    # Enviar email
    send_email_change_verification(request.new_email, current_user.nombre, code)
    
    return {"message": f"Código enviado a {request.new_email}"}

@router.post("/confirm-email-change")
async def confirm_email_change(
    request: ConfirmEmailChangeRequest,
    current_user: Usuario = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    """Confirma cambio de email"""
    
    if not current_user.pending_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay cambio de email pendiente"
        )
    
    if current_user.pending_email_code != request.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código inválido"
        )
    
    # Comparar con timezone
    if utc_now() > current_user.pending_email_expires:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El código ha expirado"
        )
    
    # Actualizar email
    current_user.email = current_user.pending_email
    current_user.pending_email = None
    current_user.pending_email_code = None
    current_user.pending_email_expires = None
    current_user.email_verified = True
    db.commit()
    
    return {"message": "Email actualizado exitosamente"}

# ========== ADMIN ==========

@router.get("/users", response_model=List[UsuarioResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    current_admin: Usuario = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Lista todos los usuarios (solo admin)"""
    users = db.query(Usuario).offset(skip).limit(limit).all()
    return users

@router.put("/users/{user_id}/promote", response_model=UsuarioResponse)
async def promote_to_admin(
    user_id: str,
    current_admin: Usuario = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Promueve un usuario a administrador (solo admin)"""
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    user.rol = "admin"
    db.commit()
    db.refresh(user)
    
    return user

# ========== ELIMINAR CUENTA ==========

@router.delete("/delete-account")
async def delete_account(
    current_user: Usuario = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    """Elimina la cuenta del usuario actual"""
    
    # No permitir que admins se eliminen a sí mismos si son el último admin
    if current_user.rol == "admin":
        admin_count = db.query(Usuario).filter(Usuario.rol == "admin").count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No puedes eliminar la última cuenta de administrador"
            )
    
    # Eliminar usuario
    db.delete(current_user)
    db.commit()
    
    return {"message": "Cuenta eliminada exitosamente"}