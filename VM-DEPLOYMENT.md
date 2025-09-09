# Comments SPA Virtual Machine Deployment

This document contains detailed instructions for deploying the Comments SPA project on a virtual machine.

## 📋 Prerequisites

### System Requirements

- **OS**: Ubuntu 20.04+ or CentOS 8+ (Ubuntu 22.04 LTS recommended)
- **RAM**: Minimum 2GB, 4GB+ recommended
- **Disk**: Minimum 10GB free space
- **CPU**: 2 cores
- **Network**: Public IP address or domain

### Required Ports

- **80** (HTTP)
- **443** (HTTPS)
- **22** (SSH)
- **3000** (Frontend, optional)
- **3001** (Backend API, optional)

## 🚀 Quick Start

### 1. Virtual Machine Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git unzip
```

### 2. Project Download

```bash
# Clone repository
git clone https://github.com/OleksandrB93/comments-spa.git
cd comments-spa

# Or download archive
wget <your-archive-url>
unzip comments-spa.zip
cd comments-spa
```

### 3. Automatic Deployment

```bash
# Run deployment script
./deploy.sh
```

The script automatically:

- Checks system requirements
- Installs Docker and Docker Compose (if needed)
- Sets up environment variables
- Builds and starts all services
- Configures firewall

### 4. Security Setup

```bash
# Run security script
./security-setup.sh
```

## 🔧 Manual Deployment

If you want to deploy the project manually:

### 1. Docker Installation

```bash
# Update packages
sudo apt update

# Install dependencies
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
```

**Important**: After installing Docker, you need to log out and log back in.

### 2. Environment Variables Setup

```bash
# Copy template
cp env.prod.example .env

# Edit file
nano .env
```

Required changes:

- `JWT_SECRET` - generate a strong key
- `MONGO_ROOT_PASSWORD` - password for MongoDB
- `REDIS_PASSWORD` - password for Redis
- `RABBITMQ_PASSWORD` - password for RabbitMQ
- `FRONTEND_URL` - your frontend URL
- `VITE_APP_API_URL` - API URL
- `VITE_APP_WS_URL` - WebSocket URL

### 3. Start Services

```bash
# Build and start
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

## 🌐 Domain and SSL Setup

### 1. Domain Configuration

If you have a domain:

```bash
# Update .env file
nano .env

# Change URLs to your domain
FRONTEND_URL=https://yourdomain.com
VITE_APP_API_URL=https://yourdomain.com/api/graphql
VITE_APP_WS_URL=wss://yourdomain.com/ws
```

### 2. SSL Certificate Installation

#### Using Let's Encrypt (free)

```bash
# Install Certbot
sudo apt install -y certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/*.pem
```

#### Update Nginx Configuration

Uncomment the HTTPS section in `nginx.conf` and update the domain.

### 3. Automatic Certificate Renewal

```bash
# Add to crontab
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && docker-compose -f docker-compose.prod.yml restart nginx") | crontab -
```

## 🔒 Security Configuration

### 1. Firewall

```bash
# Install UFW
sudo apt install -y ufw

# Configure rules
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

### 2. SSH Security

```bash
# Edit SSH configuration
sudo nano /etc/ssh/sshd_config

# Add or change:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3

# Restart SSH
sudo systemctl restart ssh
```

### 3. Fail2ban

```bash
# Install
sudo apt install -y fail2ban

# Configure
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## 📊 Monitoring and Logging

### 1. View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend

# System logs
sudo journalctl -f
```

### 2. Resource Monitoring

```bash
# Docker resource usage
docker stats

# Disk usage
df -h

# Memory usage
free -h

# System load
htop
```

## 🔄 Backup

### 1. Automatic Backup

```bash
# Create backup script
sudo nano /usr/local/bin/backup-app.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backups"
APP_DIR="/path/to/your/project"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup application data
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C $APP_DIR .

# Backup database
docker-compose -f $APP_DIR/docker-compose.prod.yml exec -T mongodb mongodump --archive | gzip > $BACKUP_DIR/mongodb_backup_$DATE.gz

# Clean old backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
```

```bash
# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-app.sh") | crontab -
```

## 🛠 Maintenance

### Useful Commands

```bash
# Restart services
docker-compose -f docker-compose.prod.yml restart

# Update images
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Clean unused images
docker system prune -a

# Check status
docker-compose -f docker-compose.prod.yml ps

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale backend=2
```

### Application Updates

```bash
# Get latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## 🚨 Troubleshooting

### Port Issues

```bash
# Check occupied ports
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :3001

# Stop services
docker-compose -f docker-compose.prod.yml down
```

### Database Issues

```bash
# Check MongoDB connection
docker-compose -f docker-compose.prod.yml exec mongodb mongosh --eval "db.adminCommand('ping')"

# Reset database
docker-compose -f docker-compose.prod.yml exec mongodb mongosh --eval "db.dropDatabase()" comments_db
```

### Memory Issues

```bash
# Increase swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Add to fstab
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 📞 Support

### Useful URLs After Deployment

- **Frontend**: http://your-vm-ip:3000
- **Backend API**: http://your-vm-ip:3001/graphql
- **GraphQL Playground**: http://your-vm-ip:3001/graphql
- **RabbitMQ Management**: http://your-vm-ip:15672
- **Elasticsearch**: http://your-vm-ip:9200

### Logs and Diagnostics

```bash
# View logs
make logs

# Service status
make status

# Restart
make restart
```

## 🔐 Security Recommendations

1. **Change all default passwords**
2. **Configure SSL certificates**
3. **Use SSH keys instead of passwords**
4. **Set up regular backups**
5. **Monitor logs for suspicious activity**
6. **Update system regularly**
7. **Use strong passwords**
8. **Configure rate limiting**

---

**Note**: This document contains basic instructions. For production environments, additional security and monitoring configuration is recommended.
