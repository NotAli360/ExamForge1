# Exam Forge AI

Full-stack CBSE exam-paper generator: React frontend + Node/Express + MongoDB
backend, with a **hybrid question-bank + AI generation** engine powered
entirely by **OpenRouter**.

```
examforge/
  backend/   Node/Express + MongoDB API (auth, exam generation, chat, analytics)
  frontend/  React app (matches the provided UI screenshot)
```

## 1. AI architecture summary

**Frontend → your backend → OpenRouter.** The browser only ever talks to
your own API (`POST /api/exams`, `POST /api/chat`, etc). OpenRouter is called
exclusively from `backend/src/services/llm.service.js` — that is the *only*
file in the entire codebase that reads `OPENROUTER_API_KEY`.

### Primary model

`PRIMARY_MODEL` = `nvidia/nemotron-3-super-120b-a12b:free` (configurable via
env var, see below). Used for all exam-question generation and the chat
assistant.

### Model fallback

`callLLM()` in `llm.service.js` tries a chain of models in order:
`PRIMARY_MODEL → FAST_MODEL → BALANCED_MODEL`. A retryable failure (HTTP 429
rate limit, 5xx provider error, timeout, network error) advances to the next
model automatically. A hard config error (no API key set) fails immediately
since retrying with a different model can't fix that. If every model in the
chain fails, the caller gets one clean message: *"All configured AI models
are currently unavailable. Please try again shortly."* — never a raw
OpenRouter error, status code detail, or stack trace.

### RAG / retrieval

The exam generator uses a layered retrieval strategy without requiring a
separate vector database:

1. `questionBank.service.js` searches the verified `Question` collection by
   board/class/subject/chapter/topic/type/difficulty.
2. When a topic is specific and the candidate pool is large enough, the
   service generates one query embedding and batch-embeds missing candidate
   vectors, then cosine-reranks the candidates. The vectors are cached on the
   question documents so the same questions do not need to be embedded again.
3. If the embedding endpoint is unavailable, retrieval automatically falls
   back to normal MongoDB lexical matching. Semantic retrieval can also be
   disabled with `ENABLE_SEMANTIC_RETRIEVAL=false`.
4. Only the **deficit** — questions the verified bank could not cover — is
   sent to the LLM. The verified bank questions found for the same request are
   also supplied as factual reference material so generated questions stay
   grounded in the chapter while being instructed not to copy them.
5. `analyzeDocument()` uses `VISION_MODEL` for image/document understanding.
   It remains a backend capability until a document-upload UI is added.

### Structured JSON output

Generation calls set `response_format: { type: "json_object" }` and the
prompt asks for `{ "questions": [ ... ] }` (OpenAI-style structured output
requires a top-level object, not a bare array). `extractQuestionsArray()` in
`llm.service.js` parses that safely — prefers the `questions` key, falls back
to recovering a bare array if a fallback model ignores the object wrapper,
and returns `[]` (never throws) if the response is unparseable. Every
resulting question then goes through `validator.service.js` regardless of
which model produced it: option count, exactly-one-correct-answer,
duplicate-detection, and per-type format rules (e.g. assertion-reason must
use the four standard options).

## Production security

- Keep `OPENROUTER_API_KEY` only in `backend/.env` locally or your hosting
  provider's server-side secret manager. Never use `REACT_APP_`, `VITE_`, or
  `NEXT_PUBLIC_` for it.
- The browser calls only the Exam Forge backend; it never receives the
  OpenRouter Authorization header.
- Production CORS should contain the exact frontend origin, for example
  `https://app.example.com`, not `*`.
- Login/signup and AI-heavy routes have per-user/IP rate limits.
- 5xx responses are sanitized so raw provider, database, stack-trace, or
  secret-bearing errors do not reach the browser.
- Before deployment, build the frontend and search the generated bundle for
  `OPENROUTER_API_KEY` and the actual secret. Both must be absent.

## 2. Where to put the API key

**`backend/.env`** (copy from `backend/.env.example`):

```
OPENROUTER_API_KEY=sk-or-...your-real-key...
```

That file is covered by the root `.gitignore` — it will never be committed.
If you deploy, set `OPENROUTER_API_KEY` in your host's server-side
environment-variable/secrets panel (Render, Railway, Fly, a VPS's systemd
env file, etc.) — never in a `REACT_APP_`/`VITE_`/`NEXT_PUBLIC_`-prefixed
variable, which would bundle it into frontend JS.

## 3. Model configuration (all in `backend/.env`)

```
PRIMARY_MODEL=nvidia/nemotron-3-super-120b-a12b:free
FAST_MODEL=nvidia/nemotron-3.5-lightning:free
BALANCED_MODEL=google/gemma-4-26b-a4b-it:free
VISION_MODEL=nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free
EMBEDDING_MODEL=nvidia/nemotron-3-embed-1b:free
```

All five model IDs above were verified against OpenRouter/NVIDIA/Google
sources as currently-live `:free` model slugs at the time this was written.
**Free-tier model availability on OpenRouter rotates** — if `PRIMARY_MODEL`
ever starts failing outright (not just occasionally rate-limiting), check
https://openrouter.ai/models and update the `.env` value; no code change
needed.

One implementation detail worth knowing: OpenRouter's free Nemotron
embedding endpoint returns empty data if a client defaults to
`encoding_format: "base64"` (some OpenAI SDKs do this silently) — the code
explicitly requests `encoding_format: "float"` to avoid that.

