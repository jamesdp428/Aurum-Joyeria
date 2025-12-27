from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pathlib import Path
import os
import sys

# Añadir el directorio backend al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Importar routers
from routers import auth_router, productos_router, carrusel_router

# ========== CONFIGURACIÓN DE LA APLICACIÓN ==========

app = FastAPI(
    title="Aurum Joyería API",
    description="Backend completo para la joyería con sistema de autenticación y gestión de productos",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ========== CONFIGURACIÓN DE CORS ==========

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# CORS configurado para Vercel
if ENVIRONMENT == "production":
    origins = ["*"]  # Permitir todos los orígenes en producción
else:
    origins = [
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:5500",
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

# ========== ENDPOINTS DE INFORMACIÓN ==========

@app.get("/")
async def root():
    """Endpoint raíz con información de la API"""
    return {
        "message": "Bienvenido a Aurum Joyería API",
        "version": "1.0.0",
        "environment": ENVIRONMENT,
        "docs": "/api/docs",
        "redoc": "/api/redoc"
    }

@app.get("/health")
async def health_check():
    """Health check para monitoreo"""
    return {
        "status": "healthy",
        "environment": ENVIRONMENT,
        "version": "1.0.0"
    }

# Manejador de errores global
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "detail": str(exc),
            "type": type(exc).__name__,
            "environment": ENVIRONMENT
        }
    )

# IMPORTANTE: Exportar app para Vercel
# No usar uvicorn.run() aquí