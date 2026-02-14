from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import uuid

Base = declarative_base()

class Usuario(Base):
    __tablename__ = "usuarios"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    nombre = Column(String(255), nullable=False)
    password_hash = Column(Text, nullable=False)
    rol = Column(String(20), default="usuario")
    
    # Campos de verificación de email
    email_verified = Column(Boolean, default=False)
    verification_code = Column(String(64), nullable=True)
    verification_expires = Column(DateTime(timezone=True), nullable=True)
    
    # 🔥 NUEVO: Campos para recuperación de contraseña
    password_reset_code = Column(String(64), nullable=True)
    password_reset_expires = Column(DateTime(timezone=True), nullable=True)
    
    # Campos para cambio de email
    pending_email = Column(String(255), nullable=True)
    pending_email_code = Column(String(64), nullable=True)
    pending_email_expires = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Producto(Base):
    __tablename__ = "productos"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(255), nullable=False)
    descripcion = Column(Text)
    precio = Column(Float, nullable=True)  # Puede ser NULL
    categoria = Column(String(100), nullable=False, index=True)
    stock = Column(Integer, default=0)
    imagen_url = Column(Text)
    imagenes_urls = Column(Text, nullable=True)  # JSON array de URLs
    destacado = Column(Boolean, default=False, index=True)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())