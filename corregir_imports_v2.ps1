# Script para corregir imports en los routers
Write-Host "Corrigiendo imports en routers..." -ForegroundColor Cyan
Write-Host ""

$routers = @(
    "api\routers\auth_router.py",
    "api\routers\productos_router.py",
    "api\routers\carrusel_router.py"
)

foreach ($router in $routers) {
    if (Test-Path $router) {
        Write-Host "Procesando: $router" -ForegroundColor Yellow
        
        $content = Get-Content $router -Raw -Encoding UTF8
        
        # Reemplazar imports sin prefijo api.
        $content = $content -replace 'from db import', 'from api.db import'
        $content = $content -replace 'from models import', 'from api.models import'
        $content = $content -replace 'from schemas import', 'from api.schemas import'
        $content = $content -replace 'from auth import', 'from api.auth import'
        $content = $content -replace 'from email_service import', 'from api.email_service import'
        
        # Guardar cambios
        $content | Out-File -FilePath $router -Encoding UTF8 -NoNewline
        
        Write-Host "Actualizado: $router" -ForegroundColor Green
    } else {
        Write-Host "No encontrado: $router" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Todos los imports corregidos" -ForegroundColor Green