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

load_dotenv()

router = APIRouter(prefix="/carrusel")

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

def optimize_carousel_image(file_content: bytes, max_size: tuple = (1920, 1080)) -> bytes:
    """Optimiza imagen del carrusel"""
    image = Image.open(io.BytesIO(file_content))
    
    if image.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', image.size, (255, 255, 255))
        if image.mode == 'P':
            image = image.convert('RGBA')
        background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
        image = background
    
    image.thumbnail(max_size, Image.Resampling.LANCZOS)
    
    output = io.BytesIO()
    image.save(output, format='JPEG', quality=90, optimize=True)
    return output.getvalue()

async def upload_carousel_image(file: UploadFile) -> str:
    """Sube imagen del carrusel a Supabase Storage"""
    
    file_content = await file.read()
    
    if not file_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo está vacío"
        )
    
    try:
        optimized_content = optimize_carousel_image(file_content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al procesar imagen: {str(e)}"
        )
    
    file_extension = file.filename.split('.')[-1].lower()
    if file_extension not in ['jpg', 'jpeg', 'png', 'webp']:
        file_extension = 'jpg'
    
    unique_filename = f"carousel_{uuid.uuid4()}.{file_extension}"
    
    try:
        supabase_storage.storage.from_("carrusel-images").upload(
            path=unique_filename,
            file=optimized_content,
            file_options={"content-type": "image/jpeg", "upsert": "false"}
        )
        
        public_url = supabase_storage.storage.from_("carrusel-images").get_public_url(unique_filename)
        return public_url
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al subir imagen: {str(e)}"
        )

async def delete_carousel_image(image_url: str):
    """Elimina imagen del carrusel de Supabase Storage"""
    try:
        filename = image_url.split('/')[-1]
        supabase_storage.storage.from_("carrusel-images").remove([filename])
    except Exception as e:
        print(f"⚠️ Error al eliminar imagen: {e}")

# ========== ENDPOINTS PÚBLICOS ==========

@router.get("", response_model=List[dict])
async def get_carrusel_items(activo: Optional[bool] = None):
    """Obtiene items del carrusel ordenados"""
    
    try:
        items = supabase_rest.get_carrusel_items(activo)
        return items
    except Exception as e:
        print(f"❌ Error obteniendo carrusel: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{item_id}")
async def get_carrusel_item(item_id: str):
    """Obtiene un item del carrusel por ID"""
    
    item = supabase_rest.get_carrusel_by_id(item_id)
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item del carrusel no encontrado"
        )
    
    return item

# ========== ENDPOINTS ADMIN ==========

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_carrusel_item(
    request: Request,
    titulo: Optional[str] = Form(None),
    descripcion: Optional[str] = Form(None),
    orden: int = Form(0),
    activo: bool = Form(True),
    imagen: UploadFile = File(...)
):
    """Crea nuevo item del carrusel (solo admin)"""
    
    # Verificar admin
    get_current_admin_from_session(request)
    
    try:
        # Subir imagen
        imagen_url = await upload_carousel_image(imagen)
        
        # Crear item
        carrusel_data = {
            "id": str(uuid.uuid4()),
            "titulo": titulo,
            "descripcion": descripcion,
            "orden": orden,
            "activo": activo,
            "imagen_url": imagen_url
        }
        
        nuevo_item = supabase_rest.create_carrusel(carrusel_data)
        
        if not nuevo_item:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear item del carrusel"
            )
        
        return nuevo_item
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creando item del carrusel: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.put("/{item_id}")
async def update_carrusel_item(
    request: Request,
    item_id: str,
    titulo: Optional[str] = Form(None),
    descripcion: Optional[str] = Form(None),
    orden: Optional[int] = Form(None),
    activo: Optional[bool] = Form(None),
    imagen: Optional[UploadFile] = File(None)
):
    """Actualiza item del carrusel (solo admin)"""
    
    # Verificar admin
    get_current_admin_from_session(request)
    
    try:
        # Obtener item actual
        item = supabase_rest.get_carrusel_by_id(item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item del carrusel no encontrado"
            )
        
        # Preparar actualizaciones
        updates = {}
        if titulo is not None:
            updates["titulo"] = titulo
        if descripcion is not None:
            updates["descripcion"] = descripcion
        if orden is not None:
            updates["orden"] = orden
        if activo is not None:
            updates["activo"] = activo
        
        # Actualizar imagen si se proporciona
        if imagen and imagen.filename:
            if item.get("imagen_url"):
                await delete_carousel_image(item["imagen_url"])
            updates["imagen_url"] = await upload_carousel_image(imagen)
        
        # Actualizar item
        item_actualizado = supabase_rest.update_carrusel(item_id, updates)
        
        if not item_actualizado:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al actualizar item del carrusel"
            )
        
        return item_actualizado
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error actualizando item del carrusel: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# 🔥 CRÍTICO: Cambiar de 204 a 200 con JSON response
@router.delete("/{item_id}")
async def delete_carrusel_item(request: Request, item_id: str):
    """Elimina item del carrusel (solo admin)"""
    
    # Verificar admin
    get_current_admin_from_session(request)
    
    try:
        item = supabase_rest.get_carrusel_by_id(item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item del carrusel no encontrado"
            )
        
        # Eliminar imagen
        if item.get("imagen_url"):
            await delete_carousel_image(item["imagen_url"])
        
        # Eliminar item
        success = supabase_rest.delete_carrusel(item_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al eliminar item del carrusel"
            )
        
        # 🔥 RETORNAR JSON en lugar de None
        return JSONResponse(
            status_code=200,
            content={"message": "Item eliminado exitosamente", "id": item_id}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error eliminando item del carrusel: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )