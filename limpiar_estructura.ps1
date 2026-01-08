# Script para limpiar la estructura del proyecto
Write-Host "🧹 Limpiando estructura del proyecto..." -ForegroundColor Cyan

# 1. Eliminar carpeta backend completa (ya tienes api/)
if (Test-Path "backend") {
    Write-Host "❌ Eliminando carpeta backend..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "backend"
}

# 2. Eliminar carpetas vacías
$carpetasVacias = @("css", "html", "img", "js")
foreach ($carpeta in $carpetasVacias) {
    if (Test-Path $carpeta) {
        Write-Host "❌ Eliminando carpeta vacía: $carpeta" -ForegroundColor Yellow
        Remove-Item -Recurse -Force $carpeta
    }
}

# 3. Eliminar archivos innecesarios
$archivosInnecesarios = @(
    "build.sh",
    "fix_imports.ps1", 
    "fix-imports.ps1",
    "procfile",
    "render.yaml",
    "reorganizar_vercel.ps1",
    "reorganizar-vercel.ps1",
    "runtime.txt"
)

foreach ($archivo in $archivosInnecesarios) {
    if (Test-Path $archivo) {
        Write-Host "❌ Eliminando: $archivo" -ForegroundColor Yellow
        Remove-Item -Force $archivo
    }
}

Write-Host "✅ Limpieza completada" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Estructura final debe ser:" -ForegroundColor Cyan
Write-Host "   joyeria/" -ForegroundColor White
Write-Host "   ├── .vercel/" -ForegroundColor Gray
Write-Host "   ├── api/" -ForegroundColor Yellow
Write-Host "   │   ├── routers/" -ForegroundColor Yellow
Write-Host "   │   ├── main.py" -ForegroundColor Yellow
Write-Host "   │   └── ..." -ForegroundColor Gray
Write-Host "   ├── public/" -ForegroundColor Cyan
Write-Host "   │   ├── html/" -ForegroundColor Cyan
Write-Host "   │   ├── css/" -ForegroundColor Cyan
Write-Host "   │   ├── js/" -ForegroundColor Cyan
Write-Host "   │   └── index.html" -ForegroundColor Cyan
Write-Host "   ├── requirements.txt" -ForegroundColor White
Write-Host "   ├── vercel.json" -ForegroundColor White
Write-Host "   └── .gitignore" -ForegroundColor White