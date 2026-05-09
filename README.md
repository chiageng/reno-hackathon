# Reno

**Take a photo of any room → get three photorealistic redesigns in 30 seconds, iterate by voice, see every item shoppable with prices, and watch a cinematic walk-through of your new space.**

Built for the AI Engineer Singapore Hackathon, 2026.

---

## What's in this repo

A Next.js 15 fullstack app — frontend **and** backend serverless API in one project.

- **Frontend** (`src/app/**` excluding `api/`): React 19 + Ant Design 5 + TanStack Query 5. Every page is a Client Component.
- **Backend** (`src/app/api/**/route.ts`): Next.js Route Handlers calling OpenAI (vision + image gen + STT), ElevenLabs (TTS), and Google Gemini (Veo 3 video).
- **Canonical demo** (`/demo`): pre-seeded bulletproof fallback for the on-stage moment.

For the full plan (hour-by-hour build, API contracts, prompts, demo script, cut-scope rules) read [`reno-execution-plan.md`](./reno-execution-plan.md).

For agent operating rules read [`CLAUDE.md`](./CLAUDE.md).
For coding conventions read [`coding_standard.md`](./coding_standard.md).

---

## Getting started

```bash
# 1. Install
npm install

# 2. Configure secrets — copy .env.example → .env.local and fill in keys
#    (OPENAI_API_KEY, ELEVENLABS_API_KEY, GEMINI_API_KEY, BLOB_READ_WRITE_TOKEN)
cp .env.example .env.local

# 3. Run dev server
npm run dev
```

Open <http://localhost:3000>.

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

Deploy to **Vercel Pro** (60s function timeout — required for image generation; Hobby caps at 10s and will fail).

1. Push the repo to GitHub.
2. Import on Vercel.
3. Set the environment variables from `.env.example` in **Project Settings → Environment Variables**.
4. Deploy.
