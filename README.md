# 💍 Aurum Joyería

Sistema de catálogo online para joyería con panel de administración.

## 🚀 Instalación Local

### 1. Clonar repositorio
```bash
git clone https://github.com/TU-USUARIO/aurum-joyeria.git
cd aurum-joyeria
```

### 2. Configurar Backend
```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate

# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Configurar Variables de Entorno
```bash
cp .env.example .env
# Editar .env con tus credenciales reales
```

### 4. Inicializar Base de Datos
```bash
alembic upgrade head
python init_db.py
```

### 5. Ejecutar Servidor
```bash
python -m uvicorn main:app --reload
```

### 6. Abrir Frontend
- Abrir `index.html` con Live Server en VS Code
- O abrir directamente: http://127.0.0.1:5500

## 📝 Credenciales de Admin
```
Email: admin@aurum.com
Password: admin123
```

## 🛠️ Tecnologías
- Backend: FastAPI + PostgreSQL (Supabase)
- Frontend: HTML, CSS, JavaScript
- Storage: Supabase Storage
- Emails: Resend