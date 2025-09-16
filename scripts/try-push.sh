#!/usr/bin/env bash
set -euo pipefail

BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "[post-commit] Attempting to push ${BRANCH}..."
if git push -u origin "$BRANCH"; then
  echo "✓ Pushed to origin/${BRANCH}"
  exit 0
fi

echo "⚠️  Push rejected. Trying pull --rebase..."
if git pull --rebase origin "$BRANCH"; then
  echo "→ Rebase succeeded. Pushing again..."
  git push -u origin "$BRANCH" && exit 0
else
  echo "❌ Rebase failed (likely conflicts). Resolve and push manually."
  exit 1
fi

