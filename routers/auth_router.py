"""
auth_router.py — Router de autenticación
Soporta sesión de servidor Y Bearer token en todos los endpoints protegidos.

CORRECCIONES:
- _get_user_from_request: la clave de sesión era "email_verificado" pero se
  comparaba con "id" inexistente al hacer get_user_by_id desde token —
  ahora se normaliza correctamente.
- Se agrega /delete-account al router con el método correcto.
- Mejor manejo de errores en create_user para dar mensajes más claros.
"""

from fastapi import APIRouter, HTTPException, status, Request
from fastapi.responses import RedirectResponse
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
    decode_access_token,
)
from email_service import (
    send_verification_email,
    send_password_reset_email,
    send_email_change_verification,
)

router = APIRouter(prefix="/auth")


# ── Helpers ────────────────────────────────────────────────────────────────────

def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def create_user_session_data(user: dict) -> dict:
    """
    Crea dict de sesión normalizado.
    IMPORTANTE: siempre usamos 'email_verified' (no 'email_verificado')
    para mantener consistencia con la BD y el frontend.
    """
    return {
        "id":             str(user["id"]),
        "email":          user["email"],
        "nombre":         user["nombre"],
        "rol":            user["rol"],
        # Soportar ambas claves por si viene de distintos orígenes
        "email_verified": user.get("email_verified", user.get("email_verificado", False)),
    }


def _get_user_from_request(request: Request) -> dict | None:
    """
    Obtiene el usuario autenticado desde:
      1. Sesión del servidor (cookie)
      2. Header Authorization: Bearer <token>
    """
    # 1. Sesión
    user_session = request.session.get("user")
    if user_session:
        return user_session

    # 2. Bearer token
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        payload = decode_access_token(token)
        if payload:
            user_id = payload.get("sub")
            if user_id:
                try:
                    user = supabase.get_user_by_id(str(user_id))
                    if user:
                        return create_user_session_data(user)
                except Exception as e:
                    print(f"⚠️ Error obteniendo usuario por token: {e}")
    return None


def _require_user(request: Request) -> dict:
    """Como _get_user_from_request pero lanza 401 si no hay usuario."""
    user = _get_user_from_request(request)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado",
        )
    return user


# ── Schemas ───────────────────────────────────────────────────────────────────

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

class RequestEmailChangeRequest(BaseModel):
    new_email: str

class VerifyEmailChangeRequest(BaseModel):
    code: str


# ── REGISTRO ──────────────────────────────────────────────────────────────────

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UsuarioCreate, request: Request):
    """Registra un nuevo usuario y envía email de verificación."""

    # Verificar duplicado
    existing = supabase.get_user_by_email(user_data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado",
        )

    verification_code = secrets.token_urlsafe(32)

    new_user_data = {
        "id":                   str(uuid.uuid4()),
        "email":                user_data.email,
        "nombre":               user_data.nombre,
        "password_hash":        hash_password(user_data.password),
        "rol":                  "usuario",
        "email_verified":       False,
        "verification_code":    verification_code,
        "verification_expires": (utc_now() + timedelta(hours=24)).isoformat(),
        "created_at":           utc_now().isoformat(),
    }

    try:
        new_user = supabase.create_user(new_user_data)
    except Exception as e:
        print(f"❌ Excepción al crear usuario: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear usuario en la base de datos: {str(e)}",
        )

    if not new_user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear usuario: la base de datos no devolvió el registro. "
                   "Verifica que el RLS de Supabase esté deshabilitado en la tabla 'usuarios'.",
        )

    # Enviar verificación (no bloquear si falla)
    try:
        send_verification_email(new_user["email"], new_user["nombre"], verification_code)
    except Exception as e:
        print(f"⚠️ No se pudo enviar email de verificación: {e}")

    access_token = create_access_token(data={"sub": str(new_user["id"])})
    request.session["user"] = create_user_session_data(new_user)

    print(f"✅ Registro exitoso: {new_user['email']}")
    return {"access_token": access_token, "token_type": "bearer", "user": new_user}


# ── LOGIN ─────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=Token)
async def login(user_data: UsuarioLogin, request: Request):
    """Inicia sesión y devuelve token JWT."""

    try:
        user = supabase.get_user_by_email(user_data.email)
    except Exception as e:
        print(f"❌ Error consultando usuario en login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al consultar la base de datos. "
                   "Verifica que el RLS de Supabase esté deshabilitado.",
        )

    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )

    access_token = create_access_token(data={"sub": str(user["id"])})
    session_data = create_user_session_data(user)
    request.session["user"] = session_data

    print(f"✅ Login: {user['email']} (rol: {user['rol']})")
    return {"access_token": access_token, "token_type": "bearer", "user": user}


# ── LOGOUT ────────────────────────────────────────────────────────────────────

@router.post("/logout")
async def logout_endpoint(request: Request):
    request.session.clear()
    return {"message": "Sesión cerrada"}


