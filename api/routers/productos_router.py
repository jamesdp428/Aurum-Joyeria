from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from supabase import create_client, Client
import os
from dotenv import load_dotenv
import uuid
from PIL import Image
import io

from api.db import get_db
from api.models import Producto, Usuario
from api.schemas import ProductoCreate, ProductoUpdate, ProductoResponse
from api.auth import get_current_admin

load_dotenv()

# ✅ CORRECCIÓN: Eliminar el prefijo "/api" duplicado
router = APIRouter(prefix="/productos")  # ← CAMBIO AQUÍ

# Configurar Supabase Client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ========== FUNCIONES AUXILIARES ==========

def optimize_image(file_content: bytes, max_size: tuple = (1200, 1200)) -> bytes:
    """Optimiza una imagen redimensionándola y comprimiéndola"""
    image = Image.open(io.BytesIO(file_content))
    
    # Convertir a RGB si es necesario
    if image.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', image.size, (255, 255, 255))
        if image.mode == 'P':
            image = image.convert('RGBA')
        background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
        image = background
    
    # Redimensionar manteniendo aspect ratio
    image.thumbnail(max_size, Image.Resampling.LANCZOS)
    
    # Guardar optimizada
    output = io.BytesIO()
    image.save(output, format='JPEG', quality=85, optimize=True)
    return output.getvalue()

async def upload_image_to_supabase(file: UploadFile, bucket: str = "productos-images") -> str:
    """Sube una imagen a Supabase Storage y retorna la URL pública"""
    
    # Leer contenido del archivo
    file_content = await file.read()
    
    # VALIDACIÓN: Verificar que hay contenido
    if not file_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo de imagen está vacío"
        )
    
    # Optimizar imagen
    try:
        optimized_content = optimize_image(file_content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al procesar la imagen: {str(e)}"
        )
    
    # Generar nombre único
    file_extension = file.filename.split('.')[-1].lower()
    if file_extension not in ['jpg', 'jpeg', 'png', 'webp']:
        file_extension = 'jpg'
    
    unique_filename = f"producto_{uuid.uuid4()}.{file_extension}"
    
    # Subir a Supabase Storage
    try:
        print(f"📤 Subiendo imagen: {unique_filename} ({len(optimized_content)} bytes)")
        
        response = supabase.storage.from_(bucket).upload(
            path=unique_filename,
            file=optimized_content,
            file_options={"content-type": "image/jpeg", "upsert": "false"}
        )
        
        # Obtener URL pública
        public_url = supabase.storage.from_(bucket).get_public_url(unique_filename)
        
        print(f"✅ Imagen subida exitosamente: {public_url}")
        return public_url
        
    except Exception as e:
        print(f"❌ Error detallado al subir imagen: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al subir imagen a Supabase: {str(e)}"
        )

async def delete_image_from_supabase(image_url: str, bucket: str = "productos-images"):
    """Elimina una imagen de Supabase Storage"""
    try:
        # Extraer filename de la URL
        filename = image_url.split('/')[-1]
        supabase.storage.from_(bucket).remove([filename])
        print(f"🗑️ Imagen eliminada: {filename}")
    except Exception as e:
        print(f"⚠️ Error al eliminar imagen: {str(e)}")

# ========== ENDPOINTS PÚBLICOS ==========

