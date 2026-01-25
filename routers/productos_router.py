from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse
from typing import List, Optional
from supabase import create_client, Client
import os
from dotenv import load_dotenv
import uuid
from PIL import Image
import io
import json

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

# 🔥 NUEVA: Subir múltiples imágenes
async def upload_multiple_images(files: List[UploadFile]) -> List[str]:
    """Sube múltiples imágenes y devuelve lista de URLs"""
    urls = []
    for file in files:
        try:
            url = await upload_image_to_supabase(file)
            urls.append(url)
        except Exception as e:
            print(f"⚠️ Error subiendo {file.filename}: {e}")
            # Continuar con las demás imágenes
    return urls

# 🔥 NUEVA: Eliminar múltiples imágenes
async def delete_multiple_images(image_urls: List[str]):
    """Elimina múltiples imágenes de Supabase Storage"""
    for url in image_urls:
        try:
            await delete_image_from_supabase(url)
        except Exception as e:
            print(f"⚠️ Error eliminando imagen {url}: {e}")

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
    imagenes: List[UploadFile] = File([])  # 🔥 MÚLTIPLES IMÁGENES
):
    """Crea un nuevo producto (solo admin) - Soporta múltiples imágenes"""
    
    # Verificar admin
    get_current_admin_from_session(request)
    
    try:
        # 🔥 Subir múltiples imágenes
        imagenes_urls = []
        if imagenes and len(imagenes) > 0:
            # Filtrar archivos vacíos
            imagenes_validas = [img for img in imagenes if img.filename]
            if imagenes_validas:
                imagenes_urls = await upload_multiple_images(imagenes_validas)
        
        # 🔥 imagen_url = primera imagen (compatibilidad)
        # imagenes_urls = array completo de URLs
        imagen_principal = imagenes_urls[0] if imagenes_urls else None
        
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
            "imagen_url": imagen_principal,  # Primera imagen
            "imagenes_urls": json.dumps(imagenes_urls) if imagenes_urls else None  # Todas las imágenes como JSON
        }
        
        nuevo_producto = supabase_rest.create_producto(producto_data)
        
        if not nuevo_producto:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear producto"
            )
        
        print(f"✅ Producto creado con {len(imagenes_urls)} imágenes")
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
    imagenes: List[UploadFile] = File([]),  # 🔥 MÚLTIPLES IMÁGENES
    mantener_imagenes: bool = Form(True)  # 🔥 NUEVA: opción para mantener o reemplazar
):
    """Actualiza un producto (solo admin) - Soporta múltiples imágenes"""
    
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
        
        # 🔥 Manejar múltiples imágenes
        imagenes_validas = [img for img in imagenes if img.filename]
        
        if imagenes_validas and len(imagenes_validas) > 0:
            # Obtener imágenes actuales
            imagenes_actuales = []
            if producto.get("imagenes_urls"):
                try:
                    imagenes_actuales = json.loads(producto["imagenes_urls"])
                except:
                    imagenes_actuales = []
            
            if not mantener_imagenes:
                # 🔥 REEMPLAZAR: Eliminar imágenes antiguas
                if imagenes_actuales:
                    await delete_multiple_images(imagenes_actuales)
                elif producto.get("imagen_url"):
                    await delete_image_from_supabase(producto["imagen_url"])
                
                # Subir nuevas imágenes
                nuevas_urls = await upload_multiple_images(imagenes_validas)
                updates["imagen_url"] = nuevas_urls[0] if nuevas_urls else None
                updates["imagenes_urls"] = json.dumps(nuevas_urls) if nuevas_urls else None
            else:
                # 🔥 AGREGAR: Mantener antiguas y agregar nuevas
                nuevas_urls = await upload_multiple_images(imagenes_validas)
                todas_urls = imagenes_actuales + nuevas_urls
                updates["imagen_url"] = todas_urls[0] if todas_urls else None
                updates["imagenes_urls"] = json.dumps(todas_urls)
        
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
        
        # 🔥 Eliminar TODAS las imágenes
        if producto.get("imagenes_urls"):
            try:
                imagenes_urls = json.loads(producto["imagenes_urls"])
                await delete_multiple_images(imagenes_urls)
            except:
                pass
        
        # Eliminar imagen principal por si acaso
        if producto.get("imagen_url"):
            await delete_image_from_supabase(producto["imagen_url"])
        
        # Eliminar producto
        success = supabase_rest.delete_producto(producto_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al eliminar producto"
            )
        
        # ✅ SIEMPRE retornar JSON con status 200
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Producto eliminado exitosamente", 
                "id": producto_id
            }
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