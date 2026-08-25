// Single AI provider: OpenRouter. Every model call in the app goes through
// this file and this file alone - it is the ONLY place OPENROUTER_API_KEY is
// read, and this module is never imported by anything client-facing.
//
// Model IDs are never hardcoded elsewhere in the app - callers ask for a
// *role* (PRIMARY / FAST / BALANCED / VISION / EMBEDDING) and this file
// resolves that role to whatever model is currently configured in env vars.
// That means swapping a model later is a .env change, not a code change.

const CHAT_URL = () => process.env.OPENROUTER_API_URL || "https://openrouter.ai/api/v1/chat/completions";
const EMBEDDINGS_URL = () => process.env.OPENROUTER_EMBEDDINGS_URL || "https://openrouter.ai/api/v1/embeddings";
const DEFAULT_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS || 45000);

// Server-side-only model configuration. Change models by editing .env, never
// by editing code. Defaults below match what's currently live on OpenRouter
// (verified against openrouter.ai at the time this was written) but WILL
// need re-checking periodically since free-tier model availability rotates.
export const MODELS = {
  PRIMARY: () => process.env.PRIMARY_MODEL || "nvidia/nemotron-3-super-120b-a12b:free",
  FAST: () => process.env.FAST_MODEL || "nvidia/nemotron-3.5-lightning:free",
  BALANCED: () => process.env.BALANCED_MODEL || "google/gemma-4-26b-a4b-it:free",
  VISION: () => process.env.VISION_MODEL || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
  EMBEDDING: () => process.env.EMBEDDING_MODEL || "nvidia/nemotron-3-embed-1b:free",
};

