# Script de deployment para Vercel
Write-Host "Construyendo el proyecto..." -ForegroundColor Green
pnpm vite build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build exitoso. Desplegando a Vercel..." -ForegroundColor Green
    Set-Location dist
    vercel --prod --yes
    Set-Location ..
} else {
    Write-Host "Error en el build" -ForegroundColor Red
}
