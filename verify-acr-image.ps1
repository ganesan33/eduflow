# Verify the actual Docker image in ACR has the correct build

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Checking ACR Image Build History" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# List recent builds
az acr repository show-tags --name eduflowregistry --repository eduflow-frontend --orderby time_desc --output table

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Checking Image Manifest for Build 15" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

az acr repository show --name eduflowregistry --image eduflow-frontend:15

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Pulling and Inspecting Image Locally" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Login to ACR
az acr login --name eduflowregistry

Write-Host "`nPulling image..." -ForegroundColor Yellow
docker pull eduflowregistry.azurecr.io/eduflow-frontend:15

Write-Host "`nInspecting image history..." -ForegroundColor Yellow
docker history eduflowregistry.azurecr.io/eduflow-frontend:15 --no-trunc

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Testing Image Locally" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Starting container on port 8080..." -ForegroundColor Yellow
docker run -d -p 8080:80 --name test-frontend eduflowregistry.azurecr.io/eduflow-frontend:15

Start-Sleep -Seconds 5

Write-Host "`nFetching content from local container..." -ForegroundColor Yellow
try {
    $html = Invoke-WebRequest -Uri "http://localhost:8080" -UseBasicParsing
    $scriptMatches = [regex]::Matches($html.Content, '<script[^>]*src="([^"]+)"')
    $mainScript = $scriptMatches | Where-Object { $_.Groups[1].Value -match "index.*\.js" } | Select-Object -First 1
    
    if ($mainScript) {
        $scriptUrl = "http://localhost:8080" + $mainScript.Groups[1].Value
        $jsContent = Invoke-WebRequest -Uri $scriptUrl -UseBasicParsing
        
        Write-Host "`nChecking for API URLs in bundle..." -ForegroundColor Yellow
        if ($jsContent.Content -match "localhost:3000") {
            Write-Host "❌ IMAGE IS WRONG: localhost:3000 found in ACR image!" -ForegroundColor Red
            Write-Host "The Docker image itself was built incorrectly!" -ForegroundColor Red
            Write-Host "`nThe build argument was NOT passed correctly during docker build." -ForegroundColor Yellow
        } else {
            Write-Host "✅ IMAGE IS CORRECT: No localhost:3000" -ForegroundColor Green
            
            if ($jsContent.Content -match "eduflow-backend\.azurewebsites\.net") {
                Write-Host "✅ CORRECT API URL: eduflow-backend.azurewebsites.net found!" -ForegroundColor Green
            }
        }
    }
} catch {
    Write-Host "Error testing local container: $_" -ForegroundColor Red
}

Write-Host "`nCleaning up..." -ForegroundColor Yellow
docker stop test-frontend
docker rm test-frontend

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Analysis Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
