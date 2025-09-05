# Comments SPA Makefile

.PHONY: help install build start stop clean logs test

# Default target
help:
	@echo "Available commands:"
	@echo "  install     - Install dependencies for all services"
	@echo "  build       - Build all Docker images"
	@echo "  start       - Start all services"
	@echo "  stop        - Stop all services"
	@echo "  restart     - Restart all services"
	@echo "  clean       - Remove all containers and volumes"
	@echo "  logs        - Show logs for all services"
	@echo "  test        - Run tests"
	@echo "  dev         - Start development environment"
	@echo "  prod        - Start production environment"

# Install dependencies
install:
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

# Build Docker images
build:
	@echo "Building Docker images..."
	docker-compose build

# Start all services
start:
	@echo "Starting all services..."
	docker-compose up -d

# Stop all services
stop:
	@echo "Stopping all services..."
	docker-compose down

# Restart all services
restart: stop start

# Clean up
clean:
	@echo "Cleaning up containers and volumes..."
	docker-compose down -v --remove-orphans
	docker system prune -f

# Show logs
logs:
	docker-compose logs -f

# Run tests
test:
	@echo "Running backend tests..."
	cd backend && npm test
	@echo "Running frontend tests..."
	cd frontend && npm test

# Development environment
dev:
	@echo "Starting development environment..."
	docker-compose -f docker-compose.yml up -d

# Production environment
prod:
	@echo "Starting production environment..."
	docker-compose -f docker-compose.prod.yml up -d

# Database operations
db-reset:
	@echo "Resetting database..."
	docker-compose exec mongodb mongosh --eval "db.dropDatabase()" comments_db

# Backend only
backend:
	@echo "Starting backend only..."
	docker-compose up -d mongodb redis elasticsearch rabbitmq backend

# Frontend only
frontend:
	@echo "Starting frontend only..."
	docker-compose up -d frontend

# Show status
status:
	docker-compose ps
