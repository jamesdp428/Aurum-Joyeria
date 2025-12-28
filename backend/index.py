import sys
import os

# Agregar el directorio backend al path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

print("🔍 Current directory:", current_dir)
print("🔍 Python path:", sys.path)

# Cargar variables de entorno
from dotenv import load_dotenv
load_dotenv()

print("🔍 Environment variables loaded")

# Importar la app
try:
    from main import app
    print("✅ App imported successfully")
except Exception as e:
    print(f"❌ Error importing app: {e}")
    raise

# Vercel busca esta variable
handler = app

print("✅ Handler configured")

# Para testing local
if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting local server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)