#!/usr/bin/env sh
set -eu
export PATH="$HOME/.cargo/bin:$PATH"
if ! command -v rustup >/dev/null 2>&1; then
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  export PATH="$HOME/.cargo/bin:$PATH"
fi
if ! command -v node >/dev/null 2>&1; then
  brew install node
fi
corepack enable
corepack prepare "pnpm@${PNPM_VERSION:-9.15.0}" --activate
rustup target add aarch64-apple-darwin x86_64-apple-darwin
pnpm install --frozen-lockfile
