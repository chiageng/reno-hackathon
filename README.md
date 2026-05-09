# Reno

**Take a photo of any room → get three photorealistic redesigns in ~30 seconds, iterate by voice or text, browse shoppable items with prices, and get a full renovation cost + action plan — all in under 90 seconds.**

Built for the **AI Engineer Singapore Hackathon, 2026**.

---

## Project description

Reno turns a single phone photo of a real room into three photorealistic redesigns plus a full renovation playbook, with no human designer in the loop. It's aimed at:

- Singaporean homeowners renovating an HDB flat or condo
- Renters wanting to refresh a space without hiring a designer
- Property flippers, Airbnb hosts, and real-estate agents staging units

The wall-time goal is **under 90 seconds end-to-end** on a phone browser. The app is mobile-first, no auth, no database — `sessionStorage` and in-memory state only.

For the full product spec (hour-by-hour build plan, demo script, API contracts, prompts, cut-scope rules) see [`reno-execution-plan.md`](./reno-execution-plan.md).

---

## Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript 5 |
| UI | React 19, Ant Design 5 |
| Server state | TanStack Query 5 |
| Styling | Tailwind CSS 4 + `colorConfig` design tokens |
| Backend | Next.js Route Handlers (`src/app/api/**/route.ts`) — server-only |
| Hosting | Vercel **Pro** (60 s function timeout — required for image gen) |

Frontend and backend live in the same repo. Every page/component is a Client Component (`"use client";`); backend logic is split into individual Route Handlers under `src/app/api/`.

---

## Features and the AI behind each one

Every external AI call is wrapped in a server-only helper in `src/lib/`. Frontend code never imports an AI SDK.

### 1. Photo upload + vision analysis

- **What it does**: User uploads a room photo (camera or gallery). The app returns structured JSON — `roomType`, estimated area in m², lighting, current style, key movable items, fixed elements (windows, doors, ceiling), plus a one-paragraph friendly narration.
- **Model**: OpenAI **`gpt-4o`** (multi-modal vision) with `response_format: json_object`.
- **Where**: `POST /api/analyze` → `analyzeRoomImage()` in `src/lib/openai.ts`.

### 2. Three photorealistic redesigns (Scandi / Japandi / Industrial)

- **What it does**: Generates three style variants of the same room in parallel, preserving the original room's windows, doors, and ceiling structure.
- **Model**: OpenAI **`gpt-image-1`** image-edit endpoint, 1024×1024, quality `medium`.
- **Where**: `POST /api/generate-style` (one call per style, fired in parallel) → `generateStyleImage()` in `src/lib/openai.ts`. Style prompt templates live in `src/lib/prompts.ts`.

### 3. Before / after comparison slider

- **What it does**: Drag-handle reveal between the original photo and the redesign.
- **Model**: None — pure React (`src/app/ComparisonSlider.tsx`).

### 4. Iterate a redesign (text)

- **What it does**: User types something like *"make the sofa green and add a tall plant"* — the active redesign regenerates with that change applied.
- **Model**: OpenAI **`gpt-image-1`** image-edit endpoint with the iteration prompt template.
- **Where**: `POST /api/iterate` → `iterateStyleImage()` in `src/lib/openai.ts`.

### 5. Iterate a redesign (voice)

- **What it does**: Hold-to-talk mic button records audio in the browser via `MediaRecorder`. On release, the audio blob is transcribed and the resulting text feeds straight into the iteration flow above. Works on iOS Safari (where `webkitSpeechRecognition` does not).
- **Model**: OpenAI **`gpt-4o-mini-transcribe`** with **`whisper-1`** as automatic fallback.
- **Where**: `POST /api/transcribe` (multipart/form-data with `audio` blob) → `transcribeAudio()` in `src/lib/openai.ts`. UI in `src/app/VoiceButton.tsx`.

### 6. Designer commentary narration (voice TTS)

