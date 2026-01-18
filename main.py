# main.py - Aplicación Principal Optimizada para Vercel

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from sqlalchemy import text
from pathlib import Path
from typing import Optional
from sqlalchemy.orm import Session
import secrets
import os

from db import get_db
from auth import get_current_user_session, get_current_user_hybrid

# Importar routers
from routers import auth_router, productos_router, carrusel_router

app = FastAPI(
    title="Aurum Joyería",
    description="Sistema de joyería con catálogo y carrito de compras",
    version="2.0.0"
)

# ========================================
# CONFIGURACIÓN DE ENTORNO
# ========================================
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
IS_PRODUCTION = ENVIRONMENT == "production" or os.getenv("VERCEL") is not None

print(f"🌐 Entorno: {ENVIRONMENT}")
print(f"🔧 Es producción: {IS_PRODUCTION}")

# 🔥 SECRET_KEY desde variable de entorno (CRÍTICO para producción)
SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY:
    if IS_PRODUCTION:
        raise ValueError("SECRET_KEY must be set in production environment")
    SECRET_KEY = secrets.token_hex(32)
    print("⚠️ Using auto-generated SECRET_KEY (development only)")
else:
    print("✅ SECRET_KEY cargada desde variables de entorno")

# ========================================
# MIDDLEWARE DE CORS (CRÍTICO PARA VERCEL)
# ========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# ========================================
# MIDDLEWARE DE SESIONES
# ========================================
app.add_middleware(
    SessionMiddleware, 
    secret_key=SECRET_KEY,
    max_age=3600 * 24 * 7,
    same_site="none" if IS_PRODUCTION else "lax",
    https_only=IS_PRODUCTION,
    session_cookie="joyeria_session"
)

# ========================================
# CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS Y TEMPLATES
# ========================================
BASE_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"

# Configurar templates
if TEMPLATES_DIR.exists():
    templates = Jinja2Templates(directory=str(TEMPLATES_DIR))
    print(f"✅ Templates cargados desde: {TEMPLATES_DIR}")
else:
    print(f"⚠️ Directorio de templates no encontrado: {TEMPLATES_DIR}")
    templates = Jinja2Templates(directory="templates")

# 🔥 CRÍTICO: En Vercel, NO montar StaticFiles (Vercel los sirve directamente)
if not IS_PRODUCTION:
    if STATIC_DIR.exists():
        try:
            app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
            print(f"✅ Archivos estáticos montados desde: {STATIC_DIR}")
        except Exception as e:
            print(f"⚠️ Error montando archivos estáticos: {e}")
else:
    print("ℹ️ Producción (Vercel): archivos estáticos servidos directamente por Vercel")

# ========================================
# HELPER FUNCTIONS PARA TEMPLATES
# ========================================

def static_url(path: str) -> str:
    """Genera URL estática compatible con Vercel y desarrollo local"""
    return f"/static/{path}"

def custom_url_for(name: str, **path_params):
    """Custom url_for que funciona en Vercel"""
    if name == "static":
        path = path_params.get('path', '')
        return f"/static/{path}"
    else:
        route_map = {
            'index': '/',
            'login': '/login',
            'register': '/register',
            'perfil': '/perfil',
            'carrito': '/carrito',
            'anillos': '/anillos',
            'pulseras': '/pulseras',
            'cadenas': '/cadenas',
            'aretes': '/aretes',
            'tobilleras': '/tobilleras',
            'more_products': '/otros',
            'admin': '/admin',
        }
        return route_map.get(name, '/')

templates.env.globals['static_url'] = static_url
templates.env.globals['url_for'] = custom_url_for

# ========================================
# 🔥 INCLUIR ROUTERS API (CORREGIDO)
# ========================================
# Los routers YA tienen prefix="/auth", "/productos", "/carrusel"
# Así que los incluimos con prefix="/api" para que queden como /api/auth, /api/productos, etc.
app.include_router(auth_router, prefix="/api", tags=["Autenticación"])
app.include_router(productos_router, prefix="/api", tags=["Productos"])
app.include_router(carrusel_router, prefix="/api", tags=["Carrusel"])

