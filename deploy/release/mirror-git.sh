#!/usr/bin/env sh
set -eu

# Mirror GitLab source to a *separate* GitHub repo (optional).
# Uses GITHUB_CODE_MIRROR_REPO — NOT GITHUB_REPO (which is for Releases on the website repo).
if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "[mirror] GITHUB_TOKEN is not set — skipping GitHub git mirror"
  exit 0
fi

TARGET="${GITHUB_CODE_MIRROR_REPO:-}"
if [ -z "$TARGET" ]; then
  echo "[mirror] GITHUB_CODE_MIRROR_REPO is not set — skipping (releases still use GITHUB_REPO)"
  exit 0
fi

git config user.email "ci@consequence.software"
git config user.name "ConsequenceStudio CI"

REMOTE_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/${TARGET}.git"
git remote remove github 2>/dev/null || true
git remote add github "$REMOTE_URL"

echo "[mirror] pushing main → github (${TARGET})"
git push github "HEAD:refs/heads/main"

if [ -n "${CI_COMMIT_TAG:-}" ]; then
  echo "[mirror] pushing tag ${CI_COMMIT_TAG} → github"
  git push github "$CI_COMMIT_TAG"
fi

echo "[mirror] done"
