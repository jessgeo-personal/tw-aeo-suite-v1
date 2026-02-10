# Complete cache clearing script for React/Webpack dev server issues

Write-Host "=== STEP 1: Stopping any running Node processes ===" -ForegroundColor Cyan
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "`n=== STEP 2: Clearing npm cache ===" -ForegroundColor Cyan
npm cache clean --force

Write-Host "`n=== STEP 3: Removing node_modules ===" -ForegroundColor Cyan
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules
    Write-Host "node_modules deleted" -ForegroundColor Green
}

Write-Host "`n=== STEP 4: Removing package-lock.json ===" -ForegroundColor Cyan
if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json
    Write-Host "package-lock.json deleted" -ForegroundColor Green
}

Write-Host "`n=== STEP 5: Clearing webpack/react-scripts cache ===" -ForegroundColor Cyan
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force node_modules/.cache
}

Write-Host "`n=== STEP 6: Clearing environment variables ===" -ForegroundColor Cyan
$env:DANGEROUSLY_DISABLE_HOST_CHECK = $null
$env:WDS_SOCKET_HOST = $null
$env:HOST = $null

Write-Host "`n=== STEP 7: Fresh install ===" -ForegroundColor Cyan
npm install

Write-Host "`n=== ALL CACHES CLEARED - Ready to start ===" -ForegroundColor Green
Write-Host "Run: npm start" -ForegroundColor Yellow