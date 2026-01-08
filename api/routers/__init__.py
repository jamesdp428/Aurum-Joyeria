# Exportar routers para facilitar imports
from . import auth_router
from . import productos_router
from . import carrusel_router

__all__ = ["auth_router", "productos_router", "carrusel_router"]