export function isLLMConfigured() {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

function configError() {
  const err = new Error("AI generation is not configured on the backend.");
  err.status = 503;
  err.code = "LLM_NOT_CONFIGURED";
  return err;
}

/** Calls exactly one model. Throws a tagged error (retryable or not) rather than ever leaking provider internals. */
async function callOneModel(model, { system, user, jsonMode, timeoutMs }) {
  if (!isLLMConfigured()) throw configError();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs || DEFAULT_TIMEOUT_MS);

  try {
    const body = {
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.4,
    };
    // Structured output: ask the model for a single JSON object (OpenAI-style
    // response_format requires a top-level object, not a bare array, so
    // callers wrap array payloads as { "questions": [...] }).
    if (jsonMode) body.response_format = { type: "json_object" };

    let res;
    try {
      res = await fetch(CHAT_URL(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          // Optional but recommended by OpenRouter for app attribution/leaderboards.
          "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
          "X-Title": "Exam Forge AI",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (networkErr) {
      const err = new Error(`Network error calling ${model}`);
      err.status = 504;
      err.retryable = true;
      throw err;
    }

    if (res.status === 429) {
      const err = new Error(`${model} rate-limited`);
      err.status = 429;
      err.retryable = true;
      throw err;
    }
    if (res.status >= 500) {
      const err = new Error(`${model} provider error (${res.status})`);
      err.status = res.status;
      err.retryable = true;
      throw err;
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      // Log server-side only - never rethrow provider response bodies to the client.
      console.error(`[llm] ${model} returned ${res.status}:`, text.slice(0, 300));
      const err = new Error(`${model} request failed (${res.status})`);
      err.status = res.status;
      // 400/404 can mean the selected free endpoint does not support a
      // capability such as response_format. Treat those as model-switchable
      // failures instead of making the whole generation fail immediately.
      err.retryable = res.status === 400 || res.status === 404 || res.status === 408 || res.status === 409 || res.status === 429 || res.status >= 500;
      throw err;
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || "";
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Calls the LLM with automatic fallback across the model chain
 * PRIMARY -> FAST -> BALANCED (default order; callers may override).
 * Retryable provider/capability failures advance the chain. A hard config
 * error (no API key) fails fast since retrying with a different model cannot
 * fix server configuration.
 */
export async function callLLM(system, user, opts = {}) {
  const chain = opts.modelChain || [MODELS.PRIMARY(), MODELS.FAST(), MODELS.BALANCED()];
  let lastErr;

  for (const model of chain) {
    try {
      return await callOneModel(model, { system, user, jsonMode: opts.jsonMode, timeoutMs: opts.timeoutMs });
    } catch (err) {
      if (err.code === "LLM_NOT_CONFIGURED") throw err;
      lastErr = err;
      console.warn(`[llm] ${model} failed (${err.status || "?"}): ${err.message} - trying next model`);
    }
  }

  const finalErr = new Error("All configured AI models are currently unavailable. Please try again shortly.");
  finalErr.status = 503;
  finalErr.code = "LLM_ALL_MODELS_FAILED";
  finalErr.cause = lastErr;
  return Promise.reject(finalErr);
}

/**
 * Safe JSON extraction with recovery: prefers { "questions": [...] } (what we
 * ask jsonMode calls to return), falls back to a bare top-level array (what a
 * non-jsonMode fallback model, e.g. one without response_format support,
 * might still return despite the prompt), and never throws - callers treat
 * an empty array as "generate nothing usable from this response" rather than
 * a crash.
 */
export function extractQuestionsArray(raw) {
  if (!raw) return [];
  const cleaned = raw
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  // Preferred shape: a JSON object with a "questions" array.
  const objStart = cleaned.indexOf("{");
  const objEnd = cleaned.lastIndexOf("}");
  if (objStart !== -1 && objEnd !== -1) {
    try {
      const parsed = JSON.parse(cleaned.slice(objStart, objEnd + 1));
      if (Array.isArray(parsed?.questions)) return parsed.questions;
    } catch {
      /* fall through to array recovery below */
    }
  }

  // Recovery path: a bare JSON array.
  const arrStart = cleaned.indexOf("[");
  const arrEnd = cleaned.lastIndexOf("]");
  if (arrStart !== -1 && arrEnd !== -1) {
    try {
      const parsed = JSON.parse(cleaned.slice(arrStart, arrEnd + 1));
      if (Array.isArray(parsed)) return parsed;
    } catch {
      /* give up quietly - caller treats [] as "nothing usable" */
    }
  }

  return [];
}

/**
 * Embeddings, for optional semantic retrieval (e.g. ranking bank questions by
 * topic similarity when a keyword/regex match comes back too thin). Always
 * requests encoding_format: "float" explicitly - some OpenAI-compatible SDKs
 * default to base64, which OpenRouter's free Nemotron embedding endpoint
 * returns as empty data for.
 */
export async function generateEmbeddings(inputs) {
  if (!isLLMConfigured()) throw configError();
  const values = Array.isArray(inputs) ? inputs.filter((v) => typeof v === "string" && v.trim()) : [inputs];
  if (!values.length) return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(EMBEDDINGS_URL(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "Exam Forge AI",
      },
      body: JSON.stringify({
        model: MODELS.EMBEDDING(),
        input: values,
        encoding_format: "float",
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = new Error(`Embedding request failed (${res.status})`);
      err.status = res.status;
      err.retryable = res.status === 408 || res.status === 409 || res.status === 429 || res.status >= 500;
      throw err;
    }
    const data = await res.json();
    return (data?.data || [])
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
      .map((item) => item?.embedding || null);
  } catch (err) {
    if (err.name === "AbortError") {
      const timeoutErr = new Error("Embedding request timed out");
      timeoutErr.status = 504;
      timeoutErr.retryable = true;
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function generateEmbedding(text) {
  const [embedding] = await generateEmbeddings([text]);
  return embedding || null;
}

export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Document/image understanding (scanned textbook pages, diagrams, PDFs
 * rendered to images, etc). Not currently wired to a frontend upload flow -
 * exposed here so an upload endpoint can call it directly when that feature
 * is built, without touching this file again.
 */
export async function analyzeDocument({ imageUrl, prompt, timeoutMs }) {
  if (!isLLMConfigured()) throw configError();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs || DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(CHAT_URL(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "Exam Forge AI",
      },
      body: JSON.stringify({
        model: MODELS.VISION(),
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const err = new Error(`Vision request failed (${res.status})`);
      err.status = 502;
      throw err;
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || "";
  } finally {
    clearTimeout(timer);
  }
}
