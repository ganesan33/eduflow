# Azure Deployment Script for EduFlow (PowerShell)
# This script automates the Docker build and push process

# Configuration - UPDATE THESE VALUES
$REGISTRY_NAME = "your-registry-name"  # e.g., eduflowregistry
$RESOURCE_GROUP = "eduflow-rg"
$BACKEND_APP_NAME = "eduflow-backend"
$FRONTEND_APP_NAME = "eduflow-frontend"
$BACKEND_URL = "https://$BACKEND_APP_NAME.azurewebsites.net"
$FRONTEND_URL = "https://$FRONTEND_APP_NAME.azurewebsites.net"

Write-Host "=== EduFlow Azure Deployment Script ===" -ForegroundColor Green
Write-Host ""

# Check if registry name is set
if ($REGISTRY_NAME -eq "your-registry-name") {
    Write-Host "ERROR: Please update REGISTRY_NAME in this script" -ForegroundColor Red
    exit 1
}

# Step 1: Login to Azure
Write-Host "Step 1: Logging in to Azure..." -ForegroundColor Yellow
az login

# Step 2: Login to ACR
Write-Host "`nStep 2: Logging in to Azure Container Registry..." -ForegroundColor Yellow
az acr login --name $REGISTRY_NAME

# Step 3: Build Backend Image
Write-Host "`nStep 3: Building backend Docker image..." -ForegroundColor Yellow
Set-Location backend
docker build -t eduflow-backend:latest .
Set-Location ..

# Step 4: Build Frontend Image
Write-Host "`nStep 4: Building frontend Docker image..." -ForegroundColor Yellow
Set-Location frontend
docker build --build-arg VITE_API_URL=$BACKEND_URL -t eduflow-frontend:latest .
Set-Location ..

# Step 5: Tag Images
Write-Host "`nStep 5: Tagging Docker images..." -ForegroundColor Yellow
docker tag eduflow-backend:latest "$REGISTRY_NAME.azurecr.io/eduflow-backend:latest"
docker tag eduflow-frontend:latest "$REGISTRY_NAME.azurecr.io/eduflow-frontend:latest"

# Step 6: Push Images
Write-Host "`nStep 6: Pushing images to Azure Container Registry..." -ForegroundColor Yellow
docker push "$REGISTRY_NAME.azurecr.io/eduflow-backend:latest"
docker push "$REGISTRY_NAME.azurecr.io/eduflow-frontend:latest"

# Step 7: Restart App Services (if they exist)
Write-Host "`nStep 7: Restarting App Services..." -ForegroundColor Yellow
try {
    az webapp show --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Restarting backend..."
        az webapp restart --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP
    }
} catch {
    Write-Host "Backend app service not found. Skipping restart." -ForegroundColor Yellow
}

try {
    az webapp show --name $FRONTEND_APP_NAME --resource-group $RESOURCE_GROUP 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Restarting frontend..."
        az webapp restart --name $FRONTEND_APP_NAME --resource-group $RESOURCE_GROUP
    }
} catch {
    Write-Host "Frontend app service not found. Skipping restart." -ForegroundColor Yellow
}

Write-Host "`n=== Deployment Complete! ===" -ForegroundColor Green
Write-Host "`nBackend URL: $BACKEND_URL"
Write-Host "Frontend URL: $FRONTEND_URL"
Write-Host "`nVerify deployment:"
Write-Host "  Backend health: curl $BACKEND_URL/api/health"
Write-Host "  Frontend: Open $FRONTEND_URL in browser"
