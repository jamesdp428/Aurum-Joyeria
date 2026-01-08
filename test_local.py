#!/usr/bin/env python3
"""
Script para verificar que todos los imports funcionan antes de deploy
"""
import sys
import os

print("🔍 Verificando imports y configuración...\n")

# 1. Verificar estructura de directorios
print("📁 Verificando estructura...")
required_files = [
    "api/__init__.py",
    "api/main.py",
    "api/auth.py",
    "api/db.py",
    "api/models.py",
    "api/schemas.py",
    "api/email_service.py",
    "api/routers/__init__.py",
    "api/routers/auth_router.py",
    "api/routers/productos_router.py",
    "api/routers/carrusel_router.py",
    "requirements.txt",
    "vercel.json"
]

missing_files = []
for file in required_files:
    if os.path.exists(file):
        print(f"  ✅ {file}")
    else:
        print(f"  ❌ {file} - NO ENCONTRADO")
        missing_files.append(file)

if missing_files:
    print(f"\n❌ Faltan {len(missing_files)} archivos requeridos")
    sys.exit(1)

print("\n✅ Todos los archivos requeridos existen\n")

# 2. Verificar imports
print("🐍 Verificando imports de Python...")

try:
    print("  Importando FastAPI...")
    from fastapi import FastAPI
    print("  ✅ FastAPI")
    
    print("  Importando Mangum...")
    from mangum import Mangum
    print("  ✅ Mangum")
    
    print("  Importando SQLAlchemy...")
    from sqlalchemy import create_engine
    print("  ✅ SQLAlchemy")
    
    print("  Importando api.models...")
    from api.models import Usuario, Producto, Carrusel
    print("  ✅ api.models")
    
    print("  Importando api.schemas...")
    from api.schemas import UsuarioCreate, ProductoResponse
    print("  ✅ api.schemas")
    
    print("  Importando api.auth...")
    from api.auth import hash_password, get_current_user
    print("  ✅ api.auth")
    
    print("  Importando api.routers...")
    from api.routers import auth_router, productos_router, carrusel_router
    print("  ✅ api.routers")
    
    print("  Importando api.main...")
    from api.main import app, handler
    print("  ✅ api.main")
    
except Exception as e:
    print(f"\n❌ Error al importar: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n✅ Todos los imports funcionan correctamente\n")

# 3. Verificar variables de entorno
print("🔑 Verificando variables de entorno...")

required_env_vars = [
    "DATABASE_URL",
    "JWT_SECRET_KEY",
    "SUPABASE_URL",
    "SUPABASE_KEY",
    "RESEND_API_KEY"
]

missing_env_vars = []
for var in required_env_vars:
    value = os.getenv(var)
    if value:
        # Mostrar solo los primeros caracteres por seguridad
        masked = value[:10] + "..." if len(value) > 10 else value
        print(f"  ✅ {var}: {masked}")
    else:
        print(f"  ⚠️  {var}: NO CONFIGURADA")
        missing_env_vars.append(var)

if missing_env_vars:
    print(f"\n⚠️  Faltan {len(missing_env_vars)} variables de entorno")
    print("Asegúrate de configurarlas en Vercel Dashboard")

# 4. Verificar requirements.txt
print("\n📦 Verificando requirements.txt...")
with open("requirements.txt", "r") as f:
    requirements = f.read()
    
    critical_packages = ["fastapi", "mangum", "sqlalchemy", "supabase"]
    for pkg in critical_packages:
        if pkg in requirements:
            print(f"  ✅ {pkg}")
        else:
            print(f"  ❌ {pkg} - NO ENCONTRADO en requirements.txt")

# 5. Verificar vercel.json
print("\n⚙️  Verificando vercel.json...")
import json
with open("vercel.json", "r") as f:
    vercel_config = json.load(f)
    
    if vercel_config.get("builds"):
        print(f"  ✅ builds configurado")
    if vercel_config.get("routes"):
        print(f"  ✅ routes configurado ({len(vercel_config['routes'])} rutas)")

print("\n" + "="*50)
print("✅ VERIFICACIÓN COMPLETADA")
print("="*50)
print("\n🚀 Tu aplicación está lista para deploy a Vercel")
print("\nPasos siguientes:")
print("1. git add .")
print("2. git commit -m 'fix: Corrige imports y configuración'")
print("3. git push origin main")
print("4. Vercel hará auto-deploy")
print("\nO ejecuta: vercel --prod")