# Script PowerShell pour démarrer le keep-alive Supabase en arrière-plan
# Usage: .\scripts\start-keep-alive.ps1

Write-Host "🚀 Démarrage du keep-alive Supabase..." -ForegroundColor Green

# Vérifier que Node.js est installé
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js détecté: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    exit 1
}

# Vérifier que les variables d'environnement existent
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  Fichier .env.local non trouvé" -ForegroundColor Yellow
    Write-Host "Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont définies" -ForegroundColor Yellow
}

# Démarrer le script en arrière-plan
Write-Host "📊 Le keep-alive va démarrer..." -ForegroundColor Cyan
Write-Host "💡 Pour arrêter, utilisez: Get-Process node | Stop-Process" -ForegroundColor Yellow
Write-Host ""

# Démarrer le processus
Start-Process node -ArgumentList "scripts/keep-alive-supabase.js" -WindowStyle Hidden

Write-Host "✅ Keep-alive démarré en arrière-plan!" -ForegroundColor Green
Write-Host "📝 Les logs sont affichés dans la console" -ForegroundColor Cyan
