# Release mirroring (GitLab → GitHub)

GitLab is the **source of truth**. This project is **one repo** in the `consequencesoftware` GitLab group (studio, stream, doctor, ledger, etc.). It mirrors **only this repo** to GitHub — not the whole group.

| GitLab (source) | GitHub (public mirror) |
|-----------------|------------------------|
| `gitlab.com/consequencesoftware/studio` | `github.com/hbmandcompany/Consequence` |

Two things mirror to GitHub automatically once CI variables are set:

| What | When | Job |
|------|------|-----|
| **Source code** (`main` + tags) | Every push to `main` or tag | `mirror:github` |
| **Installers** + `downloads.json` | Semver tags only (`v0.1.0`) | `release:mirror` |

The website **Download Consequence** page reads `downloads.json` from GitHub Releases. Until the first tag ships, it correctly shows “Coming soon”.

## One-time setup

### 1. GitHub mirror repo

Target repo (already exists): **https://github.com/hbmandcompany/Consequence**

Git mirror URL for GitLab UI mirroring (optional alternative to CI):

```
https://github.com/hbmandcompany/Consequence.git
```

### 2. GitHub PAT for CI

As an account with write access to **hbmandcompany/Consequence**, create a PAT with **Contents: Read and write** on that repo.

### 3. GitLab CI/CD variables (Hatedbymany account)

`glab` must be authenticated as **@hatedbymany** (git OAuth token cannot manage CI variables).

```powershell
glab auth login --hostname gitlab.com

$env:GITLAB_TOKEN = "glpat-..."   # hatedbymany PAT, api scope
$env:GITHUB_TOKEN = "ghp_..."    # hbmandcompany PAT, Contents: write
$env:GITHUB_REPO = "hbmandcompany/Consequence"
node deploy/release/setup-gitlab-variables.mjs
```

This sets `GITHUB_TOKEN` and `GITHUB_REPO` on **gitlab.com/consequencesoftware/studio** only.

### 4. GitLab release permissions

**Settings → CI/CD → Token Access** — allow job token to create releases (for GitLab Release metadata links).

## Ship a release (GitLab only)

```bash
# 1. Bump version in apps/studio-desktop/src-tauri/tauri.conf.json
# 2. Commit and push main  → mirror:github syncs code to hbmandcompany/Consequence
git tag v0.1.0
git push origin v0.1.0     → mirror:github syncs tag + release:mirror uploads installers
```

Pipeline on tag `v*.*.*`:

1. `mirror:github` — pushes tag (and `main`) to `hbmandcompany/Consequence`
2. `build:linux` / `build:macos` / `build:windows` — Tauri installers
3. `release:mirror` — uploads installers + `downloads.json` to **GitHub Releases**

After `v0.1.0`, the website `/download` page will pick up the manifest automatically.

## Website integration

```
GET https://api.github.com/repos/hbmandcompany/Consequence/releases/latest
→ find asset downloads.json → use browser_download_url
```

Example manifest: `deploy/release/downloads.example.json`

## Local dry-run

```bash
node deploy/release/collect-bundle.mjs windows
# Set CI_COMMIT_TAG, GITHUB_TOKEN, GITHUB_REPO, then:
node deploy/release/mirror-release.mjs
```
