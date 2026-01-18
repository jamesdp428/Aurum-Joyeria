# db.py - Configuración de Base de Datos para Vercel + Supabase (CORREGIDO)

from typing import Annotated
from fastapi import Depends
from sqlalchemy import create_engine, text
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

print(f"🌐 Entorno: {'VERCEL (Production)' if IS_VERCEL else 'Local (Development)'}")
print(f"🔗 Database URL: {DATABASE_URL[:50]}...")

# ========================================
# 🔥 CONFIGURACIÓN PARA VERCEL - CRÍTICO
# ========================================

if IS_VERCEL:
    print("⚡ Usando configuración SERVERLESS")
    
    # 🔥 IMPORTANTE: Asegurar que usa Transaction Pooler (port 6543)
    if ":5432" in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace(":5432", ":6543")
        print("🔄 Cambiado a Transaction Pooling (port 6543)")
    
    # 🔥 CRÍTICO: Agregar parámetros de conexión optimizados para Vercel
    if "?" in DATABASE_URL:
        DATABASE_URL += "&"
    else:
        DATABASE_URL += "?"
    
    DATABASE_URL += "sslmode=require&connect_timeout=10"
    
    # 🔥 CRÍTICO: NullPool + configuración mínima
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        poolclass=NullPool,  # ✅ NO mantener conexiones
        connect_args={
            "connect_timeout": 10,
            "application_name": "aurum_vercel",
            # 🔥 IMPORTANTE: Deshabilitar keepalives en Vercel
            "keepalives": 0,
        },
        execution_options={
            "isolation_level": "AUTOCOMMIT"
        }
    )
    
else:
    # 🏠 CONFIGURACIÓN PARA LOCAL
    print("🏠 Usando configuración LOCAL")
    
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=3600,
        connect_args={
            "connect_timeout": 10,
        }
    )

# ========================================
# SESSION MAKER
# ========================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False
)

# ========================================
# DEPENDENCY PARA FASTAPI
# ========================================

def get_db():
    """
    Dependency para obtener sesión de DB
    ✅ Compatible con Vercel Serverless
    """
    db = SessionLocal()
    try:
        # 🔥 Test rápido de conexión en Vercel
        if IS_VERCEL:
            db.execute(text("SELECT 1"))
        yield db
    except Exception as e:
        print(f"❌ Error en get_db: {e}")
        raise
    finally:
        db.close()

SessionDepends = Annotated[Session, Depends(get_db)]

# ========================================
# TEST DE CONEXIÓN
# ========================================

def test_connection():
    """Test de conexión a la base de datos"""
    try:
        db = SessionLocal()
        result = db.execute(text("SELECT 1"))
        db.close()
        print("✅ Conexión exitosa a la base de datos")
        return True
    except Exception as e:
        print(f"❌ Error al conectar: {e}")
        return False

if __name__ == "__main__":
    test_connection()