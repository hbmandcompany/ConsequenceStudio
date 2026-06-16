#!/usr/bin/env node
/** ConsequenceDoctor — diagnostics derived from live CMTE theory analysis. */
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { WebSocketServer } from "ws";

const HOST = process.env.DOCTOR_HOST ?? "0.0.0.0";
const PORT = Number(process.env.DOCTOR_PORT ?? 8082);
const THEORY_HTTP_URL = (process.env.THEORY_HTTP_URL ?? "http://168.144.12.221").replace(/\/$/, "");
const THEORY_AUTH_TOKEN = process.env.THEORY_AUTH_TOKEN ?? "";

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function fetchTheoryAnalysis(sessionId) {
  const headers = THEORY_AUTH_TOKEN ? { Authorization: `Bearer ${THEORY_AUTH_TOKEN}` } : {};
  const res = await fetch(`${THEORY_HTTP_URL}/sessions/${sessionId}/analysis`, { headers });
  if (!res.ok) throw new Error(`theory analysis ${res.status}`);
  return res.json();
}

function diagnosticsFromTheory(analysis, complaint) {
  const diagnostics = [];
  const ha = analysis?.harmonic_analysis;
  const ma = analysis?.melodic_analysis;
  const ta = analysis?.tonality_analysis;
  const tension = ha?.harmonic_tension ?? 0;

  if (tension > 0.4) {
    diagnostics.push({
      id: randomUUID(),
      severity: "warning",
      headline: `High harmonic tension (${tension.toFixed(2)})`,
      explanation: `Detected ${ha?.detected_chord?.spelling ?? "chord"} functioning as ${ha?.chord_function ?? "unknown"}. ${complaint ? `Re: ${complaint}` : ""}`.trim(),
      category: "harmonic",
      resolved: false,
      bar: 1,
      beat: 1,
    });
  }
  if (ma?.melodic_contour === "flat" || ma?.melodic_density < 1.5) {
    diagnostics.push({
      id: randomUUID(),
      severity: "info",
      headline: "Low melodic motion",
      explanation: `Contour: ${ma?.melodic_contour ?? "unknown"}, density ${ma?.melodic_density ?? 0}.`,
      category: "melodic",
      resolved: false,
      bar: 1,
      beat: 1,
    });
  }
  if (ta?.tonal_ambiguity > 0.35) {
    diagnostics.push({
      id: randomUUID(),
      severity: "info",
      headline: "Tonal center is ambiguous",
      explanation: `Key confidence ${ta?.estimated_key?.confidence?.toFixed(2) ?? "?"}, ambiguity ${ta.tonal_ambiguity.toFixed(2)}.`,
      category: "structural",
      resolved: false,
      bar: 1,
      beat: 1,
    });
  }
  return diagnostics;
}

function buildSuggestions(analysis) {
  const chord = analysis?.harmonic_analysis?.detected_chord;
  const root = chord?.root ?? 60;
  return [
    {
      id: randomUUID(),
      headline: "Voice-leading resolution",
      explanation: "Stepwise motion to nearest chord tone on the downbeat.",
      preview_note_ids: [],
      ghost_notes: [
        { pitch: 60 + root, tick: 1920, duration: 240, velocity: 90 },
        { pitch: 60 + ((root + 2) % 12), tick: 2160, duration: 240, velocity: 85 },
      ],
    },
  ];
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${HOST}:${PORT}`);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (url.pathname === "/health") {
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (url.pathname === "/diagnose" && req.method === "POST") {
    const body = JSON.parse((await readBody(req)) || "{}");
    const sessionId = body.session_id ?? "studio-session-1";
    const analysis = await fetchTheoryAnalysis(sessionId);
    const diagnostics = diagnosticsFromTheory(analysis, body.complaint ?? "");
    res.end(
      JSON.stringify({
        summary: diagnostics.map((d) => d.headline).join("; ") || "No issues from current CMTE frame.",
        diagnostics,
        suggestions: buildSuggestions(analysis),
        analysis,
      }),
    );
    return;
  }

  if (url.pathname === "/instruct" && req.method === "POST") {
    const body = JSON.parse((await readBody(req)) || "{}");
    const sessionId = body.session_id ?? "studio-session-1";
    const analysis = await fetchTheoryAnalysis(sessionId);
    res.end(
      JSON.stringify({
        accepted: true,
        instruction: body.instruction,
        response: "Doctor applied instruction against live CMTE context.",
        suggestions: buildSuggestions(analysis),
      }),
    );
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: "not found" }));
});

const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url ?? "/", `http://${HOST}:${PORT}`);
  if (!url.pathname.endsWith("/doctor") && url.pathname !== "/doctor") {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, async (ws) => {
    try {
      const analysis = await fetchTheoryAnalysis("studio-session-1");
      for (const d of diagnosticsFromTheory(analysis, "")) {
        ws.send(JSON.stringify({ event_type: "doctor_diagnostic_event", payload: d }));
      }
    } catch {
      // no frames yet — client stays connected
    }
    ws.on("message", async (raw) => {
      try {
        const cmd = JSON.parse(String(raw));
        if (cmd.command === "execute") {
          const analysis = await fetchTheoryAnalysis("studio-session-1");
          for (const s of buildSuggestions(analysis)) {
            ws.send(JSON.stringify({ event_type: "doctor_suggestion_event", payload: s }));
          }
        }
      } catch {
        // ignore
      }
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[doctor] listening on ${HOST}:${PORT} theory=${THEORY_HTTP_URL}`);
});
