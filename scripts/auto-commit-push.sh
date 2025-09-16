#!/usr/bin/env bash
set -euo pipefail

# Simple watcher that polls for changes and auto-commits & pushes.
# No external dependencies required.

INTERVAL=${INTERVAL:-3}

echo "[auto-commit-push] Watching for changes every ${INTERVAL}s..."
echo "Press Ctrl+C to stop."

while true; do
  if ! git diff --quiet || ! git diff --cached --quiet || [[ -n "$(git ls-files --others --exclude-standard)" ]]; then
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    MSG="auto: save $(date '+%Y-%m-%d %H:%M:%S')"
    echo "→ Detected changes. Committing and pushing to ${BRANCH}..."
    git add -A || true
    if git diff --cached --quiet; then
      :
    else
      git commit -m "$MSG" || true
    fi
    # Try push; if rejected, advise next steps.
    if git push -u origin "$BRANCH"; then
      echo "✓ Pushed to origin/${BRANCH}"
    else
      echo "⚠️  Push rejected. The remote has new commits."
      echo "   Run: git pull --rebase && git push (resolve conflicts if any)."
    fi
  fi
  sleep "$INTERVAL"
done

