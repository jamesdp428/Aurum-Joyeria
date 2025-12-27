from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import os

# Importar routers
from routers import auth_router, productos_router, carrusel_router

# ========== CONFIGURACIÓN DE LA APLICACIÓN ==========

app = FastAPI(
    title="Aurum Joyería API",
    description="Backend completo para la joyería con sistema de autenticación y gestión de productos",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# ========== CONFIGURACIÓN DE CORS ==========

# En desarrollo permite todos los orígenes
# En producción, especifica tu dominio
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

if ENVIRONMENT == "production":
    origins = [
        "https://tu-dominio.com",  # Cambiar por tu dominio real
        "https://www.tu-dominio.com"
    ]
else:
    origins = [
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:5500",  # Live Server
        "http://127.0.0.1:5500"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== INCLUIR ROUTERS ==========

app.include_router(auth_router.router, tags=["Autenticación"])
app.include_router(productos_router.router, tags=["Productos"])
app.include_router(carrusel_router.router, tags=["Carrusel"])

# ========== MONTAR ARCHIVOS ESTÁTICOS ==========

# Obtener ruta base del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent

# Montar carpetas estáticas (HTML, CSS, JS, imágenes)
try:
    app.mount("/static", StaticFiles(directory=str(BASE_DIR)), name="static")
    print(f"✅ Archivos estáticos montados desde: {BASE_DIR}")
except Exception as e:
    print(f"⚠️ Error montando archivos estáticos: {e}")

# ========== ENDPOINTS DE INFORMACIÓN ==========

@app.get("/")
async def root():
    """Endpoint raíz con información de la API"""
    return {
        "message": "Bienvenido a Aurum Joyería API",
        "version": "1.0.0",
        "docs": "/api/docs",
        "redoc": "/api/redoc",
        "endpoints": {
            "auth": "/api/auth",
            "productos": "/api/productos",
            "carrusel": "/api/carrusel"
        }
    }

@app.get("/health")
async def health_check():
    """Health check para monitoreo"""
    return {
        "status": "healthy",
        "environment": ENVIRONMENT,
        "version": "1.0.0"
    }

# ========== PUNTO DE ENTRADA ==========

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Solo en desarrollo
        log_level="info"
    )