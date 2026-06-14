# ConsequenceStudio Repository Audit

**Audit date:** 2026-06-14  
**Auditor:** HBM & Company Engineering  
**Repository:** `consequence/studio` (local path: `studio-2`)  
**Specification version:** Full implementation specification (20-phase build order)

---

## Executive Summary

The ConsequenceStudio repository is a **greenfield project**. It contains a single GitLab template `README.md` and one initial commit (`273ca4c Initial commit`). No application code, configuration, CI pipeline, or package structure exists. The remote is configured for `https://gitlab.com/consequencesoftware/studio.git` on branch `main`.

Implementation must proceed from zero according to the 20-phase specification. No migration, refactoring, or compatibility work is required.

---

## Repository Inventory

| Item | Status | Notes |
|------|--------|-------|
| `apps/studio-desktop` | **Missing** | Tauri shell + React frontend |
| `packages/ui` | **Missing** | Design system + DAW components |
| `packages/audio` | **Missing** | MIDI, piano roll model, WebGL renderer |
| `packages/stream` | **Missing** | Backend service clients |
| `packages/state` | **Missing** | Zustand stores + event reconstruction |
| `packages/native` | **Missing** | Tauri IPC bindings |
| `packages/figma-mcp` | **Missing** | Design token sync |
| `pnpm-workspace.yaml` | **Missing** | Monorepo workspace config |
| `turbo.json` | **Missing** | Build orchestration |
| `package.json` (root) | **Missing** | Workspace root |
| `Makefile` | **Missing** | Dev operation targets |
| `.gitlab-ci.yml` | **Missing** | CI/CD pipeline |
| `docs/` | **Missing** | Documentation (this audit initiates it) |

### Existing Files

- **`README.md`** — GitLab default template. References `consequencesoftware/studio` remote. Contains no project-specific documentation, build instructions, or architecture description. Must be replaced with ConsequenceStudio-specific content during Phase 1.

### Git State

- **Branch:** `main`, up to date with `origin/main`
- **Commits:** 1 (`Initial commit`)
- **Working tree:** Clean
- **Untracked/modified:** None

---

## Development Environment

| Tool | Version | Status |
|------|---------|--------|
| Node.js | v22.22.0 | Available |
| pnpm | (installed during audit) | Available after `npm install -g pnpm` |
| Rust / cargo | 1.96.0 | Available |
| Tauri CLI | Not verified | Required for Phase 3+ |
| Playwright | Not installed | Required for Phase 20 |

**Platform:** Windows 10 (build 26200). Cross-platform CI will target macOS arm64/x86_64, Windows x86_64, and Linux x86_64 per specification.

---

## Specification Compliance Gap Analysis

### Technology Stack (Required vs. Present)

| Requirement | Present | Gap |
|-------------|---------|-----|
| Tauri 2.0 | No | Full backend + shell |
| React 18 + TypeScript 5.3+ | No | Frontend |
| Vite | No | Build system |
| Zustand | No | State management |
| TanStack Query | No | Server state |
| WebGL 2.0 (raw, no Three.js) | No | Piano roll renderer |
| Konva.js | No | Arrangement view |
| Tailwind CSS 3 | No | UI chrome |
| Framer Motion | No | Animations |
| pnpm workspaces + Turborepo | No | Monorepo |
| Vitest + Playwright | No | Testing |
| midir + cpal (Rust) | No | Native MIDI/audio |

### Architecture (Required vs. Present)

| System | Status |
|--------|--------|
| Five-region workspace layout | Not implemented |
| Event-driven Zustand state | Not implemented |
| Unified stream merger | Not implemented |
| Deterministic event reconstruction | Not implemented |
| Command palette + keymap | Not implemented |
| Doctor / Analysis / Ledger / Collab panels | Not implemented |
| Floppydisk browser | Not implemented |
| Performance benchmarks (60fps piano roll) | Not implemented |

### Prohibitions (Enforcement Status)

No code exists yet. Prohibitions (no frontend music theory, no frontend financial computation, no Three.js, no setTimeout for musical timing, no localStorage for session state, no hardcoded API URLs, 300-line component limit) will be enforced via ESLint rules and code review conventions established in Phase 1.

---

## Risk Assessment

### High Priority

1. **Greenfield scope** — 20 phases of substantial engineering. Phase ordering and test gates are critical to avoid rework.
2. **WebGL piano roll performance** — Most performance-critical surface. Requires dedicated benchmark suite before merge (Phase 11).
3. **Cross-platform Tauri builds** — macOS signing, Windows SDK, Linux WebKit deps require CI runner configuration.

### Medium Priority

1. **WebRTC collaboration** — VideoSessionManager depends on ConsequenceStream signaling; mock infrastructure needed for E2E tests.
2. **Event-sourced state** — Reconstructor commutativity/associativity property tests are non-trivial.
3. **Figma token sync** — `packages/figma-mcp` depends on Figma API credentials; manual token seed acceptable for Phase 2.

### Low Priority

1. **README replacement** — Template content is misleading; replace in Phase 1.
2. **Remote URL** — Spec references `consequence/studio` in HBM Company GitLab; local remote is `consequencesoftware/studio`. No code impact.

---

## Recommended Implementation Entry Point

Per specification **Phase 1**:

1. Scaffold monorepo with all package directories and empty index files establishing the dependency graph.
2. Add root configuration: `pnpm-workspace.yaml`, `turbo.json`, `package.json`, `Makefile`, `.gitlab-ci.yml`, updated `README.md`.
3. Add shared tooling: TypeScript project references, ESLint, Prettier, Vitest config stubs.
4. Verify `pnpm install` and `turbo run build` succeed with empty package exports.

Subsequent phases proceed strictly in order with passing lint and tests before advancing.

---

## Dependency Graph (Target)

```
apps/studio-desktop
  ├── @consequence/ui
  ├── @consequence/audio
  ├── @consequence/stream
  ├── @consequence/state
  └── @consequence/native

packages/state
  ├── @consequence/stream
  └── @consequence/audio

packages/native
  └── (Tauri IPC — no internal package deps)

packages/stream
  └── (standalone clients)

packages/audio
  └── (standalone — midi-types, renderer)

packages/ui
  └── (standalone design system)

packages/figma-mcp
  └── @consequence/ui (writes tokens)
```

---

## Conclusion

The repository is an empty GitLab scaffold ready for ConsequenceStudio implementation. No existing code conflicts with the specification. All 20 phases must be executed sequentially. This audit satisfies the specification requirement to document findings before writing implementation code.
