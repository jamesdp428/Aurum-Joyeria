#!/bin/bash
# Comandos para diagnosticar el error 500

echo "🔍 Diagnosticando error 500 en Vercel..."
echo ""

# Opción 1: Ver logs en tiempo real
echo "📊 Opción 1: Ver logs en tiempo real"
echo "vercel logs --follow"
echo ""

# Opción 2: Ver logs del último deployment
echo "📊 Opción 2: Ver logs del último deployment"
echo "vercel logs"
echo ""

# Opción 3: Ver logs desde el Dashboard
echo "📊 Opción 3: Dashboard de Vercel"
echo "1. Ve a: https://vercel.com/dashboard"
echo "2. Selecciona tu proyecto"
echo "3. Click en 'Deployments'"
echo "4. Click en el deployment más reciente"
echo "5. Ve a la pestaña 'Logs'"
echo ""

echo "⚠️ Busca en los logs errores como:"
echo "  - ImportError"
echo "  - ModuleNotFoundError"
echo "  - Database connection error"
echo "  - Missing environment variable"