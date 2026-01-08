from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
import os

# Importar routers
from api.routers import auth_router, productos_router, carrusel_router

# Crear aplicación
app = FastAPI(
    title="Aurum Joyería API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Incluir routers con prefijo /api
app.include_router(auth_router.router, prefix="/api", tags=["Auth"])
app.include_router(productos_router.router, prefix="/api", tags=["Productos"])
app.include_router(carrusel_router.router, prefix="/api", tags=["Carrusel"])

# Endpoints de salud
@app.get("/")
async def root():
    return {
        "message": "Aurum Joyería API",
        "version": "1.0.0",
        "status": "online"
    }

@app.get("/api")
async def api_root():
    return {
        "message": "Aurum Joyería API",
        "version": "1.0.0",
        "endpoints": {
            "auth": "/api/auth",
            "productos": "/api/productos",
            "carrusel": "/api/carrusel",
            "docs": "/api/docs",
            "health": "/api/health"
        }
    }

@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "environment": os.getenv("ENVIRONMENT", "production")
    }

# Handler para Vercel (CRÍTICO)
handler = Mangum(app)