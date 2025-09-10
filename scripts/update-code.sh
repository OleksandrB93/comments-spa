#!/bin/bash

# Comments SPA - Code Update Script
# This script updates the code on VPS without rebuilding containers

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Check if we're in the right directory
check_directory() {
    if [ ! -f "docker-compose.prod.yml" ]; then
        error "docker-compose.prod.yml not found. Please run this script from the project root directory."
    fi
}

# Get the correct Docker Compose command
get_docker_compose_cmd() {
    if docker compose version &> /dev/null; then
        echo "docker compose"
    elif command -v docker-compose &> /dev/null; then
        echo "docker-compose"
    else
        error "Docker Compose is not available"
    fi
}

# Pull latest code from Git
pull_latest_code() {
    log "Pulling latest code from Git..."
    
    # Check if we're in a git repository
    if [ ! -d ".git" ]; then
        error "Not a git repository. Please clone the repository first."
    fi
    
    # Stash any local changes
    git stash push -m "Auto-stash before update $(date)" || true
    
    # Pull latest changes
    git pull origin main
    
    log "Code updated successfully"
}

# Install/update dependencies
update_dependencies() {
    log "Updating dependencies..."
    
    # Update backend dependencies
    if [ -f "backend/package.json" ]; then
        log "Updating backend dependencies..."
        cd backend
        npm ci --only=production
        cd ..
    fi
    
    # Update frontend dependencies
    if [ -f "frontend/package.json" ]; then
        log "Updating frontend dependencies..."
        cd frontend
        npm ci --only=production
        cd ..
    fi
    
    log "Dependencies updated successfully"
}

# Build applications
build_applications() {
    log "Building applications..."
    
    # Build backend
    if [ -f "backend/package.json" ]; then
        log "Building backend..."
        cd backend
        npm run build
        cd ..
    fi
    
    # Build frontend
    if [ -f "frontend/package.json" ]; then
        log "Building frontend..."
        cd frontend
        npm run build
        cd ..
    fi
    
    log "Applications built successfully"
}

# Restart services without rebuilding containers
restart_services() {
    log "Restarting services..."
    
    DOCKER_COMPOSE_CMD=$(get_docker_compose_cmd)
    
    # Restart only the application containers (not databases)
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml restart backend frontend
    
    # Wait for services to be ready
    log "Waiting for services to start..."
    sleep 10
    
    # Check if services are running
    if $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml ps | grep -q "Up"; then
        log "Services restarted successfully!"
    else
        error "Some services failed to restart. Check logs with: $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml logs"
    fi
}

# Test the deployment
test_deployment() {
    log "Testing deployment..."
    
    # Wait a bit more for services to be fully ready
    sleep 5
    
    # Test backend
    if command -v curl &> /dev/null; then
        if curl -s "http://localhost:3001/graphql" > /dev/null; then
            log "Backend is responding correctly"
        else
            warn "Backend might not be ready yet"
        fi
    fi
    
    # Test frontend
    if command -v curl &> /dev/null; then
        if curl -s "http://localhost:3000" > /dev/null; then
            log "Frontend is responding correctly"
        else
            warn "Frontend might not be ready yet"
        fi
    fi
}

# Show deployment status
show_status() {
    log "Deployment completed successfully!"
    echo ""
    echo "=========================================="
    echo "🚀 Application Status:"
    echo "=========================================="
    
    DOCKER_COMPOSE_CMD=$(get_docker_compose_cmd)
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml ps
    
    echo ""
    echo "=========================================="
    echo "📋 Useful Commands:"
    echo "=========================================="
    echo "View logs:    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml logs -f"
    echo "Status:       $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml ps"
    echo "Restart:      $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml restart"
    echo ""
}

# Main update function
main() {
    echo "=========================================="
    echo "🔄 Comments SPA - Code Update Script"
    echo "=========================================="
    echo ""
    
    # Check directory
    check_directory
    
    # Pull latest code
    pull_latest_code
    
    # Update dependencies
    update_dependencies
    
    # Build applications
    build_applications
    
    # Restart services
    restart_services
    
    # Test deployment
    test_deployment
    
    # Show status
    show_status
}

# Run main function
main "$@"
