# CLAUDE.md

This file is the operating manual for AI agents (Claude Code) working in this repository. It is auto-loaded into every Claude Code session, so keep it concise and high-signal.

For deeper conventions, see [`coding_standard.md`](./coding_standard.md). For the **product spec** (what we're building, hour-by-hour plan, demo script, prompts, API contracts), see [`reno-execution-plan.md`](./reno-execution-plan.md) — read it first.

---

## Project Snapshot

- **What it is**: **Reno** — a hackathon **fullstack** web app. One photo of a room → three photorealistic AI redesigns + voice narration + voice iteration + shoppable items + cinematic walk-through video, all in under 90 seconds.
- **Hackathon context**: AI Engineer Singapore 2026, 7-hour build. **Ship for demo, not for production.**
- **Stack**: Next.js 15 (App Router, Turbopack) — **frontend AND backend in the same repo**.
  - **Frontend**: React 19, Ant Design 5, TanStack Query 5. Every page is a Client Component (`"use client";`).
  - **Backend**: Next.js Route Handlers under `src/app/api/**/route.ts`. Server-only — never imported into client code.
- **External APIs**: OpenAI (vision + image gen + STT), ElevenLabs (TTS), Google Gemini (Veo 3 video), Vercel Blob (image storage).
- **State**: TanStack Query for server state. `useState` + `sessionStorage` for everything else.
- **Auth**: **Not used for the demo.** `AuthContext` exists but is dormant.
- **Auto-generated SDK** (`src/client/*.gen.ts`): **dormant** for the hackathon — backend logic lives in our own Route Handlers. Don't edit, don't delete.

---

## Golden Rules

Internalize these before editing.

### Frontend (client components)

1. **Read [`coding_standard.md`](./coding_standard.md) before non-trivial work.**
2. **Every component file starts with `"use client";`.** No SSR, no Server Components, no Server Actions for pages.
3. **Always use `@/` imports.** No `../../` paths.
4. **Never import `message` or `Modal` directly from `antd`.** Use `useMessage()` / `useModal()` from `@/utils/common`.
5. **Never hardcode colors.** Use `colorConfig` from `@/config/colors`.
6. **Never use raw `<h1>`, `<p>` for content text.** Use `<HText>` / `<PText>` from `@/components/MyText`.
7. **Frontend → backend: TanStack Query (`useQuery` / `useMutation`).** Call `fetch('/api/...')` **inline inside** `queryFn` / `mutationFn` — never inside a component body or event handler directly.
8. **Never import an AI SDK (`openai`, `elevenlabs`, `@google/genai`, `@vercel/blob`) into a client component.** Those imports live in `src/app/api/**` and `src/lib/{openai,elevenlabs,gemini}.ts` only.

### Backend (Route Handlers in `src/app/api/**/route.ts`)

9. **Server-only secrets.** API keys (`OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, `GEMINI_API_KEY`, `BLOB_READ_WRITE_TOKEN`) are read from `process.env` directly. **Never `NEXT_PUBLIC_*`.**
10. **Long-running routes set `export const maxDuration = 60`** (image gen, narration, video). Default Vercel timeout is 10s on Hobby — we deploy on Pro for 60s.
11. **Never put `"use client"` in a `route.ts`.** Route handlers are server-side by definition.
12. **Crash gracefully.** On AI provider failure, return `NextResponse.json({ error }, { status })` and log via `console.error`. Never bubble a stack trace to the client.
13. **Import provider SDKs only from `src/lib/{openai,elevenlabs,gemini}.ts` or directly from a `route.ts`.** Never from a `page.tsx` or component.

### Hackathon-specific

14. **Demo > polish > completeness.** A flawless 60-second demo of two features beats a buggy 90-second demo of six. Cut features per [`reno-execution-plan.md`](./reno-execution-plan.md) § "Cut-scope rules" if behind.
15. **Pre-seeded canonical demo at `/demo` is sacred.** Even if everything else fails, the canonical flow must work. Never let other changes break it.
16. **No `console.log` on the demo path.** Keep `console.error` / `console.warn` if useful.
17. **Don't add auth, DB, tests, analytics, or persistence beyond `sessionStorage`.**

---

## Workflow Expectations

### Before writing code
- Skim relevant sections of [`coding_standard.md`](./coding_standard.md) (API routes, TanStack Query, Ant Design, etc.).
- Check [`reno-execution-plan.md`](./reno-execution-plan.md) for the contract of any `/api/*` route or component you're touching.
- Look at an existing similar file in the repo and mirror its shape.

### While writing code
- Type everything. Avoid `any`; if unavoidable, leave a one-line comment.
- All HTTP from frontend → `useQuery` / `useMutation` with `fetch('/api/...')` inline in the callback.
- All user-facing messages through `useMessage()`. All confirms through `useModal()`.
- Inside a Route Handler, validate inputs minimally (`if (!body.imageUrl) return NextResponse.json({error}, {status:400})`). **Don't pull in Zod for a hackathon.**

### Before declaring done
- `npm run lint` must pass.
- For UI changes: confirm with `npm run dev` in a real **mobile** browser (the demo runs on a phone). If you can't test mobile, say so explicitly — don't claim "tested."
- Confirm the canonical `/demo` flow still works.

---

## Common Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Run production server
npm run lint         # ESLint
# npm run gen-client # Dormant for hackathon (would regenerate src/client/*.gen.ts)
```

---

## Directory Quick Reference

```
src/
├── app/
│   ├── api/                     # 🆕 BACKEND — Next.js Route Handlers (server-only)
│   │   ├── analyze/route.ts
│   │   ├── generate-styles/route.ts
│   │   ├── iterate/route.ts
│   │   ├── transcribe/route.ts
│   │   ├── narrate/route.ts
│   │   └── walkthrough/route.ts
│   ├── demo/page.tsx            # 🆕 Pre-seeded canonical demo (bulletproof fallback)
│   ├── page.tsx                 # Main flow: upload → analyze → redesign → iterate
│   └── layout.tsx               # Providers mounted here
├── components/                  # Shared components used in 2+ places
├── client/                      # 🚫 AUTO-GENERATED, dormant for hackathon — never edit
├── contexts/                    # AuthContext (dormant for demo)
├── hooks/                       # Custom hooks
├── lib/                         # External SDK glue
│   ├── openai.ts                # 🆕 OpenAI client + helpers (vision, image gen, STT)
│   ├── elevenlabs.ts            # 🆕 ElevenLabs TTS client
│   ├── gemini.ts                # 🆕 Google Gemini / Veo 3 client
│   ├── prompts.ts               # 🆕 All prompt templates
│   ├── catalog.ts               # 🆕 Hardcoded IKEA SG catalog
│   ├── demo-data.ts             # 🆕 Canonical pre-seeded outputs
│   └── api-client.ts            # External backend SDK config (dormant)
├── config/                      # Static config (colors.ts, …)
└── utils/                       # Pure utilities + shared hooks (useMessage, useModal)

public/
└── demo/                        # 🆕 Pre-rendered canonical assets (Veo 3 mp4, before/after jpgs)
```

**Page-specific components** are co-located next to their `page.tsx`:

```
src/app/<route>/
├── page.tsx
├── PhotoUpload.tsx
└── StyleGrid.tsx
```

---

## Key Files to Know

| File | Why it matters |
|---|---|
| `reno-execution-plan.md` | Product spec — read first |
| `src/app/layout.tsx` | Root layout — providers (`AntdProvider`, `QueryProvider`, `AuthProvider`) |
| `src/app/api/*/route.ts` | All backend logic — one file per endpoint |
| `src/app/demo/page.tsx` | Canonical pre-seeded demo, bulletproof fallback |
| `src/lib/openai.ts` / `elevenlabs.ts` / `gemini.ts` | Server-side SDK clients (import only from route handlers) |
| `src/lib/prompts.ts` | All AI prompt templates — change here, not inline in routes |
| `src/lib/catalog.ts` | Hardcoded 20-item IKEA SG list |
| `src/lib/demo-data.ts` | Pre-seeded canonical session data |
| `src/utils/common.ts` | `useMessage()`, `useModal()`, `useNotification()` |
| `src/config/colors.ts` | `colorConfig` — single source of truth for colors |
| `src/components/MyText.tsx` | `<HText>` / `<PText>` typography components |

---

## Environment

Two distinct kinds of env vars — keep them separate. See [`.env.example`](./.env.example) for the full list.

### Server-only (NEVER prefix with `NEXT_PUBLIC_`)
Read from `process.env` inside Route Handlers (`src/app/api/**/route.ts`) and `src/lib/{openai,elevenlabs,gemini}.ts`. **Never reference these from a client component** — the bundler will warn but the value won't be there at runtime.

- `OPENAI_API_KEY`
- `ELEVENLABS_API_KEY`
- `GEMINI_API_KEY`
- `BLOB_READ_WRITE_TOKEN` (Vercel Blob)
- `FAL_KEY` (optional, for image gen acceleration)

### Public (prefixed `NEXT_PUBLIC_`, exposed to browser)
- `NEXT_PUBLIC_API_BASE_URL` — external backend SDK base URL. Dormant for hackathon (defaults to `http://localhost:8000`).

Document any new var in `.env.example`.

---

## When You're Unsure

- **What an API route should do** → check [`reno-execution-plan.md`](./reno-execution-plan.md) § "API contracts".
- **AI prompt to use** → see [`reno-execution-plan.md`](./reno-execution-plan.md) § "Key prompts" and put it in `src/lib/prompts.ts`.
- **Naming, file placement, frontend patterns** → [`coding_standard.md`](./coding_standard.md).
- **Hour-by-hour what to build next** → [`reno-execution-plan.md`](./reno-execution-plan.md) § "Hour-by-hour build plan".
- **A new convention is needed** → add it to [`coding_standard.md`](./coding_standard.md), not just in code.
- **The standard contradicts the code** → ask the user; don't silently pick.

---

## Out of Scope (do not do without explicit request)

- Don't introduce SSR, React Server Components, or Server Actions for **pages** (Route Handlers are fine — that's how the backend is built).
- Don't add new dependencies without asking — prefer the AI SDKs already listed and Ant Design.
- Don't write tests.
- Don't add auth, login, signup, or account pages.
- Don't add a database. `sessionStorage` and in-memory only.
- Don't refactor unrelated code while fixing a bug.
- Don't create `.md` documentation files unless requested.
