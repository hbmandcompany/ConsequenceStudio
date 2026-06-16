# ConsequenceStudio — Ecosystem Integration

ConsequenceStudio is the DAW-grade creator interface. It orchestrates **Consequence Conductor** (Qwen LLM), ConsequenceTheory, ConsequenceDoctor, ConsequencePoet, ConsequenceStream, and ConsequenceLedger via typed clients in `packages/stream`.

## Ecosystem map

| Repo / Service | Role | Studio relationship |
|----------------|------|---------------------|
| **ConsequenceStudio** (this repo) | DAW UI, supervision, session orchestration | Primary application |
| **Consequence Conductor** | Qwen2.5-72B orchestrator — diagnosis, lyrics, mood, tool routing | **Studio calls LLM directly** for Assistant chat, Poet, and Doctor guidance |
| **ConsequenceTheory** | CMTE analysis, Monte Carlo progression, mood/groove bias | Conductor tool: `theory_snapshot`, `set_monte_carlo_mood` |
| **ConsequenceDoctor** | Harmonic/melodic diagnostics and fix suggestions | Conductor tool: `doctor_diagnose`, `doctor_instruct` |
| **ConsequencePoet** | Lyric generation surface (same conductor backend) | Conductor tool: `poet_generate`; WS `/ws/{session_id}` |
| **ConsequenceStream** | Lamport-ordered event bus, replay | Publish/subscribe for coordination |
| **ConsequenceLedger** | AI usage metering | Studio displays cost from Ledger events |

```
                    ┌─────────────────────┐
                    │  ConsequenceStudio  │
                    │  (DAW + Assistant)  │
                    └─────────┬───────────┘
                              │ HTTP /chat + WS /ws
                    ┌─────────▼───────────┐
                    │ Consequence Conductor│
                    │ Qwen2.5-72B-Instruct │
                    └─────────┬───────────┘
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
      ConsequenceTheory  ConsequenceDoctor  (internal Poet)
```

## System boundaries

- **Studio** owns creator UX, supervision UI, and session identity.
- **Conductor** owns all LLM inference — composition, diagnosis narration, lyric generation, and orchestration. **Studio SHOULD call the Conductor LLM API** for Assistant, Poet, and Doctor-guided workflows.
- **Theory** owns musical analysis and Monte Carlo walks (mood/groove dataset bias). The LLM steers Theory via `set_monte_carlo_mood`; it does not replace CMTE math.
- **Doctor** owns concrete harmonic diagnostics and ghost-note fixes. The LLM interprets user intent and invokes Doctor tools.
- **Stream** is the system of record for cross-service audit and replay.

## Conductor tools

| Tool | Purpose |
|------|---------|
| `theory_snapshot` | Read CMTE analysis + Monte Carlo profile |
| `set_monte_carlo_mood` | Bias groove/mood (`dark`, `bright`, `groovy`, `ambient`, `neutral`) |
| `doctor_diagnose` | Explain why a melody/sample feels wrong |
| `doctor_instruct` | Send fix instructions to Doctor |
| `poet_generate` | Generate lyrics (verse, hook, bridge, …) |

## Integration paths

### Path 1: Conductor HTTP + WebSocket (required)

- Assistant chat: `POST {CONDUCTOR_HTTP_URL}/chat` (NDJSON token stream)
- Poet: `{CONDUCTOR_WS_URL}/ws/{session_id}`
- Implementation: `packages/stream/src/agent-client.ts`, `poet-client.ts`
- UI: `AssistantPanel`, Doctor **Compose** mode, Poet panel

### Path 2: ConsequenceStream (production coordination)

- Toggle: `VITE_STUDIO_ENABLE_STREAM=true`
- Studio publishes `LLMIntentSignal` and `SupervisionAction` for audit/replay

## Configuration

```env
# Theory (DigitalOcean or local stub)
VITE_THEORY_ENGINE_HTTP_URL=http://168.144.12.221
VITE_THEORY_ENGINE_AUTH_TOKEN=your-cmte-secret

# Conductor + Poet (Lambda GPU or local dev on :1420)
VITE_STUDIO_CONDUCTOR_HTTP_URL=http://YOUR_LAMBDA_IP:8000
VITE_STUDIO_CONDUCTOR_AUTH_TOKEN=your-conductor-secret
VITE_STUDIO_POET_WS_URL=ws://YOUR_LAMBDA_IP:8000
VITE_STUDIO_POET_HTTP_URL=http://YOUR_LAMBDA_IP:8000

# Doctor (optional stub on :8082)
VITE_DOCTOR_WS_URL=ws://YOUR_LAMBDA_IP:8082/doctor
```

## Dev workflow

1. Set all `VITE_*` URLs in `apps/studio-desktop/.env` (Theory on DO, Conductor on Lambda).
2. `pnpm --filter @consequence/studio-desktop dev`
3. Assistant, Poet, and Doctor require live backends — no local stubs.

## Lambda Labs deploy

See `deploy/lambda/setup.sh`. Use SSH public key from `deploy/lambda/consequence_lambda.pub`.

## Implementation map

| Component | Location |
|-----------|----------|
| Conductor agent client | `packages/stream/src/agent-client.ts` |
| Conductor server | `deploy/conductor/server.mjs` |
| Tool implementations | `deploy/conductor/tools.mjs` |
| Doctor service | `deploy/doctor/server.mjs` |
| Assistant UI | `apps/studio-desktop/.../AssistantPanel.tsx` |
