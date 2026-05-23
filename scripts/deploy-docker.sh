#!/bin/bash

# By Import - Docker Deployment Script
# Usage: ./scripts/deploy-docker.sh [build|run|stop|logs|push]

set -e

DOCKER_IMAGE="by-import:latest"
DOCKER_REGISTRY="your-registry"
CONTAINER_NAME="by-import-prod"
PORT=3000

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

function log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

function log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

function check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    log_info "Docker version: $(docker --version)"
}

function build() {
    log_info "Building Docker image: $DOCKER_IMAGE"
    
    if [ ! -f Dockerfile ]; then
        log_error "Dockerfile not found"
        exit 1
    fi
    
    docker build -t "$DOCKER_IMAGE" .
    
    if [ $? -eq 0 ]; then
        log_info "Docker image built successfully"
    else
        log_error "Docker build failed"
        exit 1
    fi
}

function run() {
    log_info "Starting container: $CONTAINER_NAME"
    
    # Stop existing container if running
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_warn "Container already exists, removing..."
        docker rm -f "$CONTAINER_NAME"
    fi
    
    # Load environment variables
    if [ ! -f .env.production ]; then
        log_error ".env.production not found"
        exit 1
    fi
    
    # Run container
    docker run -d \
        --name "$CONTAINER_NAME" \
        --env-file .env.production \
        -p $PORT:3000 \
        -v /data/by-import:/app/data \
        -v /logs/by-import:/app/logs \
        --restart unless-stopped \
        --health-cmd="curl -f http://localhost:3000/ || exit 1" \
        --health-interval=30s \
        --health-timeout=10s \
        --health-retries=3 \
        "$DOCKER_IMAGE"
    
    if [ $? -eq 0 ]; then
        log_info "Container started successfully"
        sleep 2
        log_info "Checking container health..."
        if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
            log_info "Container is running"
            docker logs "$CONTAINER_NAME" | head -20
        else
            log_error "Container failed to start"
            docker logs "$CONTAINER_NAME"
            exit 1
        fi
    else
        log_error "Failed to start container"
        exit 1
    fi
}

function stop() {
    log_info "Stopping container: $CONTAINER_NAME"
    
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        docker stop "$CONTAINER_NAME"
        log_info "Container stopped"
    else
        log_warn "Container is not running"
    fi
}

function logs() {
    log_info "Fetching logs from $CONTAINER_NAME..."
    docker logs -f "$CONTAINER_NAME"
}

function push() {
    if [ -z "$DOCKER_REGISTRY" ]; then
        log_error "DOCKER_REGISTRY not set"
        exit 1
    fi
    
    log_info "Pushing image to registry: $DOCKER_REGISTRY"
    docker tag "$DOCKER_IMAGE" "$DOCKER_REGISTRY/$DOCKER_IMAGE"
    docker push "$DOCKER_REGISTRY/$DOCKER_IMAGE"
    
    if [ $? -eq 0 ]; then
        log_info "Image pushed successfully"
    else
        log_error "Failed to push image"
        exit 1
    fi
}

function health_check() {
    log_info "Performing health check..."
    
    for i in {1..30}; do
        if curl -f http://localhost:$PORT/ > /dev/null 2>&1; then
            log_info "Health check passed"
            return 0
        fi
        log_warn "Health check attempt $i/30..."
        sleep 2
    done
    
    log_error "Health check failed"
    return 1
}

# Main
check_docker

case "${1:-build}" in
    build)
        build
        ;;
    run)
        run
        health_check
        ;;
    stop)
        stop
        ;;
    logs)
        logs
        ;;
    push)
        push
        ;;
    restart)
        stop
        run
        health_check
        ;;
    *)
        echo "Usage: $0 {build|run|stop|logs|push|restart}"
        echo ""
        echo "Commands:"
        echo "  build   - Build Docker image"
        echo "  run     - Start container"
        echo "  stop    - Stop container"
        echo "  logs    - View container logs"
        echo "  push    - Push image to registry"
        echo "  restart - Restart container"
        exit 1
        ;;
esac

log_info "Done!"
