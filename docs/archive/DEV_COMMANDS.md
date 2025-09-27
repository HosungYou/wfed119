# Dev Commands

Quick commands to manage this project locally and on GitHub.

## Common

- Dev: `npm run dev` or `make dev`
- Build: `npm run build` or `make build`
- Prisma (Postgres): `make prisma` (uses `prisma/schema.postgres.prisma`)

## Git: Commit & Push

Use the helper script to stage, commit, and push in one go.

- With message:
  - `npm run gp -- "feat: update X"`
  - `make push MSG="feat: update X"`
  - `bash scripts/git-push.sh "feat: update X"`

- Without message (auto message):
  - `npm run gp`
  - `make push`

The script pushes to the current branch (`git rev-parse --abbrev-ref HEAD`).

## Render Build

Local reproduction of Render’s build steps (Postgres schema):

- `npm run build:render` or `make deploy-render`

## Notes

- Render uses an assigned `PORT`. Do not hardcode it locally for production.
- Prisma client is generated for Postgres during Render builds; local default is SQLite unless `DATABASE_URL` is Postgres.

