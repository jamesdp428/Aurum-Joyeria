# Script para obtener logs de Vercel

Write-Host " Obteniendo logs del deployment..." -ForegroundColor Cyan
Write-Host ""

# Obtener la URL del último deployment
Write-Host " Buscando último deployment..." -ForegroundColor Yellow

$deployment = "https://aurum-joyeria-cexv1m8ca-james-projects-097117ad.vercel.app"

Write-Host "Deployment: $deployment" -ForegroundColor Green
Write-Host ""
Write-Host " Logs:" -ForegroundColor Cyan
Write-Host ""

vercel logs $deployment

Write-Host ""
Write-Host "=" * 50 -ForegroundColor Gray
Write-Host ""
Write-Host "También puedes ver los logs en:" -ForegroundColor Yellow
Write-Host "   https://vercel.com/james-projects-097117ad/aurum-joyeria" -ForegroundColor White
Write-Host ""