# AGENTS.md

Owner’s guide to manage, build, and ship WFED119. This file focuses on day‑to‑day commands, automation, and deployment.

## Overview

- Source of truth: `./src` (Next.js)
- Infra config: `render.yaml` (Render Blueprint)
- Database: Prisma with dual schemas
  - Local default: SQLite (`prisma/schema.prisma`)
  - Render/Prod: PostgreSQL (`prisma/schema.postgres.prisma`)
- Prisma bootstrap: `scripts/setup-prisma.js` auto‑selects schema by `DATABASE_URL`.

## Core Commands

- Dev: `npm run dev` or `make dev`
- Build: `npm run build` or `make build`
- Render build (Postgres): `npm run build:render` or `make deploy-render`
- Prisma (Postgres): `make prisma` (generates client against Postgres schema)

## Git & Automation

- One‑shot commit + push: `npm run gp -- "msg"` or `make push MSG="msg"`
- Auto push on save (polling): `npm run watch:push` or `make watch-push`
  - Commits with message `auto: save <timestamp>` and pushes to current branch.
  - If push is rejected (remote ahead), it prints guidance to rebase.

### Git hooks (optional, push after every commit)

- Enable repo hooks once per machine:
  - `make setup-git-hooks` or `npm run hooks:setup`
  - This sets `core.hooksPath` to `.githooks` and makes scripts executable.
- After this, every `git commit` triggers `.githooks/post-commit` which attempts to push automatically.

## Render Deployment

- `render.yaml` uses: `buildCommand: npm ci && npm run build:render`
  - Ensures Prisma client is generated with Postgres schema
  - `PORT` is not hardcoded; Render provides it
- Health check: `/api/health`

## Troubleshooting

- Push rejected (remote ahead):
  - `git pull --rebase origin $(git rev-parse --abbrev-ref HEAD)`
  - Resolve conflicts if any, then `git push`
- Prisma schema mismatch:
  - Ensure Render uses `build:render` and `DATABASE_URL` is Postgres
  - Locally, run `make prisma` to re‑generate Postgres client when needed

## Maintainer Notes

- Remote: `origin https://github.com/HosungYou/wfed119.git`
- Branch policy: Use `main` for production. Feature branches can use the same automations.
- Secrets: Set API keys and `DATABASE_URL` in Render dashboard. Do not commit them.

