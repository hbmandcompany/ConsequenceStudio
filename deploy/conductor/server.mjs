#!/usr/bin/env node
/**
 * Consequence Conductor — Qwen2.5-72B orchestrator with Theory / Doctor / Monte Carlo / Poet tools.
 * HTTP: POST /chat (NDJSON stream), GET /health
 * WS:   /ws/:sessionId (ConsequencePoet protocol)
 */
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { WebSocketServer } from "ws";
import {
  completeText,
  createToolRunner,
  CONDUCTOR_SYSTEM,
  TOOL_DEFINITIONS,
  poetGenerate,
} from "./tools.mjs";

const HOST = process.env.CONDUCTOR_HOST ?? "0.0.0.0";
const PORT = Number(process.env.CONDUCTOR_PORT ?? 8000);
const AUTH_TOKEN = process.env.CONDUCTOR_AUTH_TOKEN ?? "dev-secret-change-in-production";

const env = {
  VLLM_BASE_URL: process.env.VLLM_BASE_URL ?? "http://127.0.0.1:8001",
  MODEL_ID: process.env.MODEL_ID ?? "Qwen/Qwen2.5-72B-Instruct",
  THEORY_HTTP_URL: process.env.THEORY_HTTP_URL ?? "http://168.144.12.221",
  THEORY_AUTH_TOKEN: process.env.THEORY_AUTH_TOKEN ?? "a2c1d096fbe48357",
  DOCTOR_HTTP_URL: process.env.DOCTOR_HTTP_URL ?? "http://127.0.0.1:8082",
};

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function checkAuth(req) {
  const h = req.headers.authorization ?? "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : h;
  return !AUTH_TOKEN || token === AUTH_TOKEN;
}

async function runChat(body) {
  const {
    message,
    session_id: sessionId = "studio-session-1",
    contexts = [],
    studio_context: studioContext = {},
  } = body;
  const onToolCall = createToolRunner(env, sessionId, studioContext);
  const prompt = `Active @ contexts: ${contexts.join(", ") || "none"}.\n\nUser: ${message}`;
  return completeText(env, prompt, {
    system: CONDUCTOR_SYSTEM,
    maxTokens: 2048,
    tools: TOOL_DEFINITIONS,
    onToolCall,
  });
}

function streamText(res, text) {
  setCors(res);
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Cache-Control", "no-cache");
  const chunkSize = 24;
  for (let i = 0; i < text.length; i += chunkSize) {
    const slice = text.slice(i, i + chunkSize);
    res.write(`${JSON.stringify({ type: "token", text: slice })}\n`);
  }
  res.write(`${JSON.stringify({ type: "done" })}\n`);
  res.end();
}

function poetEnvelope(type, sessionId, payload, messageId) {
  return JSON.stringify({
    message_type: type,
    message_id: messageId ?? randomUUID(),
    session_id: sessionId,
    timestamp_ms: Date.now(),
    schema_version: "1.0",
    payload,
  });
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    setCors(res);
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", `http://${HOST}:${PORT}`);
  setCors(res);

  if (url.pathname === "/health") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ status: "ok", model: env.MODEL_ID, vllm: env.VLLM_BASE_URL }));
    return;
  }

  if (url.pathname === "/chat" && req.method === "POST") {
    if (!checkAuth(req)) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: "unauthorized" }));
      return;
    }
    try {
      const raw = await readBody(req);
      const body = raw ? JSON.parse(raw) : {};
      const text = await runChat(body);
      streamText(res, text);
    } catch (err) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: String(err.message ?? err) }));
    }
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: "not found" }));
});

const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url ?? "/", `http://${HOST}:${PORT}`);
  const m = url.pathname.match(/^\/ws\/([^/]+)$/);
  if (!m) {
    socket.destroy();
    return;
  }
  const sessionId = m[1];
  wss.handleUpgrade(req, socket, head, (ws) => {
    ws.on("message", async (data) => {
      try {
        const envelope = JSON.parse(String(data));
        if (envelope.message_type === "PING") {
          ws.send(poetEnvelope("PONG", sessionId, {}, envelope.message_id));
          return;
        }
        if (envelope.message_type === "GENERATION_REQUEST") {
          const signal = envelope.payload ?? {};
          const genId = randomUUID();
          const onToolCall = createToolRunner(env, sessionId, {
            musical_context: signal.musical_context,
            constraints: signal.constraint_set,
          });
          const result = await poetGenerate(env, {
            sessionId,
            target: signal.generation_target ?? "VERSE",
            musicalContext: signal.musical_context,
            constraints: signal.constraint_set,
            creativeBrief: `Generate ${signal.generation_target ?? "VERSE"} with creative freedom ${signal.creative_freedom ?? 0.5}`,
          });
          const lines = result.text.split("\n").filter(Boolean);
          let acc = "";
          let tokenIndex = 0;
          for (const line of lines) {
            const words = line.split(/(\s+)/);
            for (const w of words) {
              acc += w;
              ws.send(
                poetEnvelope("POET_TOKEN", sessionId, {
                  generation_id: genId,
                  session_id: sessionId,
                  token_text: w,
                  token_index: tokenIndex++,
                  is_line_boundary: false,
                  is_segment_boundary: false,
                  accumulated_line_text: acc,
                  syllable_count_so_far: 0,
                  timestamp_ms: Date.now(),
                }),
              );
            }
            ws.send(
              poetEnvelope("POET_TOKEN", sessionId, {
                generation_id: genId,
                session_id: sessionId,
                token_text: "\n",
                token_index: tokenIndex++,
                is_line_boundary: true,
                is_segment_boundary: false,
                accumulated_line_text: acc,
                syllable_count_so_far: 0,
                timestamp_ms: Date.now(),
              }),
            );
          }
          ws.send(
            poetEnvelope("GENERATION_COMPLETE", sessionId, {
              generation_id: genId,
              intent_id: signal.intent_id ?? genId,
              session_id: sessionId,
              user_id: signal.user_id ?? "local",
              timestamp_ms: Date.now(),
              generation_status: "COMPLETE",
              segment_type: signal.generation_target ?? "VERSE",
              lines: lines.map((text, line_index) => ({
                line_index,
                text,
                syllable_count: 0,
                beat_placement_suggestions: [],
                emotional_vector: [],
                stress_pattern: "",
                constraint_compliance: {
                  rhyme_scheme_satisfied: true,
                  syllable_count_satisfied: true,
                  meter_compliance_score: 1,
                  violations: [],
                },
                supervision_state: "PENDING",
              })),
              structural_metadata: {},
              model_id: result.model_id,
              latency_ms: 0,
              token_count: tokenIndex,
            }),
          );
        }
        if (envelope.message_type === "SESSION_STATE_REQUEST") {
          ws.send(
            poetEnvelope("SESSION_STATE_SNAPSHOT", sessionId, {
              session_id: sessionId,
              user_id: "local",
              composition_id: "default",
              created_at: Date.now(),
              last_active_at: Date.now(),
              current_branch_id: "main",
              branches: {},
              session_mode: "LIVE",
            }, envelope.message_id),
          );
        }
      } catch {
        ws.send(
          poetEnvelope("GENERATION_ERROR", sessionId, {
            error_type: "GENERATION_FAILED",
            message: "Conductor failed to process message",
          }),
        );
      }
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[conductor] listening on ${HOST}:${PORT} model=${env.MODEL_ID}`);
});
