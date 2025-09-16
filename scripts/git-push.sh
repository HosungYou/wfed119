#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bash scripts/git-push.sh "commit message"
#   npm run gp -- "commit message"
#   make push MSG="commit message"

MSG=${1:-}
if [[ -z "${MSG}" ]]; then
  MSG="chore: auto-commit $(date '+%Y-%m-%d %H:%M:%S')"
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "→ Committing to branch: ${BRANCH}"

git add -A
if git diff --cached --quiet; then
  echo "No staged changes. Nothing to commit."
  exit 0
fi

git commit -m "${MSG}" || true
git push -u origin "${BRANCH}"

echo "✓ Pushed to origin/${BRANCH}"

