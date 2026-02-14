from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
import uuid

# ========== SCHEMAS DE AUTENTICACIÓN ==========

class UsuarioCreate(BaseModel):
    email: EmailStr
    nombre: str = Field(..., min_length=2, max_length=255)
    password: str = Field(..., min_length=6)

class UsuarioLogin(BaseModel):
    email: EmailStr
    password: str

class UsuarioResponse(BaseModel):
    id: uuid.UUID
    email: str
    nombre: str
    rol: str
    email_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UsuarioResponse

# ========== SCHEMAS DE PRODUCTOS ==========

class ProductoBase(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=255)
    descripcion: Optional[str] = None
    precio: Optional[float] = Field(None, ge=0)
    categoria: str = Field(..., min_length=2, max_length=100)
    stock: int = Field(default=0, ge=0)
    destacado: bool = False
    activo: bool = True

class ProductoCreate(ProductoBase):
    pass

class ProductoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=2, max_length=255)
    descripcion: Optional[str] = None
    precio: Optional[float] = Field(None, ge=0)
    categoria: Optional[str] = None
    stock: Optional[int] = Field(None, ge=0)
    destacado: Optional[bool] = None
    activo: Optional[bool] = None

class ProductoResponse(ProductoBase):
    id: uuid.UUID
    imagen_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True