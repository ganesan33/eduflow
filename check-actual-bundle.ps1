# Check what's actually being served by the frontend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fetching Actual Frontend HTML" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$html = Invoke-WebRequest -Uri "https://eduflow-frontend.azurewebsites.net" -UseBasicParsing
Write-Host "HTML Content Length: $($html.Content.Length)" -ForegroundColor Yellow

# Extract script tags to find the main JS bundle
$scriptMatches = [regex]::Matches($html.Content, '<script[^>]*src="([^"]+)"')
Write-Host "`nJavaScript Bundles Found:" -ForegroundColor Yellow
foreach ($match in $scriptMatches) {
    $scriptSrc = $match.Groups[1].Value
    Write-Host "  - $scriptSrc" -ForegroundColor White
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Checking Main JS Bundle for API URL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Find the main index JS file
$mainScript = $scriptMatches | Where-Object { $_.Groups[1].Value -match "index.*\.js" } | Select-Object -First 1

if ($mainScript) {
    $scriptUrl = "https://eduflow-frontend.azurewebsites.net" + $mainScript.Groups[1].Value
    Write-Host "Fetching: $scriptUrl" -ForegroundColor Yellow
    
    try {
        $jsContent = Invoke-WebRequest -Uri $scriptUrl -UseBasicParsing
        Write-Host "JS Bundle Size: $($jsContent.Content.Length) bytes" -ForegroundColor Yellow
        
        # Check for localhost:3000
        if ($jsContent.Content -match "localhost:3000") {
            Write-Host "`n❌ FOUND: localhost:3000 in the bundle!" -ForegroundColor Red
            Write-Host "The deployed build is WRONG!" -ForegroundColor Red
        } else {
            Write-Host "`n✅ No localhost:3000 found" -ForegroundColor Green
        }
        
        # Check for the correct backend URL
        if ($jsContent.Content -match "eduflow-backend\.azurewebsites\.net") {
            Write-Host "✅ FOUND: eduflow-backend.azurewebsites.net" -ForegroundColor Green
        } else {
            Write-Host "❌ NOT FOUND: eduflow-backend.azurewebsites.net" -ForegroundColor Red
        }
        
        # Show a snippet around any API URL references
        Write-Host "`nSearching for API URL patterns..." -ForegroundColor Yellow
        $apiMatches = [regex]::Matches($jsContent.Content, '.{0,100}(localhost:3000|eduflow-backend\.azurewebsites\.net|VITE_API_URL).{0,100}')
        if ($apiMatches.Count -gt 0) {
            Write-Host "Found $($apiMatches.Count) API URL reference(s):" -ForegroundColor Yellow
            foreach ($match in $apiMatches | Select-Object -First 3) {
                Write-Host "  Context: $($match.Value)" -ForegroundColor White
            }
        }
        
    } catch {
        Write-Host "Error fetching JS bundle: $_" -ForegroundColor Red
    }
} else {
    Write-Host "Could not find main JS bundle in HTML" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Checking Deployed Container Image" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

az webapp config container show --name eduflow-frontend --resource-group eduflow-rg --query "[?name=='DOCKER_CUSTOM_IMAGE_NAME'].value" -o tsv
