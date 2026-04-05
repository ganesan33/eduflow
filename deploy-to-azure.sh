#!/bin/bash

# Azure Deployment Script for EduFlow
# This script automates the Docker build and push process

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - UPDATE THESE VALUES
REGISTRY_NAME="eduflowregistry"  # e.g., eduflowregistry
RESOURCE_GROUP="eduflow-rg"
BACKEND_APP_NAME="eduflow-backend"
FRONTEND_APP_NAME="eduflow-frontend"
BACKEND_URL="https://${BACKEND_APP_NAME}.azurewebsites.net"
FRONTEND_URL="https://${FRONTEND_APP_NAME}.azurewebsites.net"

echo -e "${GREEN}=== EduFlow Azure Deployment Script ===${NC}\n"

# Check if registry name is set
if [ "$REGISTRY_NAME" = "your-registry-name" ]; then
    echo -e "${RED}ERROR: Please update REGISTRY_NAME in this script${NC}"
    exit 1
fi

# Important note about frontend URL
echo -e "${BLUE}IMPORTANT: Frontend will be built with backend URL: ${BACKEND_URL}${NC}"
echo -e "${BLUE}Make sure this matches your actual backend App Service name!${NC}"
echo -e "${YELLOW}If the backend name is already taken in Azure, you'll need to:${NC}"
echo -e "${YELLOW}  1. Change BACKEND_APP_NAME in this script${NC}"
echo -e "${YELLOW}  2. Run this script again to rebuild with the new URL${NC}\n"

read -p "Continue with these settings? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi

# Step 1: Login to Azure
echo -e "${YELLOW}Step 1: Logging in to Azure...${NC}"
az login

# Step 2: Login to ACR
echo -e "\n${YELLOW}Step 2: Logging in to Azure Container Registry...${NC}"
az acr login --name $REGISTRY_NAME

# Step 3: Build Backend Image
echo -e "\n${YELLOW}Step 3: Building backend Docker image...${NC}"
cd backend
docker build -t eduflow-backend:latest .
cd ..

# Step 4: Build Frontend Image
echo -e "\n${YELLOW}Step 4: Building frontend Docker image with backend URL...${NC}"
echo -e "${BLUE}Backend URL being embedded: ${BACKEND_URL}${NC}"
cd frontend
docker build --build-arg VITE_API_URL=$BACKEND_URL -t eduflow-frontend:latest .
cd ..
echo -e "${GREEN}Frontend built successfully with backend URL: ${BACKEND_URL}${NC}"

# Step 5: Tag Images
echo -e "\n${YELLOW}Step 5: Tagging Docker images...${NC}"
docker tag eduflow-backend:latest ${REGISTRY_NAME}.azurecr.io/eduflow-backend:latest
docker tag eduflow-frontend:latest ${REGISTRY_NAME}.azurecr.io/eduflow-frontend:latest

# Step 6: Push Images
echo -e "\n${YELLOW}Step 6: Pushing images to Azure Container Registry...${NC}"
docker push ${REGISTRY_NAME}.azurecr.io/eduflow-backend:latest
docker push ${REGISTRY_NAME}.azurecr.io/eduflow-frontend:latest

# Step 7: Restart App Services (if they exist)
echo -e "\n${YELLOW}Step 7: Restarting App Services...${NC}"
if az webapp show --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo "Restarting backend..."
    az webapp restart --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP
else
    echo -e "${YELLOW}Backend app service not found. Skipping restart.${NC}"
fi

if az webapp show --name $FRONTEND_APP_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo "Restarting frontend..."
    az webapp restart --name $FRONTEND_APP_NAME --resource-group $RESOURCE_GROUP
else
    echo -e "${YELLOW}Frontend app service not found. Skipping restart.${NC}"
fi

echo -e "\n${GREEN}=== Deployment Complete! ===${NC}"
echo -e "\nBackend URL: ${BACKEND_URL}"
echo -e "Frontend URL: ${FRONTEND_URL}"
echo -e "\nVerify deployment:"
echo -e "  Backend health: curl ${BACKEND_URL}/api/health"
echo -e "  Frontend: Open ${FRONTEND_URL} in browser"
