# Release mirroring (GitLab → GitHub)

GitLab is the **source of truth**. Two things mirror to GitHub automatically once CI variables are set:

| What | When | Job |
|------|------|-----|
| **Source code** (`main` + tags) | Every push to `main` or tag | `mirror:github` |
| **Installers** + `downloads.json` | Semver tags only (`v0.1.0`) | `release:mirror` |

The website **Download Consequence** page reads `downloads.json` from GitHub Releases. Until the first tag ships, it correctly shows “Coming soon”.

## One-time setup

### 1. Create the GitHub mirror repo

Log into GitHub as **@consequencesoftware** and create a public empty repo:

**https://github.com/new** → name: `studio` → Public → no README/license (GitLab CI will push)

Or:

```bash
gh auth login   # as consequencesoftware
gh repo create consequencesoftware/studio --public --description "ConsequenceStudio mirror"
```

### 2. GitHub PAT for CI

As **@consequencesoftware**, create a classic PAT or fine-grained token with **Contents: Read and write** on `consequencesoftware/studio`.

### 3. GitLab CI/CD variables (Hatedbymany account)

`glab` must be authenticated as **@hatedbymany** (git OAuth token cannot manage CI variables).

```powershell
glab auth login --hostname gitlab.com

$env:GITLAB_TOKEN = "glpat-..."   # hatedbymany PAT, api scope
$env:GITHUB_TOKEN = "ghp_..."    # consequencesoftware GitHub PAT
node deploy/release/setup-gitlab-variables.mjs
```

This sets `GITHUB_TOKEN` and `GITHUB_REPO` (`consequencesoftware/studio`).

### 4. Push the release pipeline to GitLab

Commit and push `.gitlab-ci.yml` and `deploy/release/` to `main`. The next `main` push runs `mirror:github` and syncs code to GitHub.

### 5. GitLab release permissions

**Settings → CI/CD → Token Access** — allow job token to create releases (for GitLab Release metadata links).

## Ship a release (GitLab only)

```bash
# 1. Bump version in apps/studio-desktop/src-tauri/tauri.conf.json
# 2. Commit and push main  → mirror:github syncs code
git tag v0.1.0
git push origin v0.1.0     → mirror:github syncs tag + release:mirror uploads installers
```

Pipeline on tag `v*.*.*`:

1. `mirror:github` — pushes tag (and `main`) to GitHub
2. `build:linux` / `build:macos` / `build:windows` — Tauri installers
3. `release:mirror` — uploads installers + `downloads.json` to **GitHub Releases**

After `v0.1.0`, the website `/download` page will pick up the manifest automatically.

## Website integration

```
GET https://api.github.com/repos/consequencesoftware/studio/releases/latest
→ find asset downloads.json → use browser_download_url
```

Example manifest: `deploy/release/downloads.example.json`

## Local dry-run

```bash
node deploy/release/collect-bundle.mjs windows
# Set CI_COMMIT_TAG, GITHUB_TOKEN, GITHUB_REPO, then:
node deploy/release/mirror-release.mjs
```
