# Script para instalar todas las dependencias
Write-Host "Instalando dependencias..." -ForegroundColor Cyan

# Activar entorno virtual si existe, o crear uno nuevo
if (Test-Path "venv") {
    Write-Host "Entorno virtual encontrado" -ForegroundColor Green
    .\venv\Scripts\Activate.ps1
} else {
    Write-Host "Creando entorno virtual..." -ForegroundColor Yellow
    python -m venv venv
    .\venv\Scripts\Activate.ps1
}

# Actualizar pip
Write-Host "Actualizando pip..." -ForegroundColor Cyan
python -m pip install --upgrade pip

# Instalar dependencias
Write-Host "Instalando paquetes desde requirements.txt..." -ForegroundColor Cyan
pip install -r requirements.txt

Write-Host ""
Write-Host "Dependencias instaladas correctamente" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora puedes ejecutar:" -ForegroundColor Yellow
Write-Host "  python test_local.py" -ForegroundColor White
Write-Host "  uvicorn api.main:app --reload" -ForegroundColor White
