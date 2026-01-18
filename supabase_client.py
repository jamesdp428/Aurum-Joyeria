# supabase_client.py - Cliente REST para Supabase (Serverless-friendly)

import os
import requests
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

class SupabaseClient:
    """Cliente REST para Supabase - Compatible con Vercel Serverless"""
    
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_KEY")
        
        if not self.url or not self.key:
            raise ValueError("SUPABASE_URL y SUPABASE_KEY deben estar configuradas")
        
        self.rest_url = f"{self.url}/rest/v1"
        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
    
    def _request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Realiza una petición HTTP a Supabase REST API"""
        url = f"{self.rest_url}/{endpoint}"
        
        if "headers" in kwargs:
            headers = {**self.headers, **kwargs["headers"]}
            kwargs["headers"] = headers
        else:
            kwargs["headers"] = self.headers
        
        response = requests.request(method, url, **kwargs)
        return response
    
    # ========== USUARIOS ==========
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Obtiene un usuario por email"""
        response = self._request("GET", f"usuarios?email=eq.{email}&select=*")
        
        if response.status_code == 200:
            users = response.json()
            return users[0] if users else None
        return None
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Obtiene un usuario por ID"""
        response = self._request("GET", f"usuarios?id=eq.{user_id}&select=*")
        
        if response.status_code == 200:
            users = response.json()
            return users[0] if users else None
        return None
    
    def create_user(self, user_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Crea un nuevo usuario"""
        response = self._request("POST", "usuarios", json=user_data)
        
        if response.status_code in [200, 201]:
            users = response.json()
            return users[0] if users else None
        return None
    
    def update_user(self, user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Actualiza un usuario"""
        response = self._request("PATCH", f"usuarios?id=eq.{user_id}", json=updates)
        
        if response.status_code == 200:
            users = response.json()
            return users[0] if users else None
        return None
    
    def delete_user(self, user_id: str) -> bool:
        """Elimina un usuario"""
        response = self._request("DELETE", f"usuarios?id=eq.{user_id}")
        return response.status_code == 204
    
    def get_all_users(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Obtiene todos los usuarios"""
        response = self._request(
            "GET", 
            f"usuarios?select=*&offset={skip}&limit={limit}"
        )
        
        if response.status_code == 200:
            return response.json()
        return []
    
    # ========== PRODUCTOS ==========
    
    def get_productos(self, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Obtiene productos con filtros opcionales"""
        query_parts = ["productos?select=*"]
        
        if filters:
            if filters.get("categoria"):
                query_parts.append(f"categoria=eq.{filters['categoria']}")
            if filters.get("destacado") is not None:
                query_parts.append(f"destacado=eq.{filters['destacado']}")
            if filters.get("activo") is not None:
                query_parts.append(f"activo=eq.{filters['activo']}")
            
            skip = filters.get("skip", 0)
            limit = filters.get("limit", 100)
            query_parts.append(f"offset={skip}")
            query_parts.append(f"limit={limit}")
        
        query = "&".join(query_parts)
        response = self._request("GET", query)
        
        if response.status_code == 200:
            return response.json()
        return []
    
    def get_producto_by_id(self, producto_id: str) -> Optional[Dict[str, Any]]:
        """Obtiene un producto por ID"""
        response = self._request("GET", f"productos?id=eq.{producto_id}&select=*")
        
        if response.status_code == 200:
            productos = response.json()
            return productos[0] if productos else None
        return None
    
    def create_producto(self, producto_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Crea un nuevo producto"""
        response = self._request("POST", "productos", json=producto_data)
        
        if response.status_code in [200, 201]:
            productos = response.json()
            return productos[0] if productos else None
        return None
    
    def update_producto(self, producto_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Actualiza un producto"""
        response = self._request("PATCH", f"productos?id=eq.{producto_id}", json=updates)
        
        if response.status_code == 200:
            productos = response.json()
            return productos[0] if productos else None
        return None
    
    def delete_producto(self, producto_id: str) -> bool:
        """Elimina un producto"""
        response = self._request("DELETE", f"productos?id=eq.{producto_id}")
        return response.status_code == 204
    
    # ========== CARRUSEL ==========
    
    def get_carrusel_items(self, activo: Optional[bool] = None) -> List[Dict[str, Any]]:
        """Obtiene items del carrusel"""
        query = "carrusel?select=*&order=orden.asc"
        
        if activo is not None:
            query += f"&activo=eq.{activo}"
        
        response = self._request("GET", query)
        
        if response.status_code == 200:
            return response.json()
        return []
    
    def get_carrusel_by_id(self, carrusel_id: str) -> Optional[Dict[str, Any]]:
        """Obtiene un item del carrusel por ID"""
        response = self._request("GET", f"carrusel?id=eq.{carrusel_id}&select=*")
        
        if response.status_code == 200:
            items = response.json()
            return items[0] if items else None
        return None
    
    def create_carrusel(self, carrusel_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Crea un nuevo item del carrusel"""
        response = self._request("POST", "carrusel", json=carrusel_data)
        
        if response.status_code in [200, 201]:
            items = response.json()
            return items[0] if items else None
        return None
    
    def update_carrusel(self, carrusel_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Actualiza un item del carrusel"""
        response = self._request("PATCH", f"carrusel?id=eq.{carrusel_id}", json=updates)
        
        if response.status_code == 200:
            items = response.json()
            return items[0] if items else None
        return None
    
    def delete_carrusel(self, carrusel_id: str) -> bool:
        """Elimina un item del carrusel"""
        response = self._request("DELETE", f"carrusel?id=eq.{carrusel_id}")
        return response.status_code == 204

# Instancia global
supabase = SupabaseClient()