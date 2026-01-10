# routers/__init__.py
from .auth_router import router as auth_router
from .productos_router import router as productos_router
from .carrusel_router import router as carrusel_router

__all__ = ['auth_router', 'productos_router', 'carrusel_router']