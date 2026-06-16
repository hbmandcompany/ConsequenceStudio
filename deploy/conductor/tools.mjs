/** Tool implementations — Theory, Doctor, Monte Carlo mood, Poet generate. */

const MOOD_CHORD_BIAS = {
  dark: [9, 5, 0],
  bright: [0, 7, 4],
  groovy: [7, 0, 5],
  ambient: [0, 9, 5],
  neutral: [0, 7, 5, 9],
};

export async function theorySnapshot(env, sessionId) {
  const base = env.THEORY_HTTP_URL.replace(/\/$/, "");
  const token = env.THEORY_AUTH_TOKEN;
  const id = sessionId ?? "studio-session-1";
  const headers = { Authorization: `Bearer ${token}` };
  const analysisRes = await fetch(`${base}/sessions/${id}/analysis`, { headers });
  const analysis = analysisRes.ok ? await analysisRes.json() : null;
  const profileRes = await fetch(`${base}/sessions/${id}/monte-carlo-profile`, { headers });
  const profile = profileRes.ok ? await profileRes.json() : null;
  return { session_id: id, analysis, monte_carlo_profile: profile };
}

export async function setMonteCarloMood(env, sessionId, profile) {
  const base = env.THEORY_HTTP_URL.replace(/\/$/, "");
  const token = env.THEORY_AUTH_TOKEN;
  const id = sessionId ?? "studio-session-1";
  const res = await fetch(`${base}/sessions/${id}/monte-carlo-profile`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error(`monte-carlo-profile update failed: ${res.status}`);
  return res.json();
}

export async function doctorDiagnose(env, sessionId, userComplaint) {
  const base = env.DOCTOR_HTTP_URL.replace(/\/$/, "");
  const res = await fetch(`${base}/diagnose`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId ?? "studio-session-1", complaint: userComplaint }),
  });
  if (!res.ok) throw new Error(`doctor diagnose failed: ${res.status}`);
  return res.json();
}

export async function doctorInstruct(env, sessionId, instruction) {
  const base = env.DOCTOR_HTTP_URL.replace(/\/$/, "");
  const res = await fetch(`${base}/instruct`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId ?? "studio-session-1", instruction }),
  });
  if (!res.ok) throw new Error(`doctor instruct failed: ${res.status}`);
  return res.json();
}

export async function poetGenerate(env, { sessionId, target, musicalContext, constraints, creativeBrief }) {
  const prompt = buildPoetPrompt(target, musicalContext, constraints, creativeBrief);
  const text = await completeText(env, prompt, { maxTokens: 512 });
  return { generation_target: target ?? "VERSE", text, model_id: env.MODEL_ID ?? "Qwen/Qwen2.5-72B-Instruct" };
}

function buildPoetPrompt(target, musicalContext, constraints, brief) {
  const ctx = musicalContext
    ? `Key root ${musicalContext.current_key_root} ${musicalContext.current_key_mode}, tension ${musicalContext.harmonic_tension?.toFixed?.(2) ?? musicalContext.harmonic_tension}, tempo ${musicalContext.tempo_bpm} BPM.`
    : "";
  const cons = constraints
    ? `Rhyme: ${constraints.rhyme_scheme ?? "free"}. Syllables: ${(constraints.target_syllable_counts ?? []).join(",") || "flexible"}.`
    : "";
  return `You are ConsequencePoet. Write ${target ?? "VERSE"} lyrics for a DAW session.\n${ctx}\n${cons}\nBrief: ${brief ?? ""}\nOutput only the lyrics, line by line.`;
}

export async function completeText(env, userPrompt, { system, maxTokens = 1024, tools, onToolCall } = {}) {
  const vllm = env.VLLM_BASE_URL?.replace(/\/$/, "");
  if (!vllm) {
    return devStubReply(userPrompt);
  }
  try {
    return await vllmComplete(vllm, env.MODEL_ID, userPrompt, { system, maxTokens, tools, onToolCall });
  } catch (err) {
    console.warn("[conductor] vLLM unavailable, using dev stub:", err?.message ?? err);
    return devStubReply(userPrompt);
  }
}

