# BillFlow Makefile
# Usage: make <target>

.PHONY: help install dev build seed test docker-up docker-down docker-logs clean

help:
	@echo ""
	@echo "  ⚡ BillFlow — Available Commands"
	@echo ""
	@echo "  make install      Install all dependencies"
	@echo "  make dev          Start frontend + backend in dev mode"
	@echo "  make build        Build frontend for production"
	@echo "  make seed         Seed database with sample data"
	@echo "  make test         Run backend test suite"
	@echo "  make docker-up    Start full stack with Docker Compose"
	@echo "  make docker-dev   Start with Docker Compose (dev profile)"
	@echo "  make docker-down  Stop Docker containers"
	@echo "  make docker-logs  Tail all container logs"
	@echo "  make clean        Remove node_modules and build artifacts"
	@echo ""

install:
	npm run install:all

dev:
	npm run dev

build:
	cd frontend && npm run build

seed:
	cd backend && npm run seed

test:
	cd backend && npm test

docker-up:
	docker compose --env-file .env.docker up -d --build

docker-dev:
	docker compose --env-file .env.docker --profile dev up -d --build

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

docker-clean:
	docker compose down -v --rmi local

clean:
	rm -rf frontend/node_modules frontend/dist
	rm -rf backend/node_modules backend/logs
	rm -rf node_modules

# Generate a secure JWT secret
gen-secret:
	@node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
