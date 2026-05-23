#!/bin/bash

# By Import - Netlify Deployment Script
# Usage: ./scripts/deploy-netlify.sh [setup|deploy|logs|status]

set -e

SITE_NAME="by-import"
SITE_ID="${NETLIFY_SITE_ID}"

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

function check_netlify_cli() {
    if ! command -v netlify &> /dev/null; then
        log_error "Netlify CLI is not installed"
        log_info "Install with: npm install -g netlify-cli"
        exit 1
    fi
    log_info "Netlify CLI version: $(netlify --version)"
}

function check_auth() {
    if [ ! -f ~/.netlify/state.json ]; then
        log_error "Not authenticated with Netlify"
        log_info "Run: netlify login"
        exit 1
    fi
}

function setup() {
    log_info "Setting up Netlify deployment..."
    
    check_netlify_cli
    check_auth
    
    # Create or link site
    if [ -z "$SITE_ID" ]; then
        log_info "Creating new Netlify site..."
        netlify init --name "$SITE_NAME" --build-dir=dist --functions=functions
    else
        log_info "Linking to existing site..."
        netlify link --id "$SITE_ID"
    fi
    
    log_info "Creating netlify.toml configuration..."
    cat > netlify.toml << 'NETLIFYEOF'
[build]
  command = "npm run build"
  functions = "functions"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "9"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production]
  command = "npm run build"
  environment = { NODE_ENV = "production" }

[context.deploy-preview]
  command = "npm run build"
  environment = { NODE_ENV = "staging" }

[context.branch-deploy]
  command = "npm run build"
  environment = { NODE_ENV = "development" }
NETLIFYEOF

    log_info "Netlify setup complete"
    log_info "Site ID: $(netlify status | grep 'Site ID' || echo 'Unknown')"
}

function deploy() {
    log_info "Deploying to Netlify..."
    
    check_netlify_cli
    check_auth
    
    # Build
    log_info "Building application..."
    npm run build
    
    if [ ! -d dist ]; then
        log_error "Build directory not found"
        exit 1
    fi
    
    # Deploy
    log_info "Uploading to Netlify..."
    netlify deploy --prod --dir=dist
    
    if [ $? -eq 0 ]; then
        log_info "Deployment successful!"
        netlify status
    else
        log_error "Deployment failed"
        exit 1
    fi
}

function logs() {
    log_info "Fetching Netlify logs..."
    netlify log
}

function status() {
    log_info "Checking Netlify status..."
    netlify status
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
    *)
        echo "Usage: $0 {setup|deploy|logs|status}"
        echo ""
        echo "Commands:"
        echo "  setup  - Setup Netlify deployment"
        echo "  deploy - Deploy to Netlify"
        echo "  logs   - View deployment logs"
        echo "  status - Check deployment status"
        exit 1
        ;;
esac

log_info "Done!"