function devStubReply(userPrompt) {
  const preview = String(userPrompt).replace(/\s+/g, " ").trim().slice(0, 160);
  return [
    "I'm running in **local dev mode** — Qwen/vLLM isn't connected on this machine.",
    "",
    preview ? `You asked: "${preview}${userPrompt.length > 160 ? "…" : ""}"` : "",
    "",
    "The Studio UI, tracks, mixer, and Theory engine still work. For full AI replies, deploy vLLM and set `VLLM_BASE_URL` when starting the conductor.",
    "",
    "Try @doctor or @analysis context tags once those services are online.",
  ]
    .filter(Boolean)
    .join("\n");
}

async function vllmComplete(base, model, userPrompt, { system, maxTokens, tools, onToolCall }) {
  const messages = [
    { role: "system", content: system ?? CONDUCTOR_SYSTEM },
    { role: "user", content: userPrompt },
  ];
  for (let round = 0; round < 6; round++) {
    const body = {
      model: model ?? "Qwen/Qwen2.5-72B-Instruct",
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
      stream: false,
    };
    if (tools?.length) body.tools = tools;

    const res = await fetch(`${base}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`vLLM ${res.status}`);
    const data = await res.json();
    const choice = data.choices?.[0];
    const msg = choice?.message;
    if (!msg) throw new Error("empty vLLM response");

    if (msg.tool_calls?.length && onToolCall) {
      messages.push(msg);
      for (const tc of msg.tool_calls) {
        const args = JSON.parse(tc.function.arguments ?? "{}");
        const result = await onToolCall(tc.function.name, args);
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }
      continue;
    }
    return msg.content ?? "";
  }
  throw new Error("tool loop exceeded");
}

export const CONDUCTOR_SYSTEM = `You are the Consequence Studio conductor — one brain directing Theory (harmonic analysis), Doctor (diagnose/fix melodies), Monte Carlo (mood/groove bias), and Poet (lyrics). Use tools when the user asks about harmony, why a part feels wrong, mood/groove, or lyrics. Be direct and musical, not generic.`;

export const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "theory_snapshot",
      description: "Get current CMTE theory analysis and monte carlo profile for the session.",
      parameters: { type: "object", properties: { session_id: { type: "string" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "set_monte_carlo_mood",
      description: "Bias Monte Carlo progression walks toward a mood/groove (dark, bright, groovy, ambient, neutral).",
      parameters: {
        type: "object",
        properties: {
          mood: { type: "string", enum: ["dark", "bright", "groovy", "ambient", "neutral"] },
          groove_weight: { type: "number", minimum: 0, maximum: 1 },
          tension_bias: { type: "number", minimum: -1, maximum: 1 },
        },
        required: ["mood"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "doctor_diagnose",
      description: "Diagnose why the user dislikes a melody, sample, or harmonic choice.",
      parameters: {
        type: "object",
        properties: {
          complaint: { type: "string" },
          session_id: { type: "string" },
        },
        required: ["complaint"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "doctor_instruct",
      description: "Send a fix instruction to ConsequenceDoctor for harmonic/melodic corrections.",
      parameters: {
        type: "object",
        properties: {
          instruction: { type: "string" },
          session_id: { type: "string" },
        },
        required: ["instruction"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "poet_generate",
      description: "Generate lyrics for verse, hook, bridge, etc.",
      parameters: {
        type: "object",
        properties: {
          target: { type: "string", enum: ["VERSE", "HOOK", "BRIDGE", "ADLIB", "LINE", "FREE"] },
          creative_brief: { type: "string" },
          session_id: { type: "string" },
        },
      },
    },
  },
];

export function createToolRunner(env, sessionId, studioContext) {
  return async (name, args) => {
    switch (name) {
      case "theory_snapshot":
        return theorySnapshot(env, args.session_id ?? sessionId);
      case "set_monte_carlo_mood":
        return setMonteCarloMood(env, args.session_id ?? sessionId, {
          mood: args.mood ?? "neutral",
          groove_weight: args.groove_weight ?? 0.65,
          tension_bias: args.tension_bias ?? 0,
        });
      case "doctor_diagnose":
        return doctorDiagnose(env, args.session_id ?? sessionId, args.complaint ?? "");
      case "doctor_instruct":
        return doctorInstruct(env, args.session_id ?? sessionId, args.instruction ?? "");
      case "poet_generate":
        return poetGenerate(env, {
          sessionId: args.session_id ?? sessionId,
          target: args.target,
          musicalContext: studioContext?.musical_context,
          constraints: studioContext?.constraints,
          creativeBrief: args.creative_brief,
        });
      default:
        return { error: `unknown tool ${name}` };
    }
  };
}

export { MOOD_CHORD_BIAS };
