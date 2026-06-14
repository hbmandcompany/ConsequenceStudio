# ConsequenceStudio

Native desktop digital audio workstation by [HBM & Company](https://consequence.software). Built with Tauri 2.0, React 18, and a custom WebGL2 piano roll renderer.

ConsequenceStudio is the primary creative surface of the Consequence platform — a production-grade DAW with embedded musical intelligence from ConsequenceDoctor, real-time analysis from ConsequenceTheory (CMTE), economic overlay from ConsequenceLedger, and asset storage via ConsequenceFloppydisk.

## Monorepo Structure

```
apps/studio-desktop     Tauri shell + React frontend
packages/ui             Design system + DAW components
packages/audio          MIDI handling + WebGL piano roll renderer
packages/stream         Backend service clients
packages/state          Event-driven Zustand stores
packages/native         Tauri IPC bindings
packages/figma-mcp      Design token synchronization
```

## Requirements

- Node.js 20+
- pnpm 9+
- Rust 1.77+ (with cargo)
- Platform SDKs for Tauri (see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/))

## Getting Started

```bash
# Install dependencies
make install

# Copy environment template
cp .env.example apps/studio-desktop/.env

# Start development (Tauri + Vite)
make tauri-dev
```

## Development Commands

| Command | Description |
|---------|-------------|
| `make dev` | Start frontend dev server |
| `make build` | Build all packages |
| `make lint` | ESLint + cargo clippy |
| `make test` | Vitest + cargo test |
| `make bench` | Performance benchmarks |
| `make e2e` | Playwright end-to-end tests |
| `make tauri-build` | Production native build |

## Documentation

- [Repository Audit](docs/STUDIO_AUDIT.md)
- [Architectural Decision Log](docs/DECISION_LOG.md)

## License

Proprietary — HBM & Company. All rights reserved.
