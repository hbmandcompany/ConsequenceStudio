# Release mirroring (GitLab → GitHub)

GitLab is the **source of truth** for ConsequenceStudio (desktop DAW). This is **one repo** in the `consequencesoftware` GitLab group (9 service repos total).

## Repo roles (important)

| Repo | What lives there |
|------|------------------|
| `gitlab.com/consequencesoftware/studio` | ConsequenceStudio source (GitLab, private dev) |
| `github.com/hbmandcompany/Consequence` | **Website** code + **GitHub Releases** (installers only) |

**Do not git-push studio source onto `hbmandcompany/Consequence` `main`** — that would overwrite the website. CI uploads installers via the Releases API only.

Optional: set `GITHUB_CODE_MIRROR_REPO` (e.g. `hbmandcompany/ConsequenceStudio`) if you want studio *source* mirrored to a separate GitHub repo.

## What CI does

| Job | When | What |
|-----|------|------|
| `mirror:github` | main / tag | Only if `GITHUB_CODE_MIRROR_REPO` is set — pushes studio source to a **separate** repo |
| `release:mirror` | tag `v*.*.*` | Uploads installers, `downloads.json`, and `latest.json` (Tauri updater) to **GitHub Releases** |

## One-time setup

### 1. GitHub PAT

PAT with **Contents: Read and write** on `hbmandcompany/Consequence`.

### 2. GitLab CI/CD variables (@hatedbymany)

```powershell
glab auth login --hostname gitlab.com

$env:GITLAB_TOKEN = "glpat-..."   # hatedbymany, api scope
$env:GITHUB_TOKEN = "ghp_..."    # hbmandcompany, Contents: write
node deploy/release/setup-gitlab-variables.mjs
```

Sets `GITHUB_TOKEN` + `GITHUB_REPO` (`hbmandcompany/Consequence`) on `gitlab.com/consequencesoftware/studio`.

### 3. Tauri auto-updater signing key

In-app updates verify signed builds. Generate once (if needed):

```bash
pnpm --filter @consequence/studio-desktop tauri signer generate -w ~/.tauri/consequence-studio.key --ci
```

Add GitLab CI/CD variable **`TAURI_SIGNING_PRIVATE_KEY`** (masked, protected):

- Value = full single-line contents of the `--ci` private key file (from `tauri signer generate -w ~/.tauri/consequence-studio.key --ci`)
- Do **not** paste the public key or a multiline key with broken newlines
- If the key is password-protected, also set **`TAURI_SIGNING_PRIVATE_KEY_PASSWORD`**

Public key is committed in `tauri.conf.json` and `deploy/release/tauri-updater.key.pub` (use the **base64-encoded** `.pub` file contents, not the inner `RWQ…` line).

Also add **`TAURI_SIGNING_PRIVATE_KEY`** to GitHub `ConsequenceStudio` secrets if using GitHub Actions builds.

On each tag release, CI uploads **`latest.json`** to GitHub Releases. Installed apps check:

```
https://github.com/hbmandcompany/Consequence/releases/latest/download/latest.json
```

### 4. Ship a release

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Website

```
GET https://api.github.com/repos/hbmandcompany/Consequence/releases/latest
→ downloads.json asset
```
