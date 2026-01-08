from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv
import os
import sys

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ ERROR: DATABASE_URL no está configurada en las variables de entorno")
    print("Por favor configura DATABASE_URL en Vercel Dashboard")
    # En producción, no detenemos la app pero loggeamos el error
    if os.getenv("ENVIRONMENT") == "production":
        DATABASE_URL = "postgresql://dummy:dummy@localhost/dummy"  # URL dummy para que no crashee
    else:
        raise ValueError("DATABASE_URL no está configurada en .env")

# Configurar engine con pool de conexiones optimizado para serverless
try:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        pool_recycle=3600,
        echo=False
    )
    print("✅ Database engine creado exitosamente")
except Exception as e:
    print(f"❌ Error al crear database engine: {str(e)}")
    # Crear un engine dummy para que no crashee en import
    engine = None

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) if engine else None

def get_db():
    """Dependency para obtener sesión de base de datos"""
    if not SessionLocal:
        raise Exception("Database no configurada correctamente. Verifica DATABASE_URL.")
    
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()