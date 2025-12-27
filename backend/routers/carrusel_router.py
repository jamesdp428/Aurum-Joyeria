from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from supabase import create_client, Client
import os
from dotenv import load_dotenv
import uuid
from PIL import Image
import io

from db import get_db
from models import Carrusel, Usuario
from schemas import CarruselCreate, CarruselUpdate, CarruselResponse
from auth import get_current_admin

load_dotenv()

router = APIRouter(prefix="/api/carrusel")

# Configurar Supabase Client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ========== FUNCIONES AUXILIARES ==========

def optimize_carousel_image(file_content: bytes, max_size: tuple = (1920, 1080)) -> bytes:
    """Optimiza imagen del carrusel manteniendo aspect ratio"""
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
    image.save(output, format='JPEG', quality=90, optimize=True)
    return output.getvalue()

async def upload_carousel_image(file: UploadFile) -> str:
    """Sube imagen del carrusel a Supabase Storage"""
    
    # Leer contenido
    file_content = await file.read()
    
    # VALIDACIÓN: Verificar que hay contenido
    if not file_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo de imagen está vacío"
        )
    
    # Optimizar imagen
    try:
        optimized_content = optimize_carousel_image(file_content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al procesar la imagen: {str(e)}"
        )
    
    # Generar nombre único
    file_extension = file.filename.split('.')[-1].lower()
    if file_extension not in ['jpg', 'jpeg', 'png', 'webp']:
        file_extension = 'jpg'
    
    unique_filename = f"carousel_{uuid.uuid4()}.{file_extension}"
    
    # Subir a Supabase
    try:
        print(f"📤 Subiendo imagen del carrusel: {unique_filename}")
        
        response = supabase.storage.from_("carrusel-images").upload(
            path=unique_filename,
            file=optimized_content,
            file_options={"content-type": "image/jpeg", "upsert": "false"}
        )
        
        # Obtener URL pública
        public_url = supabase.storage.from_("carrusel-images").get_public_url(unique_filename)
        
        print(f"✅ Imagen del carrusel subida: {public_url}")
        return public_url
        
    except Exception as e:
        print(f"❌ Error al subir imagen del carrusel: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al subir imagen: {str(e)}"
        )

async def delete_carousel_image(image_url: str):
    """Elimina imagen del carrusel de Supabase Storage"""
    try:
        filename = image_url.split('/')[-1]
        supabase.storage.from_("carrusel-images").remove([filename])
        print(f"🗑️ Imagen del carrusel eliminada: {filename}")
    except Exception as e:
        print(f"⚠️ Error al eliminar imagen del carrusel: {str(e)}")

# ========== ENDPOINTS PÚBLICOS ==========

@router.get("", response_model=List[CarruselResponse])
async def get_carrusel_items(
    activo: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Obtiene items del carrusel ordenados"""
    
    query = db.query(Carrusel)
    
    if activo is not None:
        query = query.filter(Carrusel.activo == activo)
    
    items = query.order_by(Carrusel.orden).all()
    
    return items

@router.get("/{item_id}", response_model=CarruselResponse)
async def get_carrusel_item(item_id: str, db: Session = Depends(get_db)):
    """Obtiene un item del carrusel por ID"""
    
    item = db.query(Carrusel).filter(Carrusel.id == item_id).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item del carrusel no encontrado"
        )
    
    return item

# ========== ENDPOINTS ADMIN ==========

@router.post("", response_model=CarruselResponse, status_code=status.HTTP_201_CREATED)
async def create_carrusel_item(
    titulo: Optional[str] = Form(None),
    descripcion: Optional[str] = Form(None),
    orden: int = Form(0),
    activo: bool = Form(True),
    imagen: UploadFile = File(...),
    current_admin: Usuario = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Crea nuevo item del carrusel (solo admin)"""
    
    print(f"📝 Creando item del carrusel")
    print(f"   Título: {titulo}")
    print(f"   Imagen: {imagen.filename}")
    
    # Subir imagen
    try:
        imagen_url = await upload_carousel_image(imagen)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al subir imagen: {str(e)}"
        )
    
    # Crear item
    nuevo_item = Carrusel(
        titulo=titulo,
        descripcion=descripcion,
        orden=orden,
        activo=activo,
        imagen_url=imagen_url
    )
    
    try:
        db.add(nuevo_item)
        db.commit()
        db.refresh(nuevo_item)
        print(f"✅ Item del carrusel creado con ID: {nuevo_item.id}")
        return nuevo_item
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al guardar item: {str(e)}"
        )

@router.put("/{item_id}", response_model=CarruselResponse)
async def update_carrusel_item(
    item_id: str,
    titulo: Optional[str] = Form(None),
    descripcion: Optional[str] = Form(None),
    orden: Optional[int] = Form(None),
    activo: Optional[bool] = Form(None),
    imagen: Optional[UploadFile] = File(None),
    current_admin: Usuario = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Actualiza item del carrusel (solo admin)"""
    
    item = db.query(Carrusel).filter(Carrusel.id == item_id).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item del carrusel no encontrado"
        )
    
    print(f"📝 Actualizando item del carrusel: {item.titulo}")
    
    # Actualizar campos
    if titulo is not None:
        item.titulo = titulo
    if descripcion is not None:
        item.descripcion = descripcion
    if orden is not None:
        item.orden = orden
    if activo is not None:
        item.activo = activo
    
    # Actualizar imagen si se proporciona
    if imagen and imagen.filename:
        print(f"🖼️ Actualizando imagen del carrusel...")
        try:
            # Eliminar imagen anterior
            if item.imagen_url:
                await delete_carousel_image(item.imagen_url)
            
            # Subir nueva imagen
            item.imagen_url = await upload_carousel_image(imagen)
            print(f"✅ Nueva imagen: {item.imagen_url}")
        except Exception as e:
            print(f"❌ Error al actualizar imagen: {str(e)}")
    
    try:
        db.commit()
        db.refresh(item)
        print(f"✅ Item del carrusel actualizado")
        return item
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar: {str(e)}"
        )

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_carrusel_item(
    item_id: str,
    current_admin: Usuario = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Elimina item del carrusel (solo admin)"""
    
    item = db.query(Carrusel).filter(Carrusel.id == item_id).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item del carrusel no encontrado"
        )
    
    print(f"🗑️ Eliminando item del carrusel")
    
    # Eliminar imagen de Supabase
    if item.imagen_url:
        await delete_carousel_image(item.imagen_url)
    
    # Eliminar de la base de datos
    db.delete(item)
    db.commit()
    
    print(f"✅ Item del carrusel eliminado")
    return None

@router.put("/{item_id}/reorder", response_model=CarruselResponse)
async def reorder_carrusel_item(
    item_id: str,
    new_order: int = Form(...),
    current_admin: Usuario = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Cambia el orden de un item del carrusel (solo admin)"""
    
    item = db.query(Carrusel).filter(Carrusel.id == item_id).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item del carrusel no encontrado"
        )
    
    item.orden = new_order
    db.commit()
    db.refresh(item)
    
    return item