- **What it does**: For each of the three redesigns, GPT writes a short designer commentary tailored to the analyzed room, then ElevenLabs speaks it aloud. Plays inline with a play/pause control on the redesign view.
- **Models**:
  - Commentary text: OpenAI **`gpt-4o`** (`POST /api/describe-styles` → `generateDesignDescriptions()`).
  - TTS audio: ElevenLabs **`eleven_turbo_v2_5`**, default voice **Rachel** (`21m00Tcm4TlvDq8ikWAM`, override with `ELEVENLABS_VOICE_ID`).
- **Where**: `POST /api/narrate` → `narrateText()` in `src/lib/elevenlabs.ts` (direct REST, no SDK).

### 7. Renovation insights modal (cost breakdown + action plan)

- **What it does**: One tap opens a modal with a per-category renovation cost range in SGD, a total estimate, a timeline range in weeks, and a step-by-step action plan with category tags (preparation, walls, flooring, lighting, carpentry, furniture, decor, electrical, other).
- **Model**: OpenAI **`gpt-4o`** with structured JSON output (`POST /api/insights` → `generateRenovationInsights()`).
- **Where**: `src/app/InsightsModal.tsx`.

### 8. Shop this look

- **What it does**: A modal showing a curated set of furniture/decor items for the active style, each with price (SGD) and a deep link to the retailer page. Total estimated cost shown at the bottom.
- **Catalog**: hardcoded IKEA Singapore items in `src/lib/catalog.ts` — no live retailer API for the hackathon build.
- **Where**: `src/app/ShoppingModal.tsx`.

### 9. Cinematic walkthrough video *(currently hidden)*

- **What it would do**: A 6–8 s slow camera-dolly walk-through of the chosen redesign, generated with Google Veo 3.
- **Model**: Google **Veo 3** via `@google/genai` (default `veo-3.0-generate-001`, override with `GEMINI_VEO_MODEL`).
- **Status**: UI hidden in `src/app/RedesignView.tsx` because Veo 3 access on the current API key is gated. Backend route + cache plumbing remain so the feature can be re-enabled by flipping a single condition. A pre-rendered MP4 dropped at `public/demo/walkthrough-<style>.mp4` will be served instantly without ever calling Veo.
- **Where**: `POST /api/walkthrough` (start) + `GET /api/walkthrough/status` (poll) → `src/lib/gemini.ts`.

### 10. Canonical demo (`/demo`)

- **What it does**: A fully pre-seeded demo flow that bypasses every live AI call — guaranteed to work on stage even if every external provider is down. Displays a curated apartment photo, hardcoded analysis, three pre-rendered redesigns, and (if present) a pre-rendered walkthrough.
- **Where**: `src/app/demo/page.tsx`, data in `src/lib/demo-data.ts`, assets in `public/demo/`.

---

## API routes

| Route | Method | Purpose | Backed by |
|---|---|---|---|
| `/api/analyze` | POST | Photo → structured room JSON | `gpt-4o` |
| `/api/generate-style` | POST | Photo + analysis → 1 styled image | `gpt-image-1` |
| `/api/iterate` | POST | Image + edit instruction → new image | `gpt-image-1` |
| `/api/transcribe` | POST | Audio blob → text | `gpt-4o-mini-transcribe` (fallback `whisper-1`) |
| `/api/describe-styles` | POST | Analysis → 3 designer commentaries | `gpt-4o` |
| `/api/narrate` | POST | Text → MP3 audio | ElevenLabs `eleven_turbo_v2_5` |
| `/api/insights` | POST | Analysis → cost breakdown + action plan | `gpt-4o` |
| `/api/walkthrough` | POST | Image → Veo 3 operation name (hidden in UI) | Veo 3 (`veo-3.0-generate-001`) |
| `/api/walkthrough/status` | GET | Poll a Veo 3 operation | Veo 3 |

All long-running routes export `maxDuration = 60` so they don't time out on Vercel Pro (Hobby caps at 10 s and will fail).

---

## Project layout

