.PHONY: install dev build lint test bench e2e typecheck clean tauri-dev tauri-build

install:
	pnpm install

dev:
	pnpm dev

build:
	pnpm build

lint:
	pnpm lint

test:
	pnpm test

bench:
	pnpm bench

e2e:
	pnpm e2e

typecheck:
	pnpm typecheck

clean:
	pnpm clean

tauri-dev:
	pnpm --filter @consequence/studio-desktop tauri dev

tauri-build:
	pnpm --filter @consequence/studio-desktop tauri build