# ========================================
# HELPER FUNCTIONS
# ========================================

def safe_get_user(request: Request, db: Session) -> Optional[dict]:
    """Obtiene usuario de forma segura sin lanzar excepciones"""
    try:
        return get_current_user_hybrid(request, db)
    except Exception as e:
        print(f"⚠️ Error obteniendo usuario: {e}")
        return None

# ========================================
# RUTAS PRINCIPALES (PÁGINAS HTML)
# ========================================

@app.get("/", response_class=HTMLResponse, name="index")
async def index(request: Request):
    """Página de inicio"""
    user = safe_get_user(request, next(get_db()))
    return templates.TemplateResponse("index.html", {"request": request, "user": user})

# ========================================
# RUTAS DE AUTENTICACIÓN
# ========================================

@app.get("/login", response_class=HTMLResponse, name="login")
async def login_page(request: Request):
    """Página de login"""
    request.session.clear()
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/register", response_class=HTMLResponse, name="register")
async def register_page(request: Request):
    """Página de registro"""
    user = get_current_user_session(request)
    if user:
        return RedirectResponse(url="/", status_code=303)
    return templates.TemplateResponse("crearcuenta.html", {"request": request})

@app.get("/logout", name="logout")
async def logout(request: Request):
    """Cerrar sesión"""
    request.session.clear()
    return RedirectResponse(url="/", status_code=303)

# ========================================
# RUTAS DE USUARIO
# ========================================

@app.get("/perfil", response_class=HTMLResponse, name="perfil")
async def perfil(request: Request):
    """Página de perfil de usuario"""
    user = get_current_user_session(request)
    if not user:
        return RedirectResponse(url="/login", status_code=303)
    return templates.TemplateResponse("perfil.html", {"request": request, "user": user})

@app.get("/carrito", response_class=HTMLResponse, name="carrito")
async def carrito(request: Request):
    """Página del carrito de compras"""
    user = safe_get_user(request, next(get_db()))
    return templates.TemplateResponse("carrito.html", {"request": request, "user": user})

# ========================================
# RUTAS DE CATEGORÍAS
# ========================================

@app.get("/anillos", response_class=HTMLResponse, name="anillos")
async def anillos(request: Request):
    user = safe_get_user(request, next(get_db()))
    return templates.TemplateResponse(
        "base_categoria.html", 
        {"request": request, "user": user, "categoria": "anillos", "categoria_nombre": "Anillos"}
    )

@app.get("/pulseras", response_class=HTMLResponse, name="pulseras")
async def pulseras(request: Request):
    user = safe_get_user(request, next(get_db()))
    return templates.TemplateResponse(
        "base_categoria.html", 
        {"request": request, "user": user, "categoria": "pulseras", "categoria_nombre": "Pulseras"}
    )

@app.get("/cadenas", response_class=HTMLResponse, name="cadenas")
async def cadenas(request: Request):
    user = safe_get_user(request, next(get_db()))
    return templates.TemplateResponse(
        "base_categoria.html", 
        {"request": request, "user": user, "categoria": "cadenas", "categoria_nombre": "Cadenas"}
    )

@app.get("/aretes", response_class=HTMLResponse, name="aretes")
async def aretes(request: Request):
    user = safe_get_user(request, next(get_db()))
    return templates.TemplateResponse(
        "base_categoria.html", 
        {"request": request, "user": user, "categoria": "aretes", "categoria_nombre": "Aretes"}
    )

@app.get("/tobilleras", response_class=HTMLResponse, name="tobilleras")
async def tobilleras(request: Request):
    user = safe_get_user(request, next(get_db()))
    return templates.TemplateResponse(
        "base_categoria.html", 
        {"request": request, "user": user, "categoria": "tobilleras", "categoria_nombre": "Tobilleras"}
    )

@app.get("/otros", response_class=HTMLResponse, name="more_products")
async def more_products(request: Request):
    user = safe_get_user(request, next(get_db()))
    return templates.TemplateResponse(
        "base_categoria.html", 
        {"request": request, "user": user, "categoria": "otros", "categoria_nombre": "Más Productos"}
    )

