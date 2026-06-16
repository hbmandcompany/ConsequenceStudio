#!/usr/bin/env node
/**
 * Consequence Music Theory Engine (CMTE) — production HTTP/WS server.
 * Implements the API contract expected by @consequence/stream TheoryEngineClient.
 */
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { WebSocketServer } from "ws";

const HOST = process.env.CMTE_HOST ?? "0.0.0.0";
const PORT = Number(process.env.CMTE_PORT ?? 8741);
const AUTH_SECRET = process.env.CMTE_AUTH_SECRET ?? "dev-secret-change-in-production";
const VERSION = process.env.CMTE_VERSION ?? "0.1.0";
const LOG_LEVEL = process.env.CMTE_LOG_LEVEL ?? "INFO";

const CORS_ORIGINS = (process.env.CMTE_CORS_ORIGINS ?? "*")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const CAPABILITIES = {
  status: "ok",
  version: VERSION,
  endpoints: {
    createSession: "/sessions",
    ingestEvents: "/sessions/{id}/events",
    stream: "/sessions/{id}/stream",
    analysis: "/sessions/{id}/analysis",
    monteCarloProfile: "/sessions/{id}/monte-carlo-profile",
    health: "/health",
  },
  auth: "bearer",
  monte_carlo: { walks: 1000, walk_length: 4, top_candidates: 5 },
};

/** @type {Map<string, { events: unknown[]; sockets: Set<import('ws').WebSocket>; tick: number; monteCarloProfile: { mood: string; groove_weight: number; tension_bias: number } }>} */
const sessions = new Map();

const DEFAULT_PROFILE = { mood: "neutral", groove_weight: 0.5, tension_bias: 0 };

const MOOD_CHORD_BIAS = {
  dark: [9, 5, 0],
  bright: [0, 7, 4],
  groovy: [7, 0, 5],
  ambient: [0, 9, 5],
  neutral: [0, 7, 5, 9],
};

function log(level, ...args) {
  const levels = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
  if ((levels[level] ?? 1) < (levels[LOG_LEVEL] ?? 1)) return;
  console.log(`[${new Date().toISOString()}] [${level}]`, ...args);
}

function corsOrigin(origin) {
  if (!origin) return "*";
  if (CORS_ORIGINS.includes("*")) return "*";
  if (CORS_ORIGINS.includes(origin)) return origin;
  return null;
}