# ── PERFIL ────────────────────────────────────────────────────────────────────

@router.get("/me")
async def get_profile(request: Request):
    """Devuelve el perfil completo del usuario (datos frescos de BD)."""
    user_session = _require_user(request)

    try:
        user = supabase.get_user_by_id(user_session["id"])
    except Exception as e:
        print(f"❌ Error obteniendo perfil: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener perfil de la base de datos")

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Refrescar sesión
    request.session["user"] = create_user_session_data(user)
    return user


@router.put("/me")
async def update_profile(nombre: str, request: Request):
    """Actualiza el nombre del usuario."""
    user_session = _require_user(request)

    updated = supabase.update_user(user_session["id"], {"nombre": nombre})
    if not updated:
        raise HTTPException(status_code=500, detail="Error al actualizar usuario")

    request.session["user"] = create_user_session_data(updated)
    return updated


# ── CAMBIO DE CONTRASEÑA ──────────────────────────────────────────────────────

@router.post("/change-password")
async def change_password(body: ChangePasswordRequest, request: Request):
    """Cambia la contraseña (requiere la contraseña actual)."""
    user_session = _require_user(request)

    user = supabase.get_user_by_id(user_session["id"])
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if not verify_password(body.current_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")

    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 6 caracteres")

    supabase.update_user(user["id"], {"password_hash": hash_password(body.new_password)})
    print(f"✅ Contraseña cambiada: {user['email']}")
    return {"message": "Contraseña actualizada exitosamente"}


# ── VERIFICACIÓN DE EMAIL ─────────────────────────────────────────────────────

@router.get("/verify-email")
async def verify_email_link(code: str):
    """
    Endpoint que se activa al hacer clic en el botón del correo.
    Verifica el email y redirige al perfil.
    """
    all_users = supabase.get_all_users()
    user = next((u for u in all_users if u.get("verification_code") == code), None)

    if not user:
        return RedirectResponse(url="/perfil?verified=error", status_code=303)

    expires_raw = user.get("verification_expires")
    if expires_raw:
        expires = datetime.fromisoformat(expires_raw.replace("Z", "+00:00"))
        if utc_now() > expires:
            return RedirectResponse(url="/perfil?verified=expired", status_code=303)

    supabase.update_user(user["id"], {
        "email_verified":       True,
        "verification_code":    None,
        "verification_expires": None,
    })
    print(f"✅ Email verificado (link): {user['email']}")
    return RedirectResponse(url="/perfil?verified=ok", status_code=303)


@router.post("/verify-email-code")
async def verify_email_with_code(body: VerifyEmailCodeRequest, request: Request):
    """Verifica el email pegando el código manualmente desde el perfil."""
    user_session = _require_user(request)

    user = supabase.get_user_by_id(user_session["id"])
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if user.get("email_verified"):
        raise HTTPException(status_code=400, detail="El email ya está verificado")

    if not user.get("verification_code"):
        raise HTTPException(status_code=400, detail="No hay código de verificación pendiente")

    if user["verification_code"] != body.code:
        raise HTTPException(status_code=400, detail="Código inválido")

    expires_raw = user.get("verification_expires")
    if expires_raw:
        expires = datetime.fromisoformat(expires_raw.replace("Z", "+00:00"))
        if utc_now() > expires:
            raise HTTPException(status_code=400, detail="El código ha expirado")

    updated = supabase.update_user(user["id"], {
        "email_verified":       True,
        "verification_code":    None,
        "verification_expires": None,
    })
    request.session["user"] = create_user_session_data(updated)
    print(f"✅ Email verificado (código): {updated['email']}")
    return {"message": "Email verificado exitosamente"}


@router.post("/resend-verification")
async def resend_verification(request: Request):
    """Reenvía el código de verificación al email del usuario."""
    user_session = _require_user(request)

    user = supabase.get_user_by_id(user_session["id"])
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if user.get("email_verified"):
        raise HTTPException(status_code=400, detail="El email ya está verificado")

    new_code    = secrets.token_urlsafe(32)
    new_expires = (utc_now() + timedelta(hours=24)).isoformat()

    supabase.update_user(user["id"], {
        "verification_code":    new_code,
        "verification_expires": new_expires,
    })

    ok = send_verification_email(user["email"], user["nombre"], new_code)
    if not ok:
        raise HTTPException(status_code=500, detail="Error al enviar el email")

    print(f"✅ Verificación reenviada: {user['email']}")
    return {"message": "Código de verificación enviado a tu email"}


# ── RECUPERACIÓN DE CONTRASEÑA ────────────────────────────────────────────────

@router.post("/request-password-reset")
async def request_password_reset(body: RequestPasswordResetRequest):
    """
    Genera un código de recuperación y lo envía por email.
    Siempre responde OK (no revela si el email existe).
    """
    user = supabase.get_user_by_email(body.email)

    if not user:
        print(f"⚠️ Reset solicitado para email inexistente: {body.email}")
        return {"message": "Si el email existe, recibirás un código de recuperación"}

    reset_code    = secrets.token_urlsafe(32)
    reset_expires = (utc_now() + timedelta(hours=1)).isoformat()

    supabase.update_user(user["id"], {
        "password_reset_code":    reset_code,
        "password_reset_expires": reset_expires,
    })

    try:
        send_password_reset_email(user["email"], user["nombre"], reset_code)
    except Exception as e:
        print(f"❌ Error enviando email de recuperación: {e}")

    return {"message": "Si el email existe, recibirás un código de recuperación"}


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest):
    """Restablece la contraseña usando el código de recuperación."""

    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")

    all_users = supabase.get_all_users()
    user = next((u for u in all_users if u.get("password_reset_code") == body.code), None)

    if not user:
        raise HTTPException(status_code=400, detail="Código inválido o expirado")

    expires_raw = user.get("password_reset_expires")
    if not expires_raw:
        raise HTTPException(status_code=400, detail="Código inválido")

    expires = datetime.fromisoformat(expires_raw.replace("Z", "+00:00"))
    if utc_now() > expires:
        raise HTTPException(status_code=400, detail="El código ha expirado. Solicita uno nuevo.")

    supabase.update_user(user["id"], {
        "password_hash":          hash_password(body.new_password),
        "password_reset_code":    None,
        "password_reset_expires": None,
    })

    print(f"✅ Contraseña restablecida: {user['email']}")
    return {"message": "Contraseña restablecida exitosamente"}


