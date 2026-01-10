# Script para probar el deployment

Write-Host " Probando deployment de Aurum Joyería..." -ForegroundColor Cyan
Write-Host ""

$baseUrl = "https://aurum-joyeria.vercel.app"

# Test 1: Frontend
Write-Host "Test Frontend (/)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest "$baseUrl/" -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   Frontend OK (Status: $($response.StatusCode))" -ForegroundColor Green
    }
} catch {
    Write-Host "   Frontend FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: API Health
Write-Host "Test API Health (/api/health)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest "$baseUrl/api/health" -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   API Health OK (Status: $($response.StatusCode))" -ForegroundColor Green
        Write-Host "   Respuesta:" -ForegroundColor Gray
        Write-Host "   $($response.Content)" -ForegroundColor White
    }
} catch {
    Write-Host "  API Health FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: API Docs
Write-Host " Test API Docs (/api/docs)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest "$baseUrl/api/docs" -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   API Docs OK (Status: $($response.StatusCode))" -ForegroundColor Green
        Write-Host "   URL: $baseUrl/api/docs" -ForegroundColor Cyan
    }
} catch {
    Write-Host "  API Docs FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Productos
Write-Host " Test Productos (/api/productos)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest "$baseUrl/api/productos" -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   Productos OK (Status: $($response.StatusCode))" -ForegroundColor Green
        $productos = $response.Content | ConvertFrom-Json
        Write-Host "   Total productos: $($productos.Count)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   Productos FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 5: Carrusel
Write-Host "Test Carrusel (/api/carrusel)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest "$baseUrl/api/carrusel" -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   Carrusel OK (Status: $($response.StatusCode))" -ForegroundColor Green
        $items = $response.Content | ConvertFrom-Json
        Write-Host "   Items en carrusel: $($items.Count)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   Carrusel FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=" * 50 -ForegroundColor Gray
Write-Host "ENLACES IMPORTANTES:" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray
Write-Host ""
Write-Host "Frontend:    $baseUrl" -ForegroundColor White
Write-Host "API Docs:    $baseUrl/api/docs" -ForegroundColor White
Write-Host "Inspect:     https://vercel.com/james-projects-097117ad/aurum-joyeria" -ForegroundColor White
Write-Host ""