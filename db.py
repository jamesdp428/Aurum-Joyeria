# db.py - Configuración de Base de Datos para Vercel + Supabase

from typing import Annotated
from fastapi import Depends
from sqlalchemy import create_engine, text, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
import os
from dotenv import load_dotenv

load_dotenv()

# ========================================
# CONFIGURACIÓN CRÍTICA PARA VERCEL
# ========================================

DATABASE_URL = os.getenv("URL_DATABASE")

if not DATABASE_URL:
    raise ValueError("❌ URL_DATABASE no está configurada en .env")

# Detectar entorno
IS_VERCEL = os.getenv("VERCEL") is not None or os.getenv("ENVIRONMENT") == "production"

print(f"🌍 Entorno: {'VERCEL (Production)' if IS_VERCEL else 'Local (Development)'}")

# ========================================
# CONFIGURACIÓN DIFERENCIADA POR ENTORNO
# ========================================

if IS_VERCEL:
    # 🔥 CONFIGURACIÓN PARA VERCEL (Serverless)
    # Usar NullPool - NO mantener conexiones abiertas
    
    print("⚡ Usando configuración SERVERLESS (NullPool)")
    
    # IMPORTANTE: Cambiar a connection pooling de Supabase
    # Si tu URL tiene :5432, cámbiala a :6543
    if ":5432" in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace(":5432", ":6543")
        DATABASE_URL += "?pgbouncer=true"
        print("🔄 Cambiado a Connection Pooling (port 6543)")
    
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        future=True,
        poolclass=NullPool,  # ✅ CRÍTICO: No pool para serverless
        connect_args={
            "connect_timeout": 10,
            "keepalives": 1,
            "keepalives_idle": 30,
            "keepalives_interval": 10,
            "keepalives_count": 5,
        }
    )
    
else:
    # 🏠 CONFIGURACIÓN PARA LOCAL (Development)
    
    print("🏠 Usando configuración LOCAL (QueuePool)")
    
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        future=True,
        pool_size=3,
        max_overflow=2,
        pool_pre_ping=True,
        pool_recycle=300,
        connect_args={
            "connect_timeout": 10,
            "options": "-c statement_timeout=30000"
        },
        pool_timeout=20,
        pool_use_lifo=True
    )
    
    # Event listeners solo para desarrollo
    @event.listens_for(engine, "connect")
    def receive_connect(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("SET SESSION statement_timeout = '30s'")
        cursor.execute("SET SESSION idle_in_transaction_session_timeout = '60s'")
        cursor.close()

# ========================================
# SESSION MAKER
# ========================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    future=True,
    expire_on_commit=False
)

# ========================================
# DEPENDENCY PARA FASTAPI
# ========================================

def get_db():
    """
    Dependency para obtener sesión de DB
    En Vercel, cada request crea una nueva conexión
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

SessionDepends = Annotated[Session, Depends(get_db)]

# ========================================
# TEST DE CONEXIÓN
# ========================================

def test_connection():
    """Test de conexión a la base de datos"""
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("✅ Conexión exitosa a la base de datos")
            return True
    except Exception as e:
        print(f"❌ Error al conectar: {e}")
        return False

if __name__ == "__main__":
    test_connection()