from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from api.routers import auth_router, productos_router, carrusel_router

app = FastAPI(
    title="Aurum Joyería API",
    version="1.0.0",
    docs_url="/api/docs"
)

ENVIRONMENT = os.getenv("ENVIRONMENT", "production")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(auth_router.router, prefix="/api", tags=["Auth"])
app.include_router(productos_router.router, prefix="/api", tags=["Productos"])
app.include_router(carrusel_router.router, prefix="/api", tags=["Carrusel"])

@app.get("/")
async def root():
    return {"message": "Aurum Joyería API", "version": "1.0.0"}

@app.get("/api/health")
async def health():
    return {"status": "healthy"}

handler = app
