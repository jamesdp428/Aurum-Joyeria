"""
email_service.py — Servicio de envío de correos con Resend
Actualizado para usar dominio propio y mejorar compatibilidad.
"""

import resend
import os
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")

# ── Configuración ──────────────────────────────────────────────────────────────
# FROM_EMAIL debe ser una dirección verificada de tu dominio, p.ej.:
#   no-reply@tudominio.com   o   hola@tudominio.com
FROM_EMAIL   = os.getenv("FROM_EMAIL",   "no-reply@aurumjoyeria.com")
FROM_NAME    = os.getenv("FROM_NAME",    "Aurum Joyería")
BASE_URL     = os.getenv("BASE_URL",     "https://aurumjoyeria.com")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://aurumjoyeria.com")


# ── Helpers ────────────────────────────────────────────────────────────────────

def _from_header() -> str:
    """Devuelve el header From con nombre, p.ej. 'Aurum Joyería <no-reply@…>'"""
    return f"{FROM_NAME} <{FROM_EMAIL}>"


def _base_html(body_content: str) -> str:
    """Envuelve el contenido en el layout base del correo."""
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Aurum Joyería</title>
  <style>
    body {{
      margin: 0; padding: 0;
      background: #0a0a0a;
      font-family: Arial, Helvetica, sans-serif;
      color: #ffffff;
    }}
    .wrapper {{
      max-width: 600px;
      margin: 40px auto;
      padding: 0 16px 40px;
    }}
    .logo-bar {{
      text-align: center;
      padding: 32px 0 24px;
    }}
    .logo-bar h1 {{
      color: #f9dc5e;
      font-size: 28px;
      letter-spacing: 3px;
      margin: 0;
      text-transform: uppercase;
    }}
    .card {{
      background: linear-gradient(145deg, #1a1a1a, #252525);
      border: 1px solid #f9dc5e44;
      border-radius: 16px;
      padding: 36px 40px 40px;
    }}
    h2 {{
      color: #f9dc5e;
      font-size: 22px;
      margin: 0 0 14px;
    }}
    p {{
      color: #cccccc;
      font-size: 15px;
      line-height: 1.7;
      margin: 0 0 16px;
    }}
    .code-block {{
      background: #111;
      border: 2px solid #f9dc5e;
      border-radius: 10px;
      padding: 20px 24px;
      margin: 24px 0;
      text-align: center;
    }}
    .code-label {{
      color: #999;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0 0 10px;
    }}
    .code-value {{
      color: #f9dc5e;
      font-size: 17px;
      font-weight: bold;
      word-break: break-all;
      letter-spacing: 1px;
    }}
    .btn {{
      display: inline-block;
      background: linear-gradient(45deg, #f9dc5e, #ffd700);
      color: #000000 !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      padding: 14px 36px;
      border-radius: 10px;
      margin: 8px 0 20px;
    }}
    .info-box {{
      background: rgba(249,220,94,0.08);
      border-left: 4px solid #f9dc5e;
      border-radius: 6px;
      padding: 14px 18px;
      margin: 20px 0;
    }}
    .info-box p {{
      margin: 4px 0;
      font-size: 14px;
    }}
    .warn-box {{
      background: rgba(255,152,0,0.12);
      border-left: 4px solid #ff9800;
      border-radius: 6px;
      padding: 14px 18px;
      margin: 20px 0;
    }}
    .warn-box p {{
      margin: 4px 0;
      font-size: 14px;
      color: #ffcc80;
    }}
    .footer {{
      border-top: 1px solid #333;
      margin-top: 32px;
      padding-top: 20px;
      text-align: center;
    }}
    .footer p {{
      color: #666;
      font-size: 12px;
      margin: 4px 0;
    }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="logo-bar">
      <h1>✦ Aurum Joyería</h1>
    </div>
    <div class="card">
      {body_content}
      <div class="footer">
        <p><strong style="color:#aaa">Aurum Joyería</strong> — Medellín, Colombia</p>
        <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
      </div>
    </div>
  </div>
</body>
</html>"""


def _send(to_email: str, subject: str, html: str) -> bool:
    """Función interna para enviar el correo vía Resend."""
    try:
        resend.Emails.send({
            "from":    _from_header(),
            "to":      [to_email],
            "subject": subject,
            "html":    html,
        })
        print(f"✅ Email enviado → {to_email} | Asunto: {subject}")
        return True
    except Exception as e:
        print(f"❌ Error Resend → {to_email} | {e}")
        return False


# ── Emails públicos ────────────────────────────────────────────────────────────

def send_verification_email(to_email: str, nombre: str, code: str) -> bool:
    """
    Envía el correo de verificación de cuenta.
    El código sirve tanto para el link automático como para pegarlo manualmente.
    """
    verification_link = f"{BASE_URL}/api/auth/verify-email?code={code}"
    profile_url       = f"{FRONTEND_URL}/perfil"

    body = f"""
      <h2>¡Bienvenido, {nombre}! 🎉</h2>
      <p>Gracias por crear tu cuenta en Aurum Joyería. Para activarla, verifica tu correo electrónico usando una de estas opciones:</p>

      <div class="info-box">
        <p><strong>Opción 1 — Botón rápido:</strong></p>
        <p>Haz clic en el botón de abajo y tu cuenta quedará verificada automáticamente.</p>
      </div>

      <div style="text-align:center">
        <a href="{verification_link}" class="btn">Verificar mi cuenta</a>
      </div>

      <div class="info-box">
        <p><strong>Opción 2 — Código manual:</strong></p>
        <p>Copia el código y pégalo en la sección de verificación de tu perfil.</p>
      </div>

      <div class="code-block">
        <p class="code-label">Código de verificación</p>
        <p class="code-value">{code}</p>
      </div>

      <p style="text-align:center">
        <a href="{profile_url}" style="color:#f9dc5e;font-size:14px;">→ Ir a mi perfil para pegar el código</a>
      </p>

      <div class="warn-box">
        <p>⏰ <strong>Este código expira en 24 horas.</strong></p>
        <p>Si no creaste esta cuenta, ignora este mensaje.</p>
      </div>
    """
    return _send(to_email, "Verifica tu cuenta — Aurum Joyería", _base_html(body))


def send_password_reset_email(to_email: str, nombre: str, code: str) -> bool:
    """Envía el correo de recuperación de contraseña."""
    reset_url = f"{FRONTEND_URL}/login?reset=1"   # el modal se abre en /login

    body = f"""
      <h2>🔑 Recuperar contraseña</h2>
      <p>Hola <strong style="color:#f9dc5e">{nombre}</strong>,</p>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Copia el código de abajo y pégalo en el formulario de recuperación.</p>

      <div class="code-block">
        <p class="code-label">Código de recuperación</p>
        <p class="code-value">{code}</p>
      </div>

      <div style="text-align:center">
        <a href="{reset_url}" class="btn">Ir al formulario de recuperación</a>
      </div>

      <div class="warn-box">
        <p>⏰ <strong>Este código expira en 1 hora.</strong></p>
        <p>Si no solicitaste este cambio, ignora este mensaje — tu cuenta permanece segura.</p>
      </div>

      <p style="font-size:12px;color:#666;margin-top:24px;">
        ¿El botón no funciona? Copia y pega este enlace en tu navegador:<br>
        <span style="color:#888;word-break:break-all">{reset_url}</span>
      </p>
    """
    return _send(to_email, "Recupera tu contraseña — Aurum Joyería", _base_html(body))


def send_email_change_verification(to_email: str, nombre: str, code: str) -> bool:
    """Envía el correo para verificar un cambio de dirección de email."""
    body = f"""
      <h2>🔄 Verificar nuevo correo</h2>
      <p>Hola <strong style="color:#f9dc5e">{nombre}</strong>,</p>
      <p>Has solicitado cambiar el correo de tu cuenta en Aurum Joyería. Para confirmar el cambio, copia y pega el siguiente código en tu perfil.</p>

      <div class="code-block">
        <p class="code-label">Código de verificación</p>
        <p class="code-value">{code}</p>
      </div>

      <div class="warn-box">
        <p>⏰ <strong>Este código expira en 1 hora.</strong></p>
        <p>Si no solicitaste este cambio, ignora este mensaje — tu cuenta permanece segura.</p>
      </div>
    """
    return _send(to_email, "Verifica tu nuevo correo — Aurum Joyería", _base_html(body))