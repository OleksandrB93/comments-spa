#!/bin/bash

# Comments SPA Deployment Script for Virtual Machine
# This script automates the deployment process on a VM

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

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        warn "Running as root. Consider using a non-root user for better security."
    fi
}

# Check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check if Docker Compose is installed
    if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if Git is installed
    if ! command -v git &> /dev/null; then
        error "Git is not installed. Please install Git first."
    fi
    
    # Check available disk space (at least 5GB)
    available_space=$(df / | awk 'NR==2 {print $4}')
    if [ "$available_space" -lt 5242880 ]; then  # 5GB in KB
        warn "Low disk space. At least 5GB is recommended."
    fi
    
    # Check available memory (at least 2GB)
    available_memory=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    if [ "$available_memory" -lt 2048 ]; then
        warn "Low available memory. At least 2GB is recommended."
    fi
    
    log "System requirements check completed."
}

# Install Docker and Docker Compose if not present
install_docker() {
    log "Installing Docker and Docker Compose..."
    
    # Update package index
    sudo apt-get update
    
    # Install required packages
    sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Set up the stable repository
    ARCH=$(dpkg --print-architecture)
    CODENAME=$(lsb_release -cs)
    echo "deb [arch=${ARCH} signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu ${CODENAME} stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    
    # Install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    log "Docker installation completed. Please log out and log back in for group changes to take effect."
}

# Setup environment
setup_environment() {
    log "Setting up environment..."
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        if [ -f env.example ]; then
            cp env.example .env
            warn "Created .env file from template. Please edit it with your actual values."
        else
            error "No environment template found. Please create .env file manually."
        fi
    fi
    
    # Create uploads directory
    mkdir -p uploads
    
    # Create SSL directory for certificates
    mkdir -p ssl
    
    log "Environment setup completed."
}

# Get VM IP address
get_vm_ip() {
    # Try to get the primary IP address
    VM_IP=$(hostname -I | awk '{print $1}')
    
    if [ -z "$VM_IP" ]; then
        VM_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "localhost")
        # Clean up any whitespace or newlines
        VM_IP=$(echo "$VM_IP" | tr -d '\n\r\t ')
    fi
    
    info "Detected VM IP: $VM_IP"
    echo "$VM_IP"
}

# Update environment with VM IP
update_env_with_ip() {
    local vm_ip=$1
    
    if [ -f .env ]; then
        # Use perl for more reliable string replacement
        perl -i -pe "s/your-domain\.com/$vm_ip/g" .env
        perl -i -pe "s/localhost/$vm_ip/g" .env
        
        # Ensure NODE_ENV is set to production
        if ! grep -q "NODE_ENV=production" .env; then
            echo "NODE_ENV=production" >> .env
        fi
        
        log "Updated .env file with VM IP: $vm_ip"
        info "Environment variables updated:"
        info "  FRONTEND_URL=http://$vm_ip:3000"
        info "  VITE_APP_API_URL=http://$vm_ip:3001/graphql"
        info "  VITE_WS_URL=ws://$vm_ip:3001"
    fi
}

# Determine Docker Compose command
get_docker_compose_cmd() {
    if docker compose version &> /dev/null; then
        echo "docker compose"
    elif command -v docker-compose &> /dev/null; then
        echo "docker-compose"
    else
        error "Docker Compose is not available"
    fi
}

