#!/bin/bash

# By Import - Environment Setup Script
# Usage: ./scripts/setup-env.sh

set -e

echo "By Import - Environment Setup"
echo "=============================="
echo ""

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "Creating .env.production file..."
    cp .env.example .env.production 2>/dev/null || cat > .env.production << 'ENVEOF'
# Application
NODE_ENV=production
VITE_APP_NAME=By Import
VITE_APP_VERSION=1.0.0

# API Configuration
VITE_API_URL=https://api.byimport.com
VITE_APP_URL=https://byimport.com
VITE_LOG_LEVEL=info

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_TRACKING=true
VITE_ENABLE_SUPPORT_CHAT=true

# Third-party Services
VITE_STRIPE_PUBLIC_KEY=pk_live_...
VITE_GA_TRACKING_ID=G-...
VITE_SENTRY_DSN=https://...

# Security
VITE_SECURITY_HEADERS=true
VITE_CSP_ENABLED=true

# Performance
VITE_ENABLE_SERVICE_WORKER=true
VITE_CACHE_STRATEGY=aggressive
ENVEOF
    echo "✅ .env.production created"
else
    echo "✅ .env.production already exists"
fi

# Create necessary directories
echo ""
echo "Creating directories..."
mkdir -p dist
mkdir -p build
mkdir -p public/assets
echo "✅ Directories created"

# Verify Node.js version
echo ""
echo "Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ required, found $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v) is compatible"

# Verify npm
echo "Checking npm..."
npm -v > /dev/null 2>&1
echo "✅ npm $(npm -v) is installed"

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install
echo "✅ Dependencies installed"

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Review and update .env.production with your values"
echo "2. Run: npm run build"
echo "3. Run: ./scripts/deploy-docker.sh build"
echo "4. Run: ./scripts/deploy-docker.sh run"
