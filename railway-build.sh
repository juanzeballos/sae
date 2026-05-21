#!/bin/bash
set -e

# Instalar Node.js 18 via nvm
export NVM_DIR="$HOME/.nvm"
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 22
nvm use 22

# Build frontend
cd frontend
npm install
npm run build
cd ..

# Copiar frontend al backend
mkdir -p backend/src/main/resources/static
cp -r frontend/dist/* backend/src/main/resources/static/

# Build backend
cd backend
./mvnw clean package -DskipTests