```
src/
├── app/
│   ├── api/                  Route Handlers (server-only) — see API table above
│   ├── demo/page.tsx         Pre-seeded canonical demo (bulletproof fallback)
│   ├── page.tsx              Main flow: upload → analyze → redesign → iterate
│   ├── layout.tsx            Providers (Antd, TanStack Query, Auth)
│   ├── PhotoUpload.tsx       Mobile camera + gallery upload
│   ├── AnalysisPanel.tsx     Typewriter reveal of vision analysis JSON
│   ├── StyleGrid.tsx         3 redesign tiles with skeleton loading
│   ├── ComparisonSlider.tsx  Drag-handle before/after reveal
│   ├── RedesignView.tsx      Full-size redesign + iteration + audio + actions
│   ├── IterationInput.tsx    Text + voice prompt entry
│   ├── VoiceButton.tsx       Hold-to-talk MediaRecorder mic
│   ├── ShoppingModal.tsx     Catalog strip + total cost
│   ├── InsightsModal.tsx     Cost breakdown + action plan
│   └── WalkthroughPlayer.tsx Veo 3 player (UI currently hidden)
├── components/               Shared UI (SectionContainer, MyText, etc.)
├── contexts/                 AuthContext (dormant for hackathon)
├── lib/
│   ├── openai.ts             OpenAI client + helpers (vision, image gen, STT, insights, descriptions)
│   ├── elevenlabs.ts         ElevenLabs TTS (direct REST)
│   ├── gemini.ts             Google Gemini / Veo 3 client
│   ├── prompts.ts            All prompt templates
│   ├── catalog.ts            Hardcoded IKEA SG catalog
│   ├── styles.ts             Style keys + labels (Scandi / Japandi / Industrial)
│   └── demo-data.ts          Pre-seeded canonical session data
├── config/                   colorConfig, design tokens
└── utils/                    useMessage, useModal, shared helpers

public/
└── demo/                     Pre-rendered canonical assets (jpgs, optional walkthrough mp4)
```

---

## Getting started

```bash
# 1. Install
npm install

# 2. Configure secrets — copy .env.example → .env.local and fill in keys
cp .env.example .env.local

# 3. Run dev server (Turbopack)
npm run dev
```

Open <http://localhost:3000>. The canonical demo is at <http://localhost:3000/demo>.

### Environment variables

Server-only (never prefix with `NEXT_PUBLIC_`):

| Var | Used for |
|---|---|
| `OPENAI_API_KEY` | Vision analysis, image gen, transcription, designer commentary, insights |
| `ELEVENLABS_API_KEY` | Voice narration |
| `ELEVENLABS_VOICE_ID` | Optional override (default Rachel: `21m00Tcm4TlvDq8ikWAM`) |
| `GEMINI_API_KEY` | Veo 3 walkthrough (currently hidden) |
| `GEMINI_VEO_MODEL` | Optional override (default `veo-3.0-generate-001`) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob, if used for image storage |
| `FAL_KEY` | Optional, for image-gen acceleration |

---

## Scripts

```bash
npm run dev          # Turbopack dev server
npm run build        # Production build
npm run start        # Run production server
npm run lint         # ESLint
# npm run gen-client # Dormant for hackathon — would regenerate src/client/*.gen.ts
```

---

## Deploy

Deploy to **Vercel Pro** — the 60 s function timeout is required for image generation. Hobby caps at 10 s and will fail mid-redesign.

1. Push the repo to GitHub.
2. Import the repo on Vercel.
3. Set the environment variables from `.env.example` in **Project Settings → Environment Variables**.
4. Deploy.

---

## Companion docs

- [`reno-execution-plan.md`](./reno-execution-plan.md) — product spec, demo script, hour-by-hour plan, prompts, API contracts, cut-scope rules.
- [`CLAUDE.md`](./CLAUDE.md) — operating manual for AI agents working in this repo.
- [`coding_standard.md`](./coding_standard.md) — coding conventions and anti-patterns.
