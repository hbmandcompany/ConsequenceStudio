# Decision Log — ConsequencePoet Integration

## D-001: Workspace wiring location

**Decision:** Wire Poet tab and status indicator in `WorkspaceLayout.tsx` + `SidePanels.tsx`, not `App.tsx`.

**Rationale:** `App.tsx` is routing-only (`/workspace` → `ProtectedWorkspaceRoute`). All panel chrome lives in workspace components.

---

## D-002: Musical context source

**Decision:** `buildMusicalContextSnapshot()` reads a `MusicalContextInput` DTO assembled by `selectMusicalContextInput()` in `packages/state/src/selectors.ts` from `theory-store.analysisPanel`, `session-store` transport fields, and `barBeatTick()`.

**Rationale:** Flat `analysis-store` lacks nested CMTE fields. `theory-store.analysisPanel` already holds harmonic/melodic/rhythmic/tonal data from theory frames. Avoids duplicating CMTE projection logic.

---

## D-003: Context builder package placement

**Decision:** `poet-context-builder.ts` lives in `packages/stream` but accepts only plain input objects — no `@consequence/state` import.

**Rationale:** Prevents `stream ↔ state` circular dependency while matching spec file location.

---

## D-004: Poet WebSocket client isolation

**Decision:** `PoetStreamClient` uses its own WebSocket lifecycle, not `WebSocketClient` / `parseStreamEvent`.

**Rationale:** Poet envelope protocol (`message_type`, `message_id`, …) is incompatible with unified stream event parsing.

---

## D-005: Musical context injection into Poet client

**Decision:** `PoetStreamClient` constructor accepts `getMusicalContext: () => MusicalContextSnapshot`. `WorkspaceLayout` sets this to call `buildMusicalContextSnapshot(selectMusicalContextInput())`.

**Rationale:** Keeps stream package free of state imports; stamps context at send time per spec.

---

## D-006: Command palette shortcut rebinding

**Decision:** Poet shortcuts take spec assignments where free. Conflicts rebind existing commands:

| Conflicting command | Old shortcut | New shortcut |
|--------------------|--------------|--------------|
| Toggle Analysis Panel | `mod+Shift+A` | `mod+Shift+Y` |
| Open Ledger Panel | `mod+Shift+L` | `mod+Shift+E` |
| Toggle Piano Roll | `mod+Shift+P` | `mod+Shift+U` |

Poet commands use spec shortcuts: `mod+Shift+A` (Accept All), `mod+Shift+L` (Generate Line), `mod+Shift+P` (Toggle Poet).

**Rationale:** Spec mandates Poet shortcuts; minimal disruption to other commands.

---

## D-007: Poet panel styling

**Decision:** Poet sub-components use Tailwind utility classes only. Extend `tailwind.config.js` content paths to include `packages/ui/src`.

**Rationale:** Spec prohibits inline styles in Poet components. Existing panels retain current inline-style pattern.

---

## D-008: Connection map extension

**Decision:** Add `poet` to `ServiceName` / `ConnectionMap`. Poet transport bar indicator uses existing `BackendStatusIndicator` pattern when connected.

**Rationale:** Consistent with other backend services; poet-store `PoetConnectionState` remains richer (`reconnecting`).

---

## D-009: Default Poet session bootstrap

**Decision:** On workspace init, connect Poet with `session_id = "studio-session-1"` and `user_id` from auth store (fallback `"local-user"`).

**Rationale:** No separate Poet session creation UI in spec; enables panel immediately in dev with fixtures/mock.

---

## D-010: NotificationToast implementation

**Decision:** Minimal toast stack in `packages/ui/overlays/NotificationToast.tsx` with module-level `showNotification()` API. Poet client calls on reconnect exhaustion.

**Rationale:** Spec references existing component that does not exist; smallest additive surface.

---

## D-011: Doctor panel Compose mode

**Decision:** Add fourth Doctor panel mode `compose` embedding `PoetPanel` via `DoctorComposeMode.tsx`. Poet right-panel tab remains as alternate surface.

**Rationale:** Ecosystem spec requires Poet generation in Doctor panel, not a chat UI. Reuses existing Poet sub-components and `poet-store` without duplicating supervision UI.

---

## D-012: MusicalContextCache

**Decision:** `MusicalContextCache` in `packages/state` updates on `theory_monte_carlo_frame` stream events. `getMusicalContextForGeneration()` is the single source for `LLMIntentSignal.musical_context`.

**Rationale:** Spec requires caching latest CMTE frame; transport-only fallback when Theory unavailable.

---

## D-013: Stream audit publish

**Decision:** `LLMIntentSignal` and `SupervisionAction` publish via `UnifiedStream.publishAudit()` when `VITE_STUDIO_ENABLE_STREAM=true`. Envelope format in `ecosystem-stream.ts`.

**Rationale:** WebSocket is low-latency path; Stream is audit/replay system of record.

---

## D-014: Environment variable naming

**Decision:** Primary env vars use `VITE_STUDIO_*` prefix (Vite requirement). Legacy `VITE_POET_*` and `VITE_CONSEQUENCE_STREAM_*` remain as fallbacks. Poet default port is `8000` per Poet standalone spec.

**Rationale:** Aligns with integration prompt while preserving existing dev setups.

---

## D-015: Phase 19 keymap settings

**Decision:** `keymap-store` holds per-command overrides. `KeymapSettingsPanel` overlay + `useGlobalShortcuts` in studio-desktop apply overrides globally. Command `view.keymap-settings` (`mod+Shift+K`).

**Rationale:** Spec Phase 19 requires customizable shortcuts without breaking command palette definitions.
