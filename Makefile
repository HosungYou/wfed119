SHELL := /bin/bash

.PHONY: help dev build prisma push deploy-render

help:
	@echo "Available targets:"
	@echo "  dev            - Run Next.js dev server"
	@echo "  build          - Build the app"
	@echo "  prisma         - Generate Prisma client (Postgres)"
	@echo "  push MSG=...   - Commit and push with message"
	@echo "  deploy-render  - Build using Render settings"

dev:
	npm run dev

build:
	npm run build

prisma:
	npx prisma generate --schema=prisma/schema.postgres.prisma

push:
	bash scripts/git-push.sh "$(MSG)"

deploy-render:
	npm run build:render

