from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from mangum import Mangum
import os
import traceback

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

# Middleware para capturar errores
@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        print(f"❌ Error no capturado: {str(e)}")
        print(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Error interno del servidor",
                "error": str(e),
                "path": str(request.url.path)
            }
        )

# Importar y registrar routers
try:
    from api.routers import auth_router, productos_router, carrusel_router
    
    app.include_router(auth_router.router, prefix="/api", tags=["Auth"])
    app.include_router(productos_router.router, prefix="/api", tags=["Productos"])
    app.include_router(carrusel_router.router, prefix="/api", tags=["Carrusel"])
    
    print("✅ Routers cargados exitosamente")
except Exception as e:
    print(f"❌ Error al cargar routers: {str(e)}")
    print(traceback.format_exc())

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
    environment = os.getenv("ENVIRONMENT", "production")
    has_db = os.getenv("DATABASE_URL") is not None
    has_supabase = os.getenv("SUPABASE_URL") is not None
    has_jwt_key = os.getenv("JWT_SECRET_KEY") is not None
    
    return {
        "status": "healthy",
        "environment": environment,
        "config": {
            "database_configured": has_db,
            "supabase_configured": has_supabase,
            "jwt_configured": has_jwt_key
        }
    }

# Handler para Vercel
handler = Mangum(app)