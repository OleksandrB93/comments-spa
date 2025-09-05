# Project Setup Instructions

## Prerequisites

### Required Tools:

1. **Docker** and **Docker Compose**

   - Windows: [Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - Linux: `sudo apt install docker.io docker-compose`
   - macOS: `brew install docker docker-compose`

2. **Git**

   - Windows: [Git for Windows](https://git-scm.com/download/win)
   - Linux: `sudo apt install git`
   - macOS: `brew install git`

3. **Node.js 18+** (for local development)
   - [Official website](https://nodejs.org/)

## Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd comments-spa
```

### 2. Environment Variables Setup

```bash
# Backend
cp backend/env.example backend/.env

# Frontend
cp frontend/env.example frontend/.env
```

### 3. Run with Docker (recommended)

```bash
# Start all services
make start
# or
docker-compose up -d

# Check status
make status
# or
docker-compose ps
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend GraphQL**: http://localhost:3001/graphql
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379
- **Elasticsearch**: http://localhost:9200
- **RabbitMQ Management**: http://localhost:15672

## Local Development

### Backend (NestJS)

```bash
cd backend
npm install
npm run start:dev
```

### Frontend (React)

```bash
cd frontend
npm install
npm start
```

## Useful Commands

### Docker Commands

```bash
# Start
make start

# Stop
make stop

# Restart
make restart

# Clean
make clean

# Logs
make logs

# Status
make status
```

### Database

```bash
# Reset database
make db-reset

# Connect to MongoDB
docker-compose exec mongodb mongosh
```

### Testing

```bash
# All tests
make test

# Backend only
cd backend && npm test

# Frontend only
cd frontend && npm test
```

## Project Structure

```
comments-spa/
├── frontend/              # React SPA
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Pages
│   │   ├── hooks/         # Custom hooks
│   │   ├── graphql/       # GraphQL queries/mutations
│   │   └── utils/         # Utilities
│   ├── public/            # Static files
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── backend/               # NestJS API
│   ├── src/
│   │   ├── modules/       # Modules (comments, users, files)
│   │   ├── common/        # Shared components
│   │   └── config/        # Configuration
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── nest-cli.json
├── database-schema/       # MongoDB schemas
│   └── init-mongo.js
├── docker-compose.yml     # Docker configuration
├── Makefile              # Convenience commands
├── README.md
└── SETUP.md
```

## Environment Variables Configuration

### Backend (.env)

```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://admin:password123@localhost:27017/comments_db?authSource=admin
REDIS_URL=redis://:redis123@localhost:6379
ELASTICSEARCH_URL=http://localhost:9200
RABBITMQ_URL=amqp://admin:rabbit123@localhost:5672
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100
```

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:3001/graphql
REACT_APP_WS_URL=ws://localhost:3001/graphql
REACT_APP_NODE_ENV=development
REACT_APP_MAX_FILE_SIZE=10485760
REACT_APP_ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/gif
REACT_APP_ALLOWED_TEXT_TYPES=text/plain
REACT_APP_COMMENTS_PER_PAGE=25
REACT_APP_MAX_IMAGE_WIDTH=320
REACT_APP_MAX_IMAGE_HEIGHT=240
```

## Troubleshooting

### Port Already in Use

```bash
# Check which processes are using ports
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001

# Stop services
make stop
```

### Docker Issues

```bash
# Restart Docker
sudo systemctl restart docker

# Clean Docker
docker system prune -a
```

### Database Issues

```bash
# Reset database
make db-reset

# Check connection
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

## Development

### Adding New Dependencies

```bash
# Backend
cd backend
npm install <package-name>

# Frontend
cd frontend
npm install <package-name>
```

### Creating New Modules (Backend)

```bash
cd backend
npm run generate module <module-name>
npm run generate service <service-name>
npm run generate controller <controller-name>
```

## Deployment

### Production

```bash
# Create production build
make build

# Run production
make prod
```

### Cloud Deployment

- AWS ECS/EKS
- Google Cloud Run
- Azure Container Instances
- Yandex Cloud

## Support

If you encounter issues:

1. Check logs: `make logs`
2. Check status: `make status`
3. Restart services: `make restart`
4. Clean system: `make clean`