## 4. How exam generation works end-to-end

1. You submit board/class/subject/chapter/topic/difficulty/question-types/count.
2. The backend searches the **MongoDB question bank** first.
3. Whatever the bank can't cover goes to OpenRouter via the model fallback
   chain, using per-type templates (`templates.js`) that define exact JSON
   schema + formatting rules for MCQ, fill-in-the-blank, true/false,
   very-short, short, long, assertion-reason, and case-based questions.
4. Every AI-generated question is validated before use (see above).
5. Validated bank + AI questions are merged into one exam, grouped into
   CBSE-style sections, and saved to MongoDB.
6. `POST /exams/:id/regenerate-question` redoes just one question — bank
   first, then AI — without touching the rest of the paper.
7. Newly-generated AI questions are persisted back into the bank as
   `unverified` so future exams can reuse them without another LLM call.
   Mark them `verified: true` once reviewed.

## 5. Auth & abuse protection

Unchanged existing JWT auth (`bcryptjs` + `jsonwebtoken`) gates every
AI-backed route via `requireAuth`. Added on top, all backend-only:

- **Rate limiting** (`middleware/rateLimit.js`, in-memory, no new
  dependency): exam generation capped at 10 requests / 5 min per user, single
  question regeneration at 30 / 5 min, chat at 20 / min.
- **Input caps**: `questionCount` clamped to 1–100, `topic` capped at 200
  chars, chat messages capped at 2000 chars.
- **Timeouts**: every OpenRouter call aborts after `LLM_TIMEOUT_MS`
  (default 45s) rather than hanging.
- **Error hygiene**: `errorHandler.js` never sends a stack trace to the
  frontend, and in `NODE_ENV=production` collapses any 5xx into a generic
  message rather than echoing internal detail.

## 6. Frontend ↔ backend

The frontend calls only its own API (`api/client.js` → `${REACT_APP_BACKEND_URL}/api/...`),
e.g. `POST /api/exams` to generate, `POST /api/chat` for the assistant. It
has no knowledge of OpenRouter, model names, or the API key.

**How I verified the key isn't frontend-exposed**, given I don't have a live
build environment here: I grepped the entire `frontend/src` tree for
`OPENROUTER` and `API_KEY` — zero matches (see the command output earlier in
this session). The only backend URL the frontend knows about is
`REACT_APP_BACKEND_URL`, which is not secret — it's just your own API's base
URL. Since I couldn't run `npm run build` in this sandbox (no network
access), **please also run this yourself once before deploying**:

```bash
cd frontend && npm run build
grep -r "OPENROUTER" build/static/js/ || echo "clean - no match"
```

That should print "clean - no match". If it doesn't, stop and tell me before
deploying.

## 7. Setup

```bash
cd backend
cp .env.example .env
# edit .env: MONGO_URL, JWT_SECRET, OPENROUTER_API_KEY
npm install
npm run seed     # loads verified bank questions (Tissues, Polynomials, etc.)
npm run dev      # http://localhost:8001
```

```bash
cd frontend
cp .env.example .env    # REACT_APP_BACKEND_URL=http://localhost:8001
npm install
npm start                # http://localhost:3000
```

With no `OPENROUTER_API_KEY` set, generation still works using only seeded
bank questions (you'll see a note in `warnings` that the AI deficit couldn't
be filled); add the key to unlock full generation and the chat assistant.

## Files changed in this update (OpenRouter migration)

| File | Change |
|---|---|
| `backend/src/services/llm.service.js` | Rewritten: single-provider OpenRouter client, model-role config (`PRIMARY`/`FAST`/`BALANCED`/`VISION`/`EMBEDDING`), fallback chain, structured JSON output, safe parsing, embeddings + vision helpers. Was previously hardcoded to Anthropic's API. |
| `backend/src/services/examGenerator.service.js` | Prompt now requests `{"questions":[...]}`; calls `callLLM(..., {jsonMode: true})`; uses `extractQuestionsArray` instead of the old `extractJSONArray`. Bank-first retrieval logic untouched. |
| `backend/src/middleware/rateLimit.js` | New. In-memory rate limiter, no new dependency. |
| `backend/src/routes/exam.routes.js`, `chat.routes.js` | Wired the rate limiter onto the AI-backed endpoints. |
| `backend/src/controllers/exam.controller.js` | Added `questionCount`/`topic` input caps. |
| `backend/src/controllers/chat.controller.js` | Added message length cap. |
| `backend/src/middleware/errorHandler.js` | Hardened: no stack traces to the client; generic message for 5xx in production. |
| `backend/.env.example` | Replaced Anthropic-style vars with `OPENROUTER_API_KEY` + the five model-role vars. |
| `.gitignore` (new, root) | Excludes `.env` files everywhere in the repo. |

Everything else — auth, MongoDB models, the question bank, the validator,
the frontend UI — is unchanged from the existing app.

## Environment/testing caveat

I don't have network access in this sandbox, so I couldn't run `npm install`,
boot either server, or make a live OpenRouter call to confirm the fallback
chain behaves exactly as written. The five model IDs were verified against
live OpenRouter/NVIDIA/Google documentation via web search, and all code was
syntax-checked, but please run this locally with your real key and tell me
if anything doesn't behave as expected — especially the fallback path, which
I can only reason about, not observe.
