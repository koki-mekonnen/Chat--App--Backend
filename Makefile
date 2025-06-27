# Makefile for Docker Compose management

.PHONY: up down build rebuild start stop restart logs clean migrate

up:
	@echo "Starting all services in detached mode..."
	docker-compose up 

down:
	@echo "Stopping and removing all containers..."
	docker-compose down

build:
	@echo "Building all services..."
	docker-compose build

rebuild:
	@echo "Rebuilding all services..."
	docker-compose build --no-cache

start:
	@echo "Starting existing containers..."
	docker-compose start

stop:
	@echo "Stopping containers..."
	docker-compose stop

restart:
	@echo "Restarting all services..."
	docker-compose restart

logs:
	@echo "Showing logs for all services..."
	docker-compose logs -f

logs-frontend:
	@echo "Showing frontend logs..."
	docker-compose logs -f frontend

logs-backend:
	@echo "Showing backend logs..."
	docker-compose logs -f backend

logs-db:
	@echo "Showing database logs..."
	docker-compose logs -f db

logs-redis:
	@echo "Showing redis logs..."
	docker-compose logs -f redis

clean:
	@echo "Removing all containers, networks, and volumes..."
	docker-compose down -v
	@echo "Cleaning up unused Docker objects..."
	docker system prune -f

migrate:
	@echo "Running database migrations..."
	docker-compose exec backend npx prisma migrate deploy

psql:
	@echo "Connecting to PostgreSQL database..."
	docker-compose exec db psql -U postgres -d chatdb

redis-cli:
	@echo "Connecting to Redis CLI..."
	docker-compose exec redis redis-cli -a redispass

frontend-shell:
	@echo "Opening shell in frontend container..."
	docker-compose exec frontend sh

backend-shell:
	@echo "Opening shell in backend container..."
	docker-compose exec backend sh