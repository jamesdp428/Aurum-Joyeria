from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse
from typing import List, Optional
from supabase import create_client, Client
import os
from dotenv import load_dotenv
import uuid
from PIL import Image
import io

from supabase_client import supabase as supabase_rest
from schemas import ProductoResponse
from auth import decode_access_token

load_dotenv()

router = APIRouter(prefix="/productos")

# Configurar Supabase Client para Storage
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase_storage: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ========== FUNCIONES AUXILIARES ==========

def get_current_admin_from_session(request: Request):
    """Verifica que el usuario sea admin desde la sesión"""
    user_session = request.session.get("user")
    if not user_session or user_session.get("rol") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos de administrador"
        )
    return user_session

def optimize_image(file_content: bytes, max_size: tuple = (1200, 1200)) -> bytes:
    """Optimiza una imagen"""
    image = Image.open(io.BytesIO(file_content))
    
    if image.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', image.size, (255, 255, 255))
        if image.mode == 'P':
            image = image.convert('RGBA')
        background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
        image = background
    
    image.thumbnail(max_size, Image.Resampling.LANCZOS)
    
    output = io.BytesIO()
    image.save(output, format='JPEG', quality=85, optimize=True)
    return output.getvalue()

async def upload_image_to_supabase(file: UploadFile, bucket: str = "productos-images") -> str:
    """Sube imagen a Supabase Storage"""
    
    file_content = await file.read()
    
    if not file_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo está vacío"
        )
    
    try:
        optimized_content = optimize_image(file_content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al procesar imagen: {str(e)}"
        )
    
    file_extension = file.filename.split('.')[-1].lower()
    if file_extension not in ['jpg', 'jpeg', 'png', 'webp']:
        file_extension = 'jpg'
    
    unique_filename = f"producto_{uuid.uuid4()}.{file_extension}"
    
    try:
        supabase_storage.storage.from_(bucket).upload(
            path=unique_filename,
            file=optimized_content,
            file_options={"content-type": "image/jpeg", "upsert": "false"}
        )
        
        public_url = supabase_storage.storage.from_(bucket).get_public_url(unique_filename)
        return public_url
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al subir imagen: {str(e)}"
        )

async def delete_image_from_supabase(image_url: str, bucket: str = "productos-images"):
    """Elimina imagen de Supabase Storage"""
    try:
        filename = image_url.split('/')[-1]
        supabase_storage.storage.from_(bucket).remove([filename])
    except Exception as e:
        print(f"⚠️ Error al eliminar imagen: {e}")

# ========== ENDPOINTS PÚBLICOS ==========

@router.get("", response_model=List[dict])
async def get_productos(
    categoria: Optional[str] = None,
    destacado: Optional[bool] = None,
    activo: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100
):
    """Obtiene lista de productos con filtros"""
    
    try:
        filters = {}
        if categoria:
            filters["categoria"] = categoria
        if destacado is not None:
            filters["destacado"] = destacado
        if activo is not None:
            filters["activo"] = activo
        filters["skip"] = skip
        filters["limit"] = limit
        
        productos = supabase_rest.get_productos(filters)
        return productos
    except Exception as e:
        print(f"❌ Error obteniendo productos: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{producto_id}")
async def get_producto(producto_id: str):
    """Obtiene un producto por ID"""
    
    producto = supabase_rest.get_producto_by_id(producto_id)
    
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    
    return producto

# ========== ENDPOINTS ADMIN ==========

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_producto(
    request: Request,
    nombre: str = Form(...),
    descripcion: Optional[str] = Form(None),
    precio: Optional[float] = Form(None),
    categoria: str = Form(...),
    stock: int = Form(0),
    destacado: bool = Form(False),
    activo: bool = Form(True),
    imagen: Optional[UploadFile] = File(None)
):
    """Crea un nuevo producto (solo admin)"""
    
    # Verificar admin
    get_current_admin_from_session(request)
    
    try:
        # Subir imagen si existe
        imagen_url = None
        if imagen and imagen.filename:
            imagen_url = await upload_image_to_supabase(imagen)
        
        # Crear producto
        producto_data = {
            "id": str(uuid.uuid4()),
            "nombre": nombre,
            "descripcion": descripcion,
            "precio": precio,
            "categoria": categoria,
            "stock": stock,
            "destacado": destacado,
            "activo": activo,
            "imagen_url": imagen_url
        }
        
        nuevo_producto = supabase_rest.create_producto(producto_data)
        
        if not nuevo_producto:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear producto"
            )
        
        return nuevo_producto
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creando producto: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.put("/{producto_id}")
async def update_producto(
    request: Request,
    producto_id: str,
    nombre: Optional[str] = Form(None),
    descripcion: Optional[str] = Form(None),
    precio: Optional[float] = Form(None),
    categoria: Optional[str] = Form(None),
    stock: Optional[int] = Form(None),
    destacado: Optional[bool] = Form(None),
    activo: Optional[bool] = Form(None),
    imagen: Optional[UploadFile] = File(None)
):
    """Actualiza un producto (solo admin)"""
    
    # Verificar admin
    get_current_admin_from_session(request)
    
    try:
        # Obtener producto actual
        producto = supabase_rest.get_producto_by_id(producto_id)
        if not producto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Producto no encontrado"
            )
        
        # Preparar actualizaciones
        updates = {}
        if nombre is not None:
            updates["nombre"] = nombre
        if descripcion is not None:
            updates["descripcion"] = descripcion
        if precio is not None:
            updates["precio"] = precio
        if categoria is not None:
            updates["categoria"] = categoria
        if stock is not None:
            updates["stock"] = stock
        if destacado is not None:
            updates["destacado"] = destacado
        if activo is not None:
            updates["activo"] = activo
        
        # Actualizar imagen si se proporciona
        if imagen and imagen.filename:
            if producto.get("imagen_url"):
                await delete_image_from_supabase(producto["imagen_url"])
            updates["imagen_url"] = await upload_image_to_supabase(imagen)
        
        # Actualizar producto
        producto_actualizado = supabase_rest.update_producto(producto_id, updates)
        
        if not producto_actualizado:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al actualizar producto"
            )
        
        return producto_actualizado
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error actualizando producto: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# 🔥 CRÍTICO: Cambiar de 204 a 200 con JSON response
@router.delete("/{producto_id}")
async def delete_producto(request: Request, producto_id: str):
    """Elimina un producto (solo admin)"""
    
    # Verificar admin
    get_current_admin_from_session(request)
    
    try:
        producto = supabase_rest.get_producto_by_id(producto_id)
        if not producto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Producto no encontrado"
            )
        
        # Eliminar imagen
        if producto.get("imagen_url"):
            await delete_image_from_supabase(producto["imagen_url"])
        
        # Eliminar producto
        success = supabase_rest.delete_producto(producto_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al eliminar producto"
            )
        
        # 🔥 RETORNAR JSON en lugar de None
        return JSONResponse(
            status_code=200,
            content={"message": "Producto eliminado exitosamente", "id": producto_id}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error eliminando producto: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/categorias/list")
async def get_categorias():
    """Obtiene lista de categorías"""
    try:
        productos = supabase_rest.get_productos({})
        categorias = list(set(p.get("categoria") for p in productos if p.get("categoria")))
        return categorias
    except Exception as e:
        print(f"❌ Error obteniendo categorías: {e}")
        return []