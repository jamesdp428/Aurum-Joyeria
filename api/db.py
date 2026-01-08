from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL no está configurada en .env")

# Configurar engine con pool de conexiones optimizado para serverless
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,  # Reducido para serverless
    max_overflow=10,  # Reducido para serverless
    pool_recycle=3600,  # Reciclar conexiones cada hora
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Dependency para obtener sesión de base de datos"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()