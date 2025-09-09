#!/bin/bash

# Security Setup Script for Comments SPA on VM
# This script configures security settings for production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Generate strong passwords
generate_password() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# Generate JWT secret
generate_jwt_secret() {
    openssl rand -hex 64
}

# Update environment with secure passwords
update_env_security() {
    log "Updating environment with secure passwords..."
    
    if [ ! -f .env ]; then
        error ".env file not found. Please run deploy.sh first."
    fi
    
    # Generate secure passwords
    MONGO_PASSWORD=$(generate_password 24)
    REDIS_PASSWORD=$(generate_password 24)
    RABBITMQ_PASSWORD=$(generate_password 24)
    JWT_SECRET=$(generate_jwt_secret)
    
    # Update .env file
    sed -i "s/change-this-strong-password/$MONGO_PASSWORD/g" .env
    sed -i "s/change-this-redis-password/$REDIS_PASSWORD/g" .env
    sed -i "s/change-this-rabbitmq-password/$RABBITMQ_PASSWORD/g" .env
    sed -i "s/your-super-secret-jwt-key-change-this-in-production-very-important/$JWT_SECRET/g" .env
    
    log "Environment updated with secure passwords."
}

# Configure SSH security
configure_ssh() {
    log "Configuring SSH security..."
    
    # Backup original SSH config
    sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
    
    # Update SSH configuration
    sudo tee -a /etc/ssh/sshd_config > /dev/null << EOF

# Security enhancements
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
PermitEmptyPasswords no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
EOF
    
    # Restart SSH service
    sudo systemctl restart ssh
    
    log "SSH security configured."
}

# Setup fail2ban
setup_fail2ban() {
    log "Setting up fail2ban..."
    
    # Install fail2ban
    sudo apt-get update
    sudo apt-get install -y fail2ban
    
    # Create jail.local configuration
    sudo tee /etc/fail2ban/jail.local > /dev/null << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF
    
    # Start and enable fail2ban
    sudo systemctl enable fail2ban
    sudo systemctl start fail2ban
    
    log "Fail2ban configured and started."
}

# Configure automatic security updates
setup_auto_updates() {
    log "Setting up automatic security updates..."
    
    # Install unattended-upgrades
    sudo apt-get install -y unattended-upgrades
    
    # Configure automatic updates
    sudo tee /etc/apt/apt.conf.d/50unattended-upgrades > /dev/null << EOF
Unattended-Upgrade::Allowed-Origins {
    "\${distro_id}:\${distro_codename}-security";
    "\${distro_id}ESMApps:\${distro_codename}-apps-security";
    "\${distro_id}ESM:\${distro_codename}-infra-security";
};

Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF
    
    # Enable automatic updates
    sudo tee /etc/apt/apt.conf.d/20auto-upgrades > /dev/null << EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF
    
    log "Automatic security updates configured."
}

# Setup log monitoring
setup_log_monitoring() {
    log "Setting up log monitoring..."
    
    # Create log monitoring script
    sudo tee /usr/local/bin/monitor-logs.sh > /dev/null << 'EOF'
#!/bin/bash

# Simple log monitoring script
LOG_FILE="/var/log/security-monitor.log"
DOCKER_LOGS="/var/log/docker-logs.log"

# Monitor Docker logs for errors
docker-compose -f /path/to/your/project/docker-compose.prod.yml logs --tail=100 2>&1 | grep -i error >> $DOCKER_LOGS

# Monitor system logs for suspicious activity
grep -i "failed\|error\|denied" /var/log/auth.log | tail -10 >> $LOG_FILE
grep -i "failed\|error" /var/log/syslog | tail -10 >> $LOG_FILE

# Clean old logs (keep last 1000 lines)
tail -1000 $LOG_FILE > $LOG_FILE.tmp && mv $LOG_FILE.tmp $LOG_FILE
tail -1000 $DOCKER_LOGS > $DOCKER_LOGS.tmp && mv $DOCKER_LOGS.tmp $DOCKER_LOGS
EOF
    
    sudo chmod +x /usr/local/bin/monitor-logs.sh
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "*/15 * * * * /usr/local/bin/monitor-logs.sh") | crontab -
    
    log "Log monitoring configured."
}

# Configure Docker security
configure_docker_security() {
    log "Configuring Docker security..."
    
    # Create Docker daemon configuration
    sudo mkdir -p /etc/docker
    sudo tee /etc/docker/daemon.json > /dev/null << EOF
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    },
    "live-restore": true,
    "userland-proxy": false,
    "no-new-privileges": true
}
EOF
    
    # Restart Docker
    sudo systemctl restart docker
    
    log "Docker security configured."
}

# Setup backup script
setup_backup() {
    log "Setting up backup script..."
    
    # Create backup script
    sudo tee /usr/local/bin/backup-app.sh > /dev/null << 'EOF'
#!/bin/bash

BACKUP_DIR="/backups"
APP_DIR="/path/to/your/project"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup application data
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C $APP_DIR .

# Backup database
docker-compose -f $APP_DIR/docker-compose.prod.yml exec -T mongodb mongodump --archive | gzip > $BACKUP_DIR/mongodb_backup_$DATE.gz

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF
    
    sudo chmod +x /usr/local/bin/backup-app.sh
    
    # Add to crontab (daily backup at 2 AM)
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-app.sh") | crontab -
    
    log "Backup script configured."
}

# Main security setup function
main() {
    echo "=========================================="
    echo "🔒 Comments SPA Security Setup"
    echo "=========================================="
    echo ""
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons."
    fi
    
    # Update environment with secure passwords
    update_env_security
    
    # Configure SSH security
    read -p "Configure SSH security? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        configure_ssh
    fi
    
    # Setup fail2ban
    read -p "Setup fail2ban for intrusion prevention? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_fail2ban
    fi
    
    # Setup automatic updates
    read -p "Setup automatic security updates? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_auto_updates
    fi
    
    # Setup log monitoring
    read -p "Setup log monitoring? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_log_monitoring
    fi
    
    # Configure Docker security
    configure_docker_security
    
    # Setup backup
    read -p "Setup automated backups? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_backup
    fi
    
    log "Security setup completed!"
    echo ""
    echo "=========================================="
    echo "🔒 Security Recommendations:"
    echo "=========================================="
    echo "1. Set up SSH key authentication"
    echo "2. Configure SSL certificates for HTTPS"
    echo "3. Set up a domain name and DNS"
    echo "4. Configure monitoring and alerting"
    echo "5. Regular security audits"
    echo "6. Keep all software updated"
    echo ""
}

# Run main function
main "$@"
