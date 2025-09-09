# 🚀 Quick Start for Virtual Machine

## What needs to be changed for VM deployment

Your project is already prepared for deployment on a virtual machine! Here's what was created:

### 📁 New files for production:

1. **`docker-compose.prod.yml`** - Production Docker configuration
2. **`env.prod.example`** - Environment variables template
3. **`nginx.conf`** - Nginx configuration with security
4. **`deploy.sh`** - Automatic deployment script
5. **`security-setup.sh`** - Security setup script
6. **`Makefile.prod`** - Production commands
7. **`VM-DEPLOYMENT.md`** - Detailed instructions
8. **`maintenance.conf`** - Configuration for maintenance mode
9. **`maintenance.html`** - Maintenance mode page

## 🎯 Quick start (3 steps)

### 1. Download project to VM

```bash
git clone https://github.com/OleksandrB93/comments-spa.git
cd comments-spa
```

### 2. Run automatic deployment

```bash
chmod +x deploy.sh
./deploy.sh
```

### 3. Setup security

```bash
chmod +x security-setup.sh
./security-setup.sh
```

## 🔧 What needs to be configured

### Required changes:

1. **Passwords in `.env` file:**

   - `JWT_SECRET` - generate a strong key
   - `MONGO_ROOT_PASSWORD` - password for MongoDB
   - `REDIS_PASSWORD` - password for Redis
   - `RABBITMQ_PASSWORD` - password for RabbitMQ

2. **URL addresses:**
   - `FRONTEND_URL` - replace `your-vm-ip` with your VM IP
   - `VITE_APP_API_URL` - replace `your-vm-ip` with your VM IP
   - `VITE_APP_WS_URL` - replace `your-vm-ip` with your VM IP

### Optional:

3. **Domain and SSL:**
   - Configure domain
   - Install SSL certificates
   - Update URLs to HTTPS

## 🌐 Application access

After deployment, your application will be available at:

- **Frontend**: `http://YOUR-VM-IP:3000`
- **Backend API**: `http://YOUR-VM-IP:3001/graphql`
- **GraphQL Playground**: `http://YOUR-VM-IP:3001/graphql`
- **RabbitMQ Management**: `http://YOUR-VM-IP:15672`
- **Elasticsearch**: `http://YOUR-VM-IP:9200`

## 🛠 Useful commands

```bash
# Use production Makefile
make -f Makefile.prod help

# Main commands
make -f Makefile.prod start    # Start
make -f Makefile.prod stop     # Stop
make -f Makefile.prod logs     # Logs
make -f Makefile.prod status   # Status
make -f Makefile.prod backup   # Backup
```

## 🔒 Security

The `security-setup.sh` script automatically:

- Generates strong passwords
- Configures SSH security
- Installs fail2ban
- Sets up automatic updates
- Configures firewall

## 📊 Monitoring

```bash
# View logs
make -f Makefile.prod logs

# Monitor resources
make -f Makefile.prod monitor

# Health check
make -f Makefile.prod health
```

## 🔄 Updates

```bash
# Update application
make -f Makefile.prod update

# Backup before update
make -f Makefile.prod backup
```

## 🆘 Troubleshooting

```bash
# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

## 📚 Detailed documentation

For complete information, see:

- **`VM-DEPLOYMENT.md`** - Detailed deployment instructions
- **`README.md`** - General project information
- **`SETUP.md`** - Local development

---

**Ready!** 🎉 Your project is ready for deployment on a virtual machine.