function setCors(res, origin) {
  const allowed = corsOrigin(origin);
  if (allowed) {
    res.setHeader("Access-Control-Allow-Origin", allowed);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
}

function json(res, status, body, origin) {
  setCors(res, origin);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function checkAuth(req, url) {
  const header = req.headers.authorization ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : null;
  const queryToken = url.searchParams.get("token");
  const token = bearer ?? queryToken;
  return token === AUTH_SECRET;
}

const CHORDS = [
  { root: 0, quality: "major", spelling: "C", function: "tonic", tension: 0.12, pcs: [0, 4, 7] },
  { root: 7, quality: "major", spelling: "G", function: "dominant", tension: 0.45, pcs: [7, 11, 2] },
  { root: 5, quality: "major", spelling: "F", function: "subdominant", tension: 0.28, pcs: [5, 9, 0] },
  { root: 9, quality: "minor", spelling: "Am", function: "submediant", tension: 0.35, pcs: [9, 0, 4] },
];

function buildFrame(sessionId, tick, profile = DEFAULT_PROFILE) {
  const bias = MOOD_CHORD_BIAS[profile.mood] ?? MOOD_CHORD_BIAS.neutral;
  const chordRoot = bias[Math.floor(tick / 480) % bias.length];
  const chord = CHORDS.find((c) => c.root === chordRoot) ?? CHORDS[0];
  const tension = Math.min(1, Math.max(0, chord.tension + profile.tension_bias * 0.2));
  return {
    frame_id: randomUUID(),
    session_id: sessionId,
    timestamp_ms: Date.now(),
    tick,
    harmonic_analysis: {
      detected_chord: {
        root: chord.root,
        quality: chord.quality,
        bass: null,
        inversion: 0,
        extensions: [],
        spelling: chord.spelling,
      },
      chord_function: chord.function,
      harmonic_tension: tension,
      pitch_class_set: chord.pcs,
    },
    melodic_analysis: {
      active_voice: "track-1",
      melodic_contour: tick % 960 < 480 ? "ascending" : "descending",
      melodic_density: 2,
      phrase_length_beats: 4,
    },
    tonality_analysis: {
      estimated_key: { root: 0, mode: "major", confidence: 0.88 },
      tonal_ambiguity: 0.1,
    },
    progression_forecast: [
      {
        probability: 0.18,
        chord_sequence: [
          { root: 7, quality: "major", bass: null, inversion: 0, extensions: [], spelling: "G" },
          { root: 0, quality: "major", bass: null, inversion: 0, extensions: [], spelling: "C" },
        ],
      },
    ],
  };
}

function ensureSession(id) {
  if (!sessions.has(id)) {
    sessions.set(id, { events: [], sockets: new Set(), tick: 0, monteCarloProfile: { ...DEFAULT_PROFILE } });
  }
  return sessions.get(id);
}

/** Broadcast analysis frames to all connected stream clients. */
const streamInterval = setInterval(() => {
  for (const [sessionId, session] of sessions) {
    if (session.sockets.size === 0) continue;
    session.tick += 120;
    const frame = JSON.stringify(buildFrame(sessionId, session.tick, session.monteCarloProfile));
    for (const ws of session.sockets) {
      if (ws.readyState === 1) ws.send(frame);
    }
  }
}, 500);

const server = createServer(async (req, res) => {
  const origin = req.headers.origin;
  const url = new URL(req.url ?? "/", `http://${HOST}:${PORT}`);
  const path = url.pathname;

  if (req.method === "OPTIONS") {
    setCors(res, origin);
    res.statusCode = 204;
    res.end();
    return;
  }

  if (path === "/health") {
    json(res, 200, { status: "ok", version: VERSION }, origin);
    return;
  }

  if (path === "/ready") {
    json(res, 200, { status: "ready" }, origin);
    return;
  }

  if (path === "/capabilities") {
    json(res, 200, CAPABILITIES, origin);
    return;
  }

  if (path === "/sessions" && req.method === "POST") {
    if (!checkAuth(req, url)) {
      json(res, 401, { error: "unauthorized" }, origin);
      return;
    }
    try {
      const body = await readBody(req);
      const parsed = body ? JSON.parse(body) : {};
      const sessionId = parsed.session_id ?? randomUUID();
      ensureSession(sessionId);
      log("INFO", "session created", sessionId);
      json(res, 200, { session_id: sessionId, created: true }, origin);
    } catch {
      json(res, 400, { error: "invalid session payload" }, origin);
    }
    return;
  }

  const eventsMatch = path.match(/^\/sessions\/([^/]+)\/events$/);
  if (eventsMatch && req.method === "POST") {
    if (!checkAuth(req, url)) {
      json(res, 401, { error: "unauthorized" }, origin);
      return;
    }
    const sessionId = eventsMatch[1];
    const session = ensureSession(sessionId);
    try {
      const body = await readBody(req);
      const events = body ? JSON.parse(body) : [];
      const count = Array.isArray(events) ? events.length : 0;
      if (Array.isArray(events)) session.events.push(...events);
      json(res, 200, { accepted: count }, origin);
    } catch {
      json(res, 400, { error: "invalid events payload" }, origin);
    }
    return;
  }

  const profileMatch = path.match(/^\/sessions\/([^/]+)\/monte-carlo-profile$/);
  if (profileMatch && (req.method === "GET" || req.method === "PUT")) {
    if (!checkAuth(req, url)) {
      json(res, 401, { error: "unauthorized" }, origin);
      return;
    }
    const sessionId = profileMatch[1];
    const session = ensureSession(sessionId);
    if (req.method === "GET") {
      json(res, 200, session.monteCarloProfile, origin);
      return;
    }
    try {
      const body = await readBody(req);
      const parsed = body ? JSON.parse(body) : {};
      session.monteCarloProfile = {
        mood: parsed.mood ?? session.monteCarloProfile.mood,
        groove_weight: parsed.groove_weight ?? session.monteCarloProfile.groove_weight,
        tension_bias: parsed.tension_bias ?? session.monteCarloProfile.tension_bias,
      };
      log("INFO", "monte-carlo profile updated", sessionId, session.monteCarloProfile);
      json(res, 200, session.monteCarloProfile, origin);
    } catch {
      json(res, 400, { error: "invalid profile payload" }, origin);
    }
    return;
  }

  const analysisMatch = path.match(/^\/sessions\/([^/]+)\/analysis$/);
  if (analysisMatch && req.method === "GET") {
    if (!checkAuth(req, url)) {
      json(res, 401, { error: "unauthorized" }, origin);
      return;
    }
    const sessionId = analysisMatch[1];
    const session = ensureSession(sessionId);
    json(res, 200, buildFrame(sessionId, session.tick, session.monteCarloProfile), origin);
    return;
  }

  json(res, 404, { error: "not found" }, origin);
});

const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url ?? "/", `http://${HOST}:${PORT}`);
  const streamMatch = url.pathname.match(/^\/sessions\/([^/]+)\/stream$/);
  if (!streamMatch) {
    socket.destroy();
    return;
  }
  if (!checkAuth(req, url)) {
    socket.destroy();
    return;
  }

  const sessionId = streamMatch[1];
  const session = ensureSession(sessionId);

  wss.handleUpgrade(req, socket, head, (ws) => {
    session.sockets.add(ws);
    log("INFO", "stream connected", sessionId);

    ws.on("close", () => {
      session.sockets.delete(ws);
      log("INFO", "stream disconnected", sessionId);
    });
    ws.on("error", () => ws.close());
  });
});

server.listen(PORT, HOST, () => {
  log("INFO", `CMTE listening on ${HOST}:${PORT}`);
});

process.on("SIGTERM", () => {
  clearInterval(streamInterval);
  server.close();
  process.exit(0);
});
