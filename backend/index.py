# api/index.py - Handler para Vercel
import sys
import os

# Añadir el directorio api al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app

# Vercel busca esta variable
handler = app