from typing import Annotated
from fastapi import Depends
from sqlalchemy import create_engine, text, event
from sqlalchemy.orm import sessionmaker, Session
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL no está configurada")

print(f"🔗 Conectando a: {DATABASE_URL[:30]}...")

# Configuración optimizada para Supabase
engine = create_engine(
    DATABASE_URL,
    echo=False,  # Cambiar a True para debug
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

@event.listens_for(engine, "connect")
def receive_connect(dbapi_conn, connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("SET SESSION statement_timeout = '30s'")
    cursor.execute("SET SESSION idle_in_transaction_session_timeout = '60s'")
    cursor.close()

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    future=True,
    expire_on_commit=False
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

SessionDepends = Annotated[Session, Depends(get_db)]

def test_connection():
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