# Script to manually update frontend container and force it to use the correct API URL
# This will pull the latest image and restart the frontend

$resourceGroup = "eduflow-rg"
$frontendAppName = "eduflow-frontend"
$registryUrl = "eduflowregistry.azurecr.io"
$frontendImage = "eduflow-frontend"

Write-Host "Step 1: Getting latest image tag from ACR..." -ForegroundColor Cyan
$latestTag = az acr repository show-tags --name eduflowregistry --repository $frontendImage --orderby time_desc --top 1 --output tsv

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to get latest tag" -ForegroundColor Red
    exit 1
}

Write-Host "Latest tag: $latestTag" -ForegroundColor Green

Write-Host "`nStep 2: Updating frontend container configuration..." -ForegroundColor Cyan
az webapp config container set `
    --name $frontendAppName `
    --resource-group $resourceGroup `
    --docker-custom-image-name "$registryUrl/${frontendImage}:${latestTag}"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to update container" -ForegroundColor Red
    exit 1
}

Write-Host "Container configuration updated!" -ForegroundColor Green

Write-Host "`nStep 3: Restarting frontend app service..." -ForegroundColor Cyan
az webapp restart --name $frontendAppName --resource-group $resourceGroup

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to restart app" -ForegroundColor Red
    exit 1
}

Write-Host "Frontend restarted!" -ForegroundColor Green

Write-Host "`nStep 4: Waiting for app to come online..." -ForegroundColor Cyan
Start-Sleep -Seconds 30

Write-Host "`nStep 5: Checking current container configuration..." -ForegroundColor Cyan
az webapp config container show --name $frontendAppName --resource-group $resourceGroup

Write-Host "`n✅ Done! The frontend should now be using the correct API URL." -ForegroundColor Green
Write-Host "If the issue persists, check the browser console for the actual API URL being used." -ForegroundColor Yellow