@router.get("", response_model=List[ProductoResponse])
async def get_productos(
    categoria: Optional[str] = None,
    destacado: Optional[bool] = None,
    activo: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Obtiene lista de productos con filtros opcionales"""
    
    query = db.query(Producto)
    
    # Solo filtrar por activo si se especifica explícitamente
    if activo is not None:
        query = query.filter(Producto.activo == activo)
    
    if categoria:
        query = query.filter(Producto.categoria == categoria)
    
    if destacado is not None:
        query = query.filter(Producto.destacado == destacado)
    
    productos = query.order_by(Producto.created_at.desc()).offset(skip).limit(limit).all()
    return productos

@router.get("/{producto_id}", response_model=ProductoResponse)
async def get_producto(producto_id: str, db: Session = Depends(get_db)):
    """Obtiene un producto por ID"""
    
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    
    return producto

@router.get("/categoria/{categoria}", response_model=List[ProductoResponse])
async def get_productos_by_categoria(
    categoria: str,
    activo: bool = True,
    db: Session = Depends(get_db)
):
    """Obtiene productos por categoría"""
    
    productos = db.query(Producto).filter(
        Producto.categoria == categoria,
        Producto.activo == activo
    ).all()
    
    return productos

# ========== ENDPOINTS ADMIN ==========

@router.post("", response_model=ProductoResponse, status_code=status.HTTP_201_CREATED)
async def create_producto(
    nombre: str = Form(...),
    descripcion: Optional[str] = Form(None),
    precio: Optional[float] = Form(None),
    categoria: str = Form(...),
    stock: int = Form(0),
    destacado: bool = Form(False),
    activo: bool = Form(True),
    imagen: Optional[UploadFile] = File(None),
    current_admin: Usuario = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Crea un nuevo producto (solo admin)"""
    
    print(f"🔨 Creando producto: {nombre}")
    print(f"   Categoría: {categoria}")
    print(f"   Imagen recibida: {imagen.filename if imagen else 'Sin imagen'}")
    
    # Subir imagen si existe
    imagen_url = None
    if imagen and imagen.filename:
        try:
            imagen_url = await upload_image_to_supabase(imagen)
            print(f"✅ URL de imagen generada: {imagen_url}")
        except Exception as e:
            print(f"❌ Error al subir imagen: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al subir la imagen: {str(e)}"
            )
    
    # Crear producto
    nuevo_producto = Producto(
        nombre=nombre,
        descripcion=descripcion,
        precio=precio,
        categoria=categoria,
        stock=stock,
        destacado=destacado,
        activo=activo,
        imagen_url=imagen_url
    )
    
    try:
        db.add(nuevo_producto)
        db.commit()
        db.refresh(nuevo_producto)
        print(f"✅ Producto creado con ID: {nuevo_producto.id}")
        return nuevo_producto
    except Exception as e:
        db.rollback()
        print(f"❌ Error al guardar producto en DB: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al guardar el producto: {str(e)}"
        )

@router.put("/{producto_id}", response_model=ProductoResponse)
async def update_producto(
    producto_id: str,
    nombre: Optional[str] = Form(None),
    descripcion: Optional[str] = Form(None),
    precio: Optional[float] = Form(None),
    categoria: Optional[str] = Form(None),
    stock: Optional[int] = Form(None),
    destacado: Optional[bool] = Form(None),
    activo: Optional[bool] = Form(None),
    imagen: Optional[UploadFile] = File(None),
    current_admin: Usuario = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Actualiza un producto existente (solo admin)"""
    
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    
    print(f"🔨 Actualizando producto: {producto.nombre}")
    
    # Actualizar campos si se proporcionan
    if nombre is not None:
        producto.nombre = nombre
    if descripcion is not None:
        producto.descripcion = descripcion
    if precio is not None:
        producto.precio = precio
    if categoria is not None:
        producto.categoria = categoria
    if stock is not None:
        producto.stock = stock
    if destacado is not None:
        producto.destacado = destacado
    if activo is not None:
        producto.activo = activo
    
    # Actualizar imagen si se proporciona
    if imagen and imagen.filename:
        print(f"🖼️ Actualizando imagen...")
        try:
            # Eliminar imagen anterior si existe
            if producto.imagen_url:
                await delete_image_from_supabase(producto.imagen_url)
            
            # Subir nueva imagen
            producto.imagen_url = await upload_image_to_supabase(imagen)
            print(f"✅ Nueva imagen: {producto.imagen_url}")
        except Exception as e:
            print(f"❌ Error al actualizar imagen: {str(e)}")
            # No lanzar error, continuar con la actualización
    
    try:
        db.commit()
        db.refresh(producto)
        print(f"✅ Producto actualizado")
        return producto
    except Exception as e:
        db.rollback()
        print(f"❌ Error al actualizar en DB: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar el producto: {str(e)}"
        )

@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_producto(
    producto_id: str,
    current_admin: Usuario = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Elimina un producto (solo admin)"""
    
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    
    print(f"🗑️ Eliminando producto: {producto.nombre}")
    
    # Eliminar imagen de Supabase si existe
    if producto.imagen_url:
        await delete_image_from_supabase(producto.imagen_url)
    
    # Eliminar producto de la base de datos
    db.delete(producto)
    db.commit()
    
    print(f"✅ Producto eliminado")
    return None

@router.get("/categorias/list")
async def get_categorias(db: Session = Depends(get_db)):
    """Obtiene lista de categorías disponibles"""
    
    categorias = db.query(Producto.categoria).distinct().all()
    return [cat[0] for cat in categorias]