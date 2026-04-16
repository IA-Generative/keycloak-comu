SHELL := /bin/bash

.DEFAULT_GOAL := help

.PHONY: help up down restart logs ps backend-shell frontend-shell openapi-client go-tidy frontend-build helm-deps

help: ## Show this help message
	@echo "Usage: make <command>"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-25s\033[0m %s\n", $$1, $$2}'

# Docker Compose
up: ## Start all services
	docker compose up --build

down: ## Stop all services and remove volumes
	docker compose down -v

restart: ## Restart all services
	docker compose down
	docker compose up --build

logs: ## Follow service logs
	docker compose logs -f --tail=200

ps: ## List running services
	docker compose ps

# Shells
backend-shell: ## Open a shell in the backend container
	docker compose exec backend sh

frontend-shell: ## Open a shell in the frontend container
	docker compose exec frontend sh

# Code generation
openapi-client: ## Regenerate the frontend OpenAPI client
	docker compose run --rm frontend npm run generate:client

# Go
go-tidy: ## Run go mod tidy in backend
	docker compose run --rm backend go mod tidy

go-spec: ## Generate OpenAPI spec from backend
	docker compose run --rm -e WRITE_SPEC_ONLY=true backend ./server

# Frontend
frontend-build: ## Build frontend for production
	docker compose run --rm frontend npm run build

# Helm
helm-deps: ## Update Helm chart dependencies
	helm dependency update helm/
