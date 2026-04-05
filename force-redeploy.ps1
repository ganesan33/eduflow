# Force complete redeployment of frontend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 1: Stop the Frontend App" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

az webapp stop --name eduflow-frontend --resource-group eduflow-rg
Write-Host "Frontend stopped" -ForegroundColor Green

Write-Host "`nWaiting 10 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Step 2: Clear Container Settings" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Force pull the latest image by updating the tag
az webapp config container set `
  --name eduflow-frontend `
  --resource-group eduflow-rg `
  --docker-custom-image-name eduflowregistry.azurecr.io/eduflow-frontend:15

Write-Host "Container image set to build 15" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Step 3: Enable Continuous Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

az webapp deployment container config `
  --name eduflow-frontend `
  --resource-group eduflow-rg `
  --enable-cd true

Write-Host "Continuous deployment enabled" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Step 4: Restart with Fresh Pull" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

az webapp start --name eduflow-frontend --resource-group eduflow-rg
Write-Host "Frontend started" -ForegroundColor Green

Write-Host "`nWaiting 30 seconds for container to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Step 5: Verify Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$html = Invoke-WebRequest -Uri "https://eduflow-frontend.azurewebsites.net" -UseBasicParsing
$scriptMatches = [regex]::Matches($html.Content, '<script[^>]*src="([^"]+)"')
$mainScript = $scriptMatches | Where-Object { $_.Groups[1].Value -match "index.*\.js" } | Select-Object -First 1

if ($mainScript) {
    $scriptUrl = "https://eduflow-frontend.azurewebsites.net" + $mainScript.Groups[1].Value
    $jsContent = Invoke-WebRequest -Uri $scriptUrl -UseBasicParsing
    
    if ($jsContent.Content -match "localhost:3000") {
        Write-Host "❌ STILL WRONG: localhost:3000 found" -ForegroundColor Red
        Write-Host "`nThe container might be cached. Try:" -ForegroundColor Yellow
        Write-Host "az webapp deployment container config --name eduflow-frontend --resource-group eduflow-rg --enable-cd false" -ForegroundColor White
        Write-Host "az webapp deployment container config --name eduflow-frontend --resource-group eduflow-rg --enable-cd true" -ForegroundColor White
    } else {
        Write-Host "✅ SUCCESS: No localhost:3000 found!" -ForegroundColor Green
        
        if ($jsContent.Content -match "eduflow-backend\.azurewebsites\.net") {
            Write-Host "✅ CORRECT: eduflow-backend.azurewebsites.net found!" -ForegroundColor Green
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
