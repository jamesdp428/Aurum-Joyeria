import resend
import os
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")
FROM_EMAIL = os.getenv("FROM_EMAIL", "onboarding@resend.dev")

# Obtener URLs base del entorno
BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:8000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://127.0.0.1:8000")

def send_verification_email(to_email: str, nombre: str, code: str):
    """Envía email de verificación de cuenta"""
    
    # URL para verificación automática con el link
    verification_link = f"{BASE_URL}/api/auth/verify-email?code={code}"
    
    # URL del perfil donde pueden pegar el código manualmente
    profile_url = f"{FRONTEND_URL}/perfil"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: 'Arial', sans-serif;
                background-color: #000;
                color: #fff;
                margin: 0;
                padding: 40px;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background: linear-gradient(145deg, #1e1e1e, #2a2a2a);
                border-radius: 20px;
                padding: 40px;
                border: 1px solid #f9dc5e;
            }}
            h1 {{
                color: #f9dc5e;
                margin-bottom: 20px;
                font-size: 28px;
            }}
            .code-section {{
                background: #2a2a2a;
                border: 2px solid #f9dc5e;
                border-radius: 10px;
                padding: 20px;
                margin: 30px 0;
                text-align: center;
            }}
            .code {{
                font-size: 18px;
                font-weight: bold;
                color: #f9dc5e;
                letter-spacing: 2px;
                word-break: break-all;
                display: block;
                margin: 10px 0;
                padding: 10px;
                background: #1a1a1a;
                border-radius: 8px;
            }}
            .button {{
                display: inline-block;
                background: linear-gradient(45deg, #f9dc5e, #ffd700);
                color: #000;
                padding: 15px 40px;
                border-radius: 10px;
                text-decoration: none;
                font-weight: bold;
                margin: 20px 0;
            }}
            .button:hover {{
                transform: scale(1.05);
            }}
            p {{
                color: #ccc;
                line-height: 1.6;
                font-size: 16px;
            }}
            .instructions {{
                background: rgba(249, 220, 94, 0.1);
                border-left: 4px solid #f9dc5e;
                padding: 15px;
                margin: 20px 0;
                border-radius: 5px;
            }}
            .footer {{
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #444;
                color: #888;
                font-size: 12px;
            }}
            .option-divider {{
                text-align: center;
                margin: 30px 0;
                color: #888;
                position: relative;
            }}
            .option-divider:before,
            .option-divider:after {{
                content: "";
                position: absolute;
                top: 50%;
                width: 45%;
                height: 1px;
                background: #444;
            }}
            .option-divider:before {{
                left: 0;
            }}
            .option-divider:after {{
                right: 0;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>¡Bienvenido a Aurum Joyería, {nombre}!</h1>
            
            <p>Gracias por registrarte. Para completar tu registro y acceder a todas las funciones de tu cuenta, necesitas verificar tu correo electrónico.</p>
            
            <div class="instructions">
                <strong>📧 Tienes 2 opciones para verificar:</strong>
            </div>
            
            <h3 style="color: #f9dc5e;">Opción 1: Código manual</h3>
            <p>Copia este código y pégalo en tu perfil:</p>
            
            <div class="code-section">
                <p style="margin: 0; color: #aaa; font-size: 14px;">Tu código de verificación:</p>
                <span class="code">{code}</span>
                <p style="margin: 10px 0 0 0; color: #aaa; font-size: 14px;">
                    <a href="{profile_url}" style="color: #f9dc5e; text-decoration: none;">
                        → Ir a mi perfil para ingresar el código
                    </a>
                </p>
            </div>
            
            <div class="instructions">
                <p style="margin: 5px 0;"><strong>⏰ Este código expira en 24 horas.</strong></p>
                <p style="margin: 5px 0;">Si no creaste esta cuenta, puedes ignorar este email.</p>
            </div>
            
            <div class="footer">
                <p><strong>Aurum Joyería</strong> - Medellín, Colombia</p>
                <p>Este es un email automático, por favor no respondas.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        params = {
            "from": FROM_EMAIL,
            "to": [to_email],
            "subject": "Verifica tu email - Aurum Joyería",
            "html": html_content
        }
        
        email = resend.Emails.send(params)
        print(f"✅ Email de verificación enviado a {to_email}")
        return True
        
    except Exception as e:
        print(f"❌ Error enviando email: {str(e)}")
        return False

def send_password_reset_email(to_email: str, nombre: str, code: str):
    """Envía email de recuperación de contraseña"""
    
    # URL del formulario de recuperación
    reset_url = f"{FRONTEND_URL}/reset-password?code={code}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: 'Arial', sans-serif;
                background-color: #000;
                color: #fff;
                margin: 0;
                padding: 40px;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background: linear-gradient(145deg, #1e1e1e, #2a2a2a);
                border-radius: 20px;
                padding: 40px;
                border: 1px solid #f9dc5e;
            }}
            h1 {{
                color: #f9dc5e;
                margin-bottom: 20px;
                font-size: 28px;
            }}
            .code-section {{
                background: #2a2a2a;
                border: 2px solid #f9dc5e;
                border-radius: 10px;
                padding: 20px;
                margin: 30px 0;
                text-align: center;
            }}
            .code {{
                font-size: 18px;
                font-weight: bold;
                color: #f9dc5e;
                letter-spacing: 2px;
                word-break: break-all;
                display: block;
                margin: 10px 0;
                padding: 10px;
                background: #1a1a1a;
                border-radius: 8px;
            }}
            .button {{
                display: inline-block;
                background: linear-gradient(45deg, #f9dc5e, #ffd700);
                color: #000;
                padding: 15px 40px;
                border-radius: 10px;
                text-decoration: none;
                font-weight: bold;
                margin: 20px 0;
            }}
            p {{
                color: #ccc;
                line-height: 1.6;
                font-size: 16px;
            }}
            .warning {{
                background: rgba(255, 152, 0, 0.2);
                border-left: 4px solid #ff9800;
                padding: 15px;
                margin: 20px 0;
                border-radius: 5px;
            }}
            .footer {{
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #444;
                color: #888;
                font-size: 12px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔑 Recuperar contraseña</h1>
            
            <p>Hola {nombre},</p>
            
            <p>Recibimos una solicitud para restablecer tu contraseña en Aurum Joyería.</p>
            
            <p>Copia este código y pégalo en el formulario de recuperación:</p>
            
            <div class="code-section">
                <p style="margin: 0; color: #aaa; font-size: 14px;">Tu código de recuperación:</p>
                <span class="code">{code}</span>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
                <a href="{reset_url}" class="button">Restablecer mi contraseña</a>
            </div>
            
            <div class="warning">
                <p style="margin: 5px 0;"><strong>⏰ Este código expira en 1 hora.</strong></p>
                <p style="margin: 5px 0;">Si no solicitaste este cambio, ignora este email y tu cuenta permanecerá segura.</p>
            </div>
            
            <div class="footer">
                <p><strong>Aurum Joyería</strong> - Medellín, Colombia</p>
                <p>Este es un email automático, por favor no respondas.</p>
                <p style="margin-top: 15px; color: #666;">
                    ¿No funciona el botón? Copia y pega este enlace en tu navegador:<br>
                    <span style="color: #888; font-size: 11px; word-break: break-all;">{reset_url}</span>
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        params = {
            "from": FROM_EMAIL,
            "to": [to_email],
            "subject": "Recupera tu contraseña - Aurum Joyería",
            "html": html_content
        }
        
        resend.Emails.send(params)
        print(f"✅ Email de recuperación enviado a {to_email}")
        return True
        
    except Exception as e:
        print(f"❌ Error enviando email: {str(e)}")
        return False

def send_email_change_verification(to_email: str, nombre: str, code: str):
    """Envía email para verificar cambio de correo"""
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: 'Arial', sans-serif;
                background-color: #000;
                color: #fff;
                margin: 0;
                padding: 40px;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background: linear-gradient(145deg, #1e1e1e, #2a2a2a);
                border-radius: 20px;
                padding: 40px;
                border: 1px solid #f9dc5e;
            }}
            h1 {{
                color: #f9dc5e;
                margin-bottom: 20px;
            }}
            .code {{
                background: #2a2a2a;
                border: 2px solid #f9dc5e;
                border-radius: 10px;
                padding: 20px;
                font-size: 24px;
                font-weight: bold;
                text-align: center;
                color: #f9dc5e;
                letter-spacing: 5px;
                margin: 30px 0;
                word-break: break-all;
            }}
            p {{
                color: #ccc;
                line-height: 1.6;
            }}
            .warning {{
                background: rgba(255, 152, 0, 0.2);
                border-left: 4px solid #ff9800;
                padding: 15px;
                margin: 20px 0;
                border-radius: 5px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔄 Verificar cambio de email</h1>
            
            <p>Hola {nombre},</p>
            
            <p>Has solicitado cambiar tu email en Aurum Joyería. Para confirmar este cambio, copia y pega el siguiente código en tu perfil:</p>
            
            <div class="code">{code}</div>
            
            <div class="warning">
                <p style="margin: 5px 0;"><strong>⏰ Este código expira en 1 hora.</strong></p>
                <p style="margin: 5px 0;">Si no solicitaste este cambio, ignora este email y tu cuenta permanecerá segura.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        params = {
            "from": FROM_EMAIL,
            "to": [to_email],
            "subject": "Verifica tu nuevo email - Aurum Joyería",
            "html": html_content
        }
        
        resend.Emails.send(params)
        print(f"✅ Email de cambio enviado a {to_email}")
        return True
        
    except Exception as e:
        print(f"❌ Error enviando email: {str(e)}")
        return False