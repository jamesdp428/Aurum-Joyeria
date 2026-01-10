# Script para ver los logs del último deployment
Write-Host "Obteniendo logs del último deployment..." -ForegroundColor Cyan
Write-Host ""

# Obtener URL del último deployment
$deployments = vercel ls --json | ConvertFrom-Json
if ($deployments.deployments -and $deployments.deployments.Count -gt 0) {
    $latestDeployment = $deployments.deployments[0].url
    Write-Host "Último deployment: $latestDeployment" -ForegroundColor Green
    Write-Host ""
    Write-Host "Mostrando logs..." -ForegroundColor Cyan
    Write-Host ""
    
    vercel logs $latestDeployment
} else {
    Write-Host "No se encontraron deployments" -ForegroundColor Red
    Write-Host "Ejecuta: vercel --prod" -ForegroundColor Yellow
}