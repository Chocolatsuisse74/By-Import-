#!/bin/bash

# By Import - Vercel Deployment Script
# Usage: ./scripts/deploy-vercel.sh [setup|deploy|logs|status|rollback]

set -e

PROJECT_NAME="by-import"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

function log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

function log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

function log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

function check_vercel_cli() {
    if ! command -v vercel &> /dev/null; then
        log_error "Vercel CLI is not installed"
        log_info "Install with: npm install -g vercel"
        exit 1
    fi
    log_info "Vercel CLI version: $(vercel --version)"
}

function check_auth() {
    if [ ! -d ~/.vercel ]; then
        log_error "Not authenticated with Vercel"
        log_info "Run: vercel login"
        exit 1
    fi
}

function setup() {
    log_info "Setting up Vercel deployment..."
    
    check_vercel_cli
    check_auth
    
    log_info "Initializing Vercel project..."
    vercel --confirm
    
    log_info "Creating vercel.json configuration..."
    cat > vercel.json << 'VERCELEOF'
{
  "name": "by-import",
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "react",
  "nodeVersion": "18.x",
  "env": {
    "NODE_ENV": "production"
  },
  "envFile": [
    ".env.production"
  ],
  "regions": ["sfo1"],
  "functions": {
    "api/**": {
      "maxDuration": 30,
      "memory": 1024
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600, immutable"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
VERCELEOF

    log_info "Vercel setup complete"
    log_info "Project linked and configured"
}

function deploy() {
    log_info "Deploying to Vercel..."
    
    check_vercel_cli
    check_auth
    
    # Verify code is ready
    log_info "Building application..."
    npm run build
    
    # Deploy
    log_info "Deploying to production..."
    vercel --prod --confirm
    
    if [ $? -eq 0 ]; then
        log_info "Deployment successful!"
        vercel status
    else
        log_error "Deployment failed"
        exit 1
    fi
}

function logs() {
    log_info "Fetching Vercel logs..."
    vercel logs
}

function status() {
    log_info "Checking Vercel status..."
    vercel status
}

function rollback() {
    log_warn "Rolling back to previous deployment..."
    vercel rollback --confirm
    
    if [ $? -eq 0 ]; then
        log_info "Rollback successful"
    else
        log_error "Rollback failed"
        exit 1
    fi
}

# Main
case "${1:-deploy}" in
    setup)
        setup
        ;;
    deploy)
        deploy
        ;;
    logs)
        logs
        ;;
    status)
        status
        ;;
    rollback)
        rollback
        ;;
    *)
        echo "Usage: $0 {setup|deploy|logs|status|rollback}"
        echo ""
        echo "Commands:"
        echo "  setup    - Setup Vercel deployment"
        echo "  deploy   - Deploy to Vercel"
        echo "  logs     - View deployment logs"
        echo "  status   - Check deployment status"
        echo "  rollback - Rollback to previous deployment"
        exit 1
        ;;
esac

log_info "Done!"
