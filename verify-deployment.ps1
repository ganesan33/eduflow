# Verify Frontend Deployment Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Checking Frontend Container Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Get the full container config
Write-Host "`nFull Container Configuration:" -ForegroundColor Yellow
az webapp config container show --name eduflow-frontend --resource-group eduflow-rg

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Checking App Settings" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Get app settings
az webapp config appsettings list --name eduflow-frontend --resource-group eduflow-rg --query "[?name=='DOCKER_CUSTOM_IMAGE_NAME' || name=='DOCKER_REGISTRY_SERVER_URL']" -o table

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Checking Deployment Status" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check the actual running container
az webapp show --name eduflow-frontend --resource-group eduflow-rg --query "{state: state, defaultHostName: defaultHostName}" -o table

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Recent Deployment Logs (last 100 lines)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Get recent logs
az webapp log download --name eduflow-frontend --resource-group eduflow-rg --log-file frontend-logs.zip
Write-Host "Logs downloaded to: frontend-logs.zip" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Testing Frontend Endpoint" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "https://eduflow-frontend.azurewebsites.net" -UseBasicParsing -TimeoutSec 10
    Write-Host "Frontend Status: $($response.StatusCode)" -ForegroundColor Green
    
    # Check if the response contains localhost:3000
    if ($response.Content -match "localhost:3000") {
        Write-Host "WARNING: Response still contains localhost:3000" -ForegroundColor Red
    } else {
        Write-Host "Good: No localhost:3000 found in response" -ForegroundColor Green
    }
} catch {
    Write-Host "Error accessing frontend: $_" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Recommendation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "If the container image is not build 15, run:" -ForegroundColor Yellow
Write-Host "az webapp restart --name eduflow-frontend --resource-group eduflow-rg" -ForegroundColor White