# Build and start services
deploy_services() {
    log "Building and starting services..."
    
    # Get the correct Docker Compose command
    DOCKER_COMPOSE_CMD=$(get_docker_compose_cmd)
    info "Using Docker Compose command: $DOCKER_COMPOSE_CMD"
    
    # Stop any existing containers
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml down 2>/dev/null || true
    
    # Build images
    log "Building Docker images..."
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml build --no-cache
    
    # Start services
    log "Starting services..."
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml up -d
    
    # Wait for services to be ready
    log "Waiting for services to start..."
    sleep 30
    
    # Check if services are running
    if $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml ps | grep -q "Up"; then
        log "Services started successfully!"
        
        # Wait a bit more for WebSocket to be ready
        log "Waiting for WebSocket to be ready..."
        sleep 10
        
        # Test WebSocket connection
        log "Testing WebSocket connection..."
        if command -v curl &> /dev/null; then
            # Test if backend is responding
            if curl -s "http://localhost:3001/graphql" > /dev/null; then
                log "Backend is responding correctly"
            else
                warn "Backend might not be ready yet"
            fi
        fi
    else
        error "Some services failed to start. Check logs with: docker compose -f docker-compose.prod.yml logs"
    fi
}

# Setup firewall
setup_firewall() {
    log "Setting up firewall..."
    
    # Check if ufw is available
    if command -v ufw &> /dev/null; then
        # Allow SSH
        sudo ufw allow ssh
        
        # Allow HTTP and HTTPS
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        
        # Allow application ports (optional, for direct access)
        sudo ufw allow 3000/tcp
        sudo ufw allow 3001/tcp
        
        # Enable firewall
        sudo ufw --force enable
        
        log "Firewall configured successfully."
    else
        warn "UFW not available. Please configure firewall manually."
    fi
}

# Show deployment information
show_deployment_info() {
    local vm_ip=$1
    
    log "Deployment completed successfully!"
    echo ""
    echo "=========================================="
    echo "🚀 Application URLs:"
    echo "=========================================="
    echo "Frontend:     http://$vm_ip:3000"
    echo "Backend API:  http://$vm_ip:3001/graphql"
    echo "WebSocket:    ws://$vm_ip:3001"
    echo ""
    echo "=========================================="
    echo "🔧 Management URLs:"
    echo "=========================================="
    echo "RabbitMQ:     http://$vm_ip:15672"
    echo "Elasticsearch: http://$vm_ip:9200"
    echo ""
    echo "=========================================="
    echo "📋 Useful Commands:"
    echo "=========================================="
    echo "View logs:    docker compose -f docker-compose.prod.yml logs -f"
    echo "Stop:         docker compose -f docker-compose.prod.yml down"
    echo "Restart:      docker compose -f docker-compose.prod.yml restart"
    echo "Status:       docker compose -f docker-compose.prod.yml ps"
    echo ""
    echo "=========================================="
    echo "🔒 Security Notes:"
    echo "=========================================="
    echo "1. Change default passwords in .env file"
    echo "2. Configure SSL certificates for HTTPS"
    echo "3. Set up proper domain name"
    echo "4. Configure backup strategy"
    echo ""
    echo "=========================================="
    echo "🔌 WebSocket Configuration:"
    echo "=========================================="
    echo "WebSocket will automatically connect to: ws://$vm_ip:3001"
    echo "If you have issues with WebSocket:"
    echo "1. Check browser console for connection errors"
    echo "2. Verify firewall allows port 3001"
    echo "3. Check backend logs: docker compose -f docker-compose.prod.yml logs backend"
    echo ""
}

# Main deployment function
main() {
    echo "=========================================="
    echo "🚀 Comments SPA VM Deployment Script"
    echo "=========================================="
    echo ""
    
    # Check if running as root
    check_root
    
    # Check requirements
    check_requirements
    
    # Ask if Docker should be installed
    if ! command -v docker &> /dev/null; then
        read -p "Docker is not installed. Do you want to install it? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_docker
            error "Docker installed. Please log out and log back in, then run this script again."
        else
            error "Docker is required for deployment."
        fi
    fi
    
    # Get VM IP
    VM_IP=$(get_vm_ip)
    
    # Setup environment
    setup_environment
    
    # Update environment with IP
    update_env_with_ip "$VM_IP"
    
    # Deploy services
    deploy_services
    
    # Setup firewall
    setup_firewall
    
    # Show deployment info
    show_deployment_info "$VM_IP"
}

# Run main function
main "$@"
