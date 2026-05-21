#!/bin/bash
set -e

# Build frontend
cd frontend
npm install
npm run build
cd ..

# Copy frontend build to backend static
mkdir -p backend/src/main/resources/static
cp -r frontend/dist/* backend/src/main/resources/static/

# Build backend
cd backend
mvn clean package -DskipTests
