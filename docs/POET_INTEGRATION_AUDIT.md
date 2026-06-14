# ConsequencePoet Integration Audit

Audit date: 2026-06-14. Repository: `studio-2` at Phase 18 complete (Floppydisk browser, command palette).

## Executive summary

ConsequenceStudio has **no ConsequencePoet code** today. Integration is fully additive. The spec references `App.tsx` for panel wiring; the actual workspace shell lives in `WorkspaceLayout.tsx` + `SidePanels.tsx`. Status bar is `packages/ui/src/status/StatusBar.tsx`, not `transport/`.

## Files that exist and require modification

| File | Current state | Required change |
|------|---------------|-----------------|
| `packages/stream/src/types.ts` | 10 `UnifiedStreamEvent` variants | Add `poet_token`, `poetry_generation_complete`, `poet_backend_status`, `poet_error` |
| `packages/stream/src/config.ts` | `StreamConfig` with `VITE_*` URLs | Add Poet WS/HTTP URLs + reconnect/ping settings |
| `packages/stream/src/unified-stream.ts` | 5 clients, `connectAll()` | Add `PoetStreamClient`, forward poet events, connect/disconnect |
| `packages/stream/src/index.ts` | Re-exports stream modules | Export poet modules |
| `packages/state/src/index.ts` | 20+ store exports | Export `poet-store`, `stream-subscription`, `selectors` |
| `packages/state/src/workspace-store.ts` | `RightPanelTab` = 4 tabs | Add `"poet"`, optional `previousRightTab` for toggle |
| `packages/state/src/stream-bindings.ts` | Reconstruction path only | No poet logic (poet uses dedicated subscription) |
| `packages/state/src/system-store.ts` | `ConnectionMap` 5 services | Add `poet` entry |
| `packages/ui/src/design-system/tokens.ts` | No poet tokens | Add 4 poet token aliases |
| `packages/ui/src/keymap.ts` | 5 sections, 22 commands | Add `poet` section (9 commands); resolve shortcut collisions |
| `packages/ui/src/panels/index.ts` | Exports `ResizablePanel` only | Export `PoetPanel` |
| `packages/ui/src/primitives/index.ts` | Empty stub | Implement `Button`, `Toggle`, `Tooltip` |
| `packages/ui/src/status/StatusBar.tsx` | 10 props, inline styles | Add optional `poetStatus` slot (far right) |
| `packages/ui/src/overlays/index.ts` | Command palette exports | Export `NotificationToast` |
| `packages/native/src/tauri-commands.ts` | 8 IPC commands | Add `poetGetSessionState` |
| `apps/studio-desktop/src-tauri/src/commands.rs` | 8 commands | Add `poet_get_session_state` (HTTP to Poet API) |
| `apps/studio-desktop/src-tauri/src/lib.rs` | invoke_handler | Register new command |
| `apps/studio-desktop/src-tauri/Cargo.toml` | No HTTP client | Add `reqwest` for session state fetch |
| `apps/studio-desktop/src/components/workspace/SidePanels.tsx` | 4 right tabs | Add Poet tab + notification dot |
| `apps/studio-desktop/src/components/workspace/WorkspaceLayout.tsx` | Stream bootstrap, status bar | Poet connect bootstrap, status indicator, poet actions |
| `apps/studio-desktop/src/components/workspace/command-actions.ts` | 22 commands | Add poet command handlers |
| `.env.example` | 8 service URLs | Add `VITE_POET_*` vars |
| `apps/studio-desktop/tailwind.config.js` | Scans app only | Include `packages/ui/src` for Poet Tailwind classes |

## Files that do not exist (must create)

### Stream (`packages/stream/src/`)
- `poet-types.ts` — all Poet protocol TypeScript types
- `poet-context-builder.ts` — `buildMusicalContextSnapshot()` (accepts input DTO, no state import)
- `poet-client.ts` — `PoetStreamClient` with envelope WS protocol, ping/pong, reconnect
- `poet-client.test.ts`, `poet-context-builder.test.ts`, `poet-types.test.ts`

### State (`packages/state/src/`)
- `poet-store.ts` — full Zustand poet state + actions
- `poet-store.test.ts`
- `stream-subscription.ts` — `subscribeToStream` for poet-store init
- `selectors.ts` — `selectMusicalContextInput()`, poet status selectors

### UI (`packages/ui/src/`)
- `panels/PoetPanel.tsx` + `panels/poet/*` (8 sub-components)
- `primitives/Button.tsx`, `Toggle.tsx`, `Tooltip.tsx`
- `overlays/NotificationToast.tsx`

### Studio desktop
- `src/components/workspace/poet-actions.ts` — generation/supervision dispatch helpers
- `e2e/poet.spec.ts` — Playwright integration tests

## Architectural gaps

1. **Analysis data shape**: `analysis-store` is flat (`key`, `mode`, `tension`). Rich CMTE data is in `theory-store.analysisPanel` (`AnalysisPanelSnapshot`). Context builder maps from panel + session transport state.

2. **WebSocket protocol split**: Existing `WebSocketClient` expects `{event_type, payload}`. Poet uses `{message_type, message_id, session_id, ...}`. Poet needs a dedicated client.

3. **Circular dependency**: `state` depends on `stream`. `poet-context-builder` in stream must not import `state`; it accepts a `MusicalContextInput` DTO. `selectors.ts` in state assembles the DTO.

4. **Shortcut collisions**: `mod+Shift+A/L/P` already bound. Poet commands rebind conflicting non-Poet shortcuts (documented in `DECISION_LOG.md`).

5. **Primitives missing**: Poet panel depends on Toggle/Button/Tooltip primitives (currently empty export).

6. **NotificationToast missing**: Referenced for reconnect exhaustion; must be created.

7. **ConnectionStatus**: Poet store uses `reconnecting`; unified stream `ConnectionStatus` type stays 3-value; poet-store has its own `PoetConnectionState`.

8. **Rust HTTP**: `poet_get_session_state` requires `reqwest` dependency.

9. **Spec styling rule**: Poet components use Tailwind only; existing Studio panels use inline styles — Poet is the exception per spec.

## Test baseline

- **74 Vitest tests** passing before integration
- **1 Playwright test** (`e2e/welcome.spec.ts`)
- `unified-stream.test.ts` expects 5 clients — will update to 6

## Unchanged surfaces (per spec)

Piano roll, arrangement view, transport bar (except Disk button already exists), analysis/ledger/collab/doctor panels, Floppydisk browser, existing Tauri commands, event reconstructor for non-poet events.