# ========================================
# RUTAS DE PRODUCTO
# ========================================

@app.get("/producto/{producto_id}", response_class=HTMLResponse, name="producto_detalle")
async def producto_detalle(request: Request, producto_id: str):
    user = safe_get_user(request, next(get_db()))
    return templates.TemplateResponse(
        "producto.html", 
        {"request": request, "user": user, "producto_id": producto_id}
    )

# ========================================
# RUTAS DE ADMINISTRACIÓN
# ========================================

@app.get("/admin", response_class=HTMLResponse, name="admin")
async def admin(request: Request):
    """Panel de administración (solo admin)"""
    user = get_current_user_session(request)
    
    if not user:
        return RedirectResponse(url="/login", status_code=303)
    
    if user.get("rol") != "admin":
        return RedirectResponse(url="/", status_code=303)
    
    return templates.TemplateResponse("panel.html", {"request": request, "user": user})

# ========================================
# RUTAS DE UTILIDAD Y DEBUG
# ========================================

@app.get("/health")
async def health_check():
    """Health check para monitoreo"""
    return {
        "status": "healthy",
        "environment": ENVIRONMENT,
        "version": "2.0.0",
        "is_production": IS_PRODUCTION
    }

@app.get("/api/health/db")
async def health_check_db():
    """🔥 Verificar conexión a base de datos"""
    try:
        db = next(get_db())
        result = db.execute(text("SELECT 1"))
        db.close()
        return {
            "status": "ok",
            "database": "connected",
            "message": "Conexión a base de datos exitosa"
        }
    except Exception as e:
        print(f"❌ Error en health check DB: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "error",
                "database": "disconnected",
                "error": str(e)
            }
        )

@app.get("/api/test")
async def api_test():
    """🔥 TEST: Verificar que la API responde correctamente"""
    return JSONResponse({
        "status": "ok",
        "message": "API funcionando correctamente",
        "environment": ENVIRONMENT,
        "endpoints": {
            "auth_login": "/api/auth/login",
            "auth_register": "/api/auth/register",
            "productos": "/api/productos",
            "carrusel": "/api/carrusel",
            "health_db": "/api/health/db"
        }
    })

# ========================================
# MANEJO DE ERRORES
# ========================================

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """Manejo de errores 404"""
    # Si es una petición API, devolver JSON
    if request.url.path.startswith("/api/"):
        return JSONResponse(
            status_code=404,
            content={"detail": "Endpoint no encontrado"}
        )
    # Si es una página HTML, redirigir a inicio
    return RedirectResponse(url="/", status_code=303)

@app.exception_handler(500)
async def server_error_handler(request: Request, exc):
    """Manejo de errores 500"""
    print(f"❌ Error 500: {exc}")
    
    # Si es una petición API, devolver JSON
    if request.url.path.startswith("/api/"):
        return JSONResponse(
            status_code=500,
            content={"detail": "Error interno del servidor"}
        )
    # Si es una página HTML, mostrar página de error
    user = None
    try:
        user = safe_get_user(request, next(get_db()))
    except:
        pass
    
    return templates.TemplateResponse(
        "index.html", 
        {"request": request, "user": user}, 
        status_code=500
    )

# ========================================
# EVENTO DE INICIO
# ========================================

@app.on_event("startup")
async def startup_event():
    """Evento que se ejecuta al iniciar la aplicación"""
    print("=" * 60)
    print("🚀 Iniciando Aurum Joyería")
    print(f"   Entorno: {ENVIRONMENT}")
    print(f"   Producción: {IS_PRODUCTION}")
    print(f"   Secret Key: {'✅ Configurada' if SECRET_KEY else '❌ No configurada'}")
    print("=" * 60)
    
    # Test de conexión a DB
    try:
        db = next(get_db())
        db.execute(text("SELECT 1"))
        db.close()
        print("✅ Conexión a base de datos exitosa")
    except Exception as e:
        print(f"❌ Error conectando a base de datos: {e}")

# ========================================
# PUNTO DE ENTRADA
# ========================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )

# Para Vercel
app = app