#!/usr/bin/env sh
set -eu

# Mirror GitLab source to GitHub (code + tags). Requires GITHUB_TOKEN and GITHUB_REPO.
if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "[mirror] GITHUB_TOKEN is not set — skipping GitHub git mirror"
  exit 0
fi

if [ -z "${GITHUB_REPO:-}" ]; then
  echo "[mirror] GITHUB_REPO is not set — skipping GitHub git mirror"
  exit 0
fi

git config user.email "ci@consequence.software"
git config user.name "ConsequenceStudio CI"

REMOTE_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git"
git remote remove github 2>/dev/null || true
git remote add github "$REMOTE_URL"

echo "[mirror] pushing main → github (${GITHUB_REPO})"
git push github "HEAD:refs/heads/main"

if [ -n "${CI_COMMIT_TAG:-}" ]; then
  echo "[mirror] pushing tag ${CI_COMMIT_TAG} → github"
  git push github "$CI_COMMIT_TAG"
fi

echo "[mirror] done"
