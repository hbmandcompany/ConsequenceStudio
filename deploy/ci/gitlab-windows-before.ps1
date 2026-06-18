$ErrorActionPreference = "Stop"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  choco install nodejs-lts -y
}
if (-not (Get-Command rustup -ErrorAction SilentlyContinue)) {
  choco install rust-ms -y
}
corepack enable
corepack prepare "pnpm:$env:PNPM_VERSION" --activate
pnpm install --frozen-lockfile
