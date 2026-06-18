# Production: downloaded app + AI assistant

Downloaded ConsequenceStudio installers are **static builds**. Service URLs and auth tokens are **baked in at CI build time** via `VITE_*` env vars.

## Architecture

```
User's machine (Tauri app)
  → http://165.227.252.58:8001/conductor/chat   (Assistant + MIDI)
  → http://165.227.252.58:8001/theory/...       (CMTE analysis)
  → ws://165.227.252.58:8001/stream             (event bus)
```

All traffic goes through the **ConsequenceStream gateway** on DigitalOcean (`gitlab.com/consequencesoftware/stream`).

## CI secrets required before tagging v0.1.1+

| Secret / variable | GitHub Actions (ConsequenceStudio) | GitLab CI (studio) |
|-------------------|-----------------------------------|-------------------|
| `VITE_STUDIO_CONDUCTOR_AUTH_TOKEN` | Repository secret (required) | CI variable (masked) |
| `VITE_THEORY_ENGINE_AUTH_TOKEN` | Repository secret | CI variable (masked) |
| `GH_RELEASE_TOKEN` | Repository secret | `GITHUB_TOKEN` |

Values must match what the **Stream gateway** and **Theory** service expect.

Build jobs set:

- `VITE_STREAM_GATEWAY_URL=http://165.227.252.58:8001`
- `VITE_STREAM_HUB_MODE=true`
- `VITE_STUDIO_ENABLE_STREAM=true`

**Do not** set `VITE_STREAM_GATEWAY_PROXY` in release builds (browser-only dev proxy).

## Assistant → draggable MIDI

1. User asks Assistant to compose (e.g. “write a dark 4-bar bassline”).
2. Conductor calls `generate_midi` → streams `{ type: "midi_fragment", preview_notes }` in NDJSON.
3. Assistant panel shows a **draggable MIDI card** with score preview.
4. User drags onto **arrangement** or **piano roll** (same drop target as Floppydisk).

## Ship a production fix

```bash
git tag v0.1.1
git push origin v0.1.1
```

GitHub Actions on ConsequenceStudio builds installers with DO URLs embedded and publishes to `hbmandcompany/Consequence` Releases.

## Stream repo must provide

- `GET /health` — conductor status **online**
- `POST /conductor/chat` — proxied to Conductor service
- `WS /conductor/ws/:sessionId` — Poet
- Theory, Doctor, Stream routes (see `packages/stream/src/config.ts`)

Until Stream deploys conductor, Assistant returns errors even with a correct app build.