# ── CAMBIO DE EMAIL ───────────────────────────────────────────────────────────

@router.post("/request-email-change")
async def request_email_change(body: RequestEmailChangeRequest, request: Request):
    """Solicita cambio de email: envía código al nuevo correo."""
    user_session = _require_user(request)

    if supabase.get_user_by_email(body.new_email):
        raise HTTPException(status_code=400, detail="Ese email ya está registrado")

    code    = secrets.token_urlsafe(32)
    expires = (utc_now() + timedelta(hours=1)).isoformat()

    supabase.update_user(user_session["id"], {
        "pending_email":         body.new_email,
        "pending_email_code":    code,
        "pending_email_expires": expires,
    })

    user = supabase.get_user_by_id(user_session["id"])
    try:
        send_email_change_verification(body.new_email, user["nombre"], code)
    except Exception as e:
        print(f"❌ Error enviando email de cambio: {e}")
        raise HTTPException(status_code=500, detail="Error al enviar el email de verificación")

    return {"message": "Código enviado al nuevo correo. Pégalo en tu perfil para confirmar el cambio."}


@router.post("/verify-email-change")
async def verify_email_change(body: VerifyEmailChangeRequest, request: Request):
    """Confirma el cambio de email con el código recibido."""
    user_session = _require_user(request)

    user = supabase.get_user_by_id(user_session["id"])
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if not user.get("pending_email_code") or user["pending_email_code"] != body.code:
        raise HTTPException(status_code=400, detail="Código inválido")

    expires_raw = user.get("pending_email_expires")
    if expires_raw:
        expires = datetime.fromisoformat(expires_raw.replace("Z", "+00:00"))
        if utc_now() > expires:
            raise HTTPException(status_code=400, detail="El código ha expirado")

    updated = supabase.update_user(user["id"], {
        "email":                 user["pending_email"],
        "pending_email":         None,
        "pending_email_code":    None,
        "pending_email_expires": None,
    })
    request.session["user"] = create_user_session_data(updated)
    print(f"✅ Email cambiado a: {updated['email']}")
    return {"message": "Email actualizado exitosamente"}


# ── ELIMINAR CUENTA ───────────────────────────────────────────────────────────

@router.delete("/delete-account")
async def delete_account(request: Request):
    """Elimina la cuenta del usuario autenticado."""
    user_session = _require_user(request)

    if user_session.get("rol") == "admin":
        all_users   = supabase.get_all_users()
        admin_count = sum(1 for u in all_users if u.get("rol") == "admin")
        if admin_count <= 1:
            raise HTTPException(
                status_code=400,
                detail="No puedes eliminar la última cuenta de administrador"
            )

    ok = supabase.delete_user(user_session["id"])
    if not ok:
        raise HTTPException(status_code=500, detail="Error al eliminar cuenta")

    request.session.clear()
    print(f"✅ Cuenta eliminada: {user_session['email']}")
    return {"message": "Cuenta eliminada exitosamente"}


# ── ADMIN ─────────────────────────────────────────────────────────────────────

@router.get("/users")
async def list_users(skip: int = 0, limit: int = 100, request: Request = None):
    user_session = _require_user(request)
    if user_session.get("rol") != "admin":
        raise HTTPException(status_code=403, detail="No tiene permisos de administrador")
    return supabase.get_all_users(skip, limit)