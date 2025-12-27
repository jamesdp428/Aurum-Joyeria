# backend/index.py - Handler para Vercel
import sys
import os

# Añadir el directorio backend al path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Cargar variables de entorno
from dotenv import load_dotenv
load_dotenv()

# Importar la app de FastAPI
from main import app

# Vercel busca esta variable
handler = app

# Para debugging (opcional)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)