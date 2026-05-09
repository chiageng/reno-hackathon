# Reno — Execution Plan for AI Agent

## One-line pitch

**Take a photo of any room → get three photorealistic redesigns in 30 seconds, iterate by voice, see every item shoppable with prices, and watch a cinematic walk-through of your new space.**

This is a hackathon build. **Ship for demo, not for production.** Prioritise the on-stage moment over completeness.

---

## Project description (read this first)

**Project name:** Reno

**What it is:** A web app that turns one photo of a real room into three photorealistic redesigns plus a cinematic walk-through video, in under a minute, with every visible item shoppable from a real Singapore furniture catalog.

**Who uses it:**
- Singaporean homeowners renovating their HDB flat or condo (~$30k–100k decisions)
- Renters wanting to refresh a space without hiring a designer
- Property flippers and Airbnb hosts staging units
- Real estate agents helping buyers visualize the "after" of a fixer-upper
- (B2B future) Furniture retailers and property managers white-labelling the engine

**Problem it solves:** Today, visualizing a renovated room requires either an interior designer ($5k–20k, weeks of back-and-forth) or hours of Pinterest followed by guesswork. Existing tools like Modsy and Havenly are slow because they rely on a human designer in the loop. Frontier image generation (gpt-image-2) is finally good enough to do this fully autonomously.

**End-to-end user experience:**

1. User opens the web app on their phone, taps "Try it."
2. Takes one photo of any room (or uploads from gallery).
3. ~8 seconds later, the room analysis appears on screen and a warm designer voice speaks aloud: *"I can see a cosy living room, around 18 square meters, with a leather sofa and a window facing north. Here are three ways to reimagine it."* — voiced by ElevenLabs.
4. ~25 seconds after upload, three photorealistic redesigns appear (Scandi, Japandi, Industrial), each preserving the original room's windows, walls, and ceiling.
5. User taps the style they like → full-screen view with before/after toggle.
6. User holds the mic button and says *"Make the sofa green and add a tall plant"* → image regenerates in ~6 seconds.
7. Below the redesign, 4–6 real Singapore-available furniture items are shown with prices. Total estimated cost displayed.
8. User taps "Watch the walk-through" → a 6-second cinematic Veo 3 video plays, showing a slow camera dolly through the redesigned space.
9. User can tap any product to open its real retailer page in a new tab.

**Key value propositions:**

- **Speed:** 60 seconds vs. weeks
- **Cost:** $10/month subscription vs. $5–20k designer fees
- **Confidence:** See it before you commit a cent
- **Taste discovery:** Try three styles, iterate by voice — find what you actually like
- **Real shopping:** Every visible item is purchasable, not generic stock photos

**Hackathon context:** This is being built in 7 hours at the AI Engineer Singapore Hackathon (May 2026). The goal is to win the overall prize ($3,000 SGD) by hitting multiple sponsor tracks (OpenAI GPT-5.5 + Image 2, ElevenLabs, Gemini Gen Media via Veo 3, optionally Adaption Labs). The build prioritises a flawless 90-second on-stage demo over production-readiness. Code quality, test coverage, accessibility, internationalisation, and edge-case handling are explicitly deprioritised in favour of demo polish, visual quality of generated outputs, and demo robustness (especially the pre-seeded canonical fallback).

**Definition of "done":** The team can stand on stage, hand a phone to a judge, have them photograph any corner of the venue, and watch the full flow (analysis → narration → 3 redesigns → voice iteration → shoppable items → walk-through video) play out in under 90 seconds, repeatably, three times in a row.

---

## How to use this plan with an AI coding agent

This document is designed to be passed in full to an AI coding agent (Claude Code, Cursor agent mode, or similar). Recommended workflow:

1. **Pass the entire file as initial context.** Do not paraphrase or summarize.
2. **Ask the agent to confirm understanding first** before writing any code (the kickoff instruction at the bottom enforces this).
3. **Run the agent in phases**, not as one continuous "build everything" command. Stop after each hour-block, review the actual output on a real phone, and only then proceed to the next phase.
4. **Intervene manually for these tasks** (the agent cannot do them well):
   - Setting up API keys in `.env.local` and on Vercel
   - Pre-rendering the canonical Veo 3 walk-through video and saving it to `/public/demo/`
   - Curating the canonical demo data (a real apartment photo with verified-good outputs)
   - Visual polish judgements (typography, spacing, animation timing)
   - Real-phone testing after each major feature
   - Demo rehearsal
5. **At the midpoint check-in (hour 4)**, evaluate honestly: if the core pipeline (photo → 3 redesigns) isn't working reliably, stop adding features and instruct the agent to focus entirely on polishing the canonical demo.

### Honest assessment: can an AI agent build this in 7 hours?

**Mostly yes, with caveats.** Realistic split:

- **Agent does well (~75% of the work):**
  - Project scaffold and Vercel deployment
  - All `/api` routes following the contracts in this document
  - SDK integration (OpenAI, ElevenLabs, Gemini)
  - UI components from the specs in the repo structure section
  - State management and data flow
  - Hardcoded catalog and cost summary
  - Fallback paths and error boundaries

- **Human must handle (~25% of the work):**
  - API key procurement and quota management
  - Pre-rendering the canonical demo video manually (Veo 3 is slow; do this asynchronously while the agent codes)
  - Curating beautiful demo input photos (not any random snapshot — pick a well-lit, clear room photo for the canonical example)
  - Tuning image generation prompts when initial outputs look off (this is iterative; the agent can attempt but the final judgement is visual)
  - Testing on real iOS Safari and Chrome Android — the agent cannot do this
  - Demo choreography and stage rehearsal
  - Cutting scope decisively at hour 5 if behind

**What goes wrong with agent-only builds:**
- Agent picks an outdated SDK version → 30 min debugging
- API auth fails silently → hard to diagnose without human eyes
- Image gen output looks off but agent doesn't notice quality issues
- Agent over-engineers (adds tests, adds auth, splits into too many components)
- Agent hits a confusing API error (e.g., Veo 3 quota) and tries to "work around" it instead of stopping to ask

**Mitigation:** check in every 60–90 minutes, not just at the end. The agent will not self-correct on visual quality.

**Bottom line:** an AI agent + a focused human reviewer can ship this in 7 hours. An AI agent alone, unsupervised, will get ~60–70% of the way there but the final demo polish will be missing. Plan accordingly.

---

## Why this product

- Singaporeans spend $30k–100k on HDB/condo renovation and can't see the result before committing.
- Interior designers cost $5k–20k per room and take weeks.
- Existing tools (Modsy, Havenly, Houzz) require a designer-in-loop and are slow.
- Frontier image gen (gpt-image-2 / latest) is finally good enough to do this with no human in the loop.
- Multiple revenue streams: consumer subscription, furniture affiliate commissions, designer lead-gen, B2B for retailers and property managers.

---

## Demo narrative (the moment we're building toward)

A judge stands up, walks to a corner of the venue, points their phone, takes one photo, uploads it on `reno.vercel.app`. Within 30 seconds:

1. The screen shows what the AI sees: *"Living area, ~18m², leather sofa, hardwood floor, north-facing window."* ElevenLabs narrates this aloud.
2. Three photorealistic redesigns appear: Scandi, Japandi, Industrial.
3. Judge picks one. Says aloud: *"Make the sofa green and add more plants."* Image regenerates in 5 seconds.
4. Tap any item in the image → product card with price.
5. Bottom of screen: *"Total redesign: S$4,200."*
6. Tap "walk through it" → Veo 3 6-second cinematic walkthrough plays.

Total: 60–90 seconds. That's the demo.

---

## Locked MVP feature scope

**Must ship (in priority order):**

1. Photo upload (camera or gallery, mobile + desktop browser)
2. Vision analysis with structured JSON output (room type, dimensions estimate, key elements, current style)
3. ElevenLabs voice narration of the analysis (auto-play)
4. Three parallel style redesigns (Scandi, Japandi, Industrial) using gpt-image-2 (latest available)
5. Tap-to-expand full-size redesign view
6. Iteration via text prompt — regenerate with edit instruction
7. Iteration via voice — browser Web Speech API → text → regenerate
8. Shoppable overlay: hardcoded 20-item IKEA SG catalog, click for product detail card
9. Cost summary at bottom of redesign view
10. Pre-rendered Veo 3 walk-through video plays on demand (one canonical example)
11. Pre-seeded canonical demo (a real apartment with all outputs cached) as fallback

**Skip / explicitly do NOT build:**

- User auth, accounts, login
- Database persistence (use sessionStorage and in-memory only)
- Real product matching across catalogs (hardcode the 20 items)
- 3D room reconstruction or AR
- Live Veo 3 generation during demo (pre-render only, attempt live as encore if time)
- Multi-room support
- Saving / sharing / export
- Floor plan generation
- Mobile-native app (responsive web only)

---

## Tech stack

- **Framework:** Next.js 14 App Router + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui (use only the few components you need; do not over-install)
- **AI text + vision:** OpenAI SDK — use `gpt-5.5` if exposed, otherwise `gpt-5`, otherwise `gpt-4o`
- **AI image gen:** OpenAI SDK — use `gpt-image-2` if exposed, otherwise `gpt-image-1`
- **Voice TTS:** ElevenLabs SDK (`elevenlabs` npm package)
- **Voice STT:** OpenAI `gpt-4o-mini-transcribe` (fallback: `whisper-1`) via the OpenAI SDK. Browser records audio with `MediaRecorder`, POSTs blob to `/api/transcribe`. Works on iOS Safari, Chrome, Android — unlike `webkitSpeechRecognition` which is Chrome/Edge only.
- **Video gen:** Google Gemini API for Veo 3 (`@google/genai`)
- **Fast inference (optional, for image gen acceleration):** Fal client (`@fal-ai/serverless-client`)
- **Image storage:** Vercel Blob (`@vercel/blob`) — or just keep image URLs from OpenAI response if persistent enough for demo
- **Deployment:** Vercel
- **State:** React `useState` and `sessionStorage`. No Zustand, no Redux, no React Query unless you already know them cold.

**Environment variables required (`.env.local`):**

```
OPENAI_API_KEY=
ELEVENLABS_API_KEY=
GEMINI_API_KEY=
BLOB_READ_WRITE_TOKEN=        # if using Vercel Blob
FAL_KEY=                       # optional
```

---

## Repo structure

```
/app
  /api
    /analyze/route.ts         POST: photo URL → analysis JSON
    /generate-styles/route.ts POST: analysis → 3 image URLs
    /iterate/route.ts         POST: image + edit prompt → new image URL
    /transcribe/route.ts      POST: audio blob → text (OpenAI gpt-4o-mini-transcribe)
    /narrate/route.ts         POST: text → audio URL (ElevenLabs)
    /walkthrough/route.ts     POST: image → Veo 3 video URL (slow, async)
  /demo
    page.tsx                  Pre-seeded canonical demo (fallback)
  page.tsx                    Main flow: upload → analyze → redesign → iterate
/components
  PhotoUpload.tsx
  AnalysisPanel.tsx
  StyleGrid.tsx               3 redesign cards
  RedesignView.tsx            Full-size with iteration controls
  ShoppableOverlay.tsx
  CostSummary.tsx
  VoiceButton.tsx             Mic icon, hold-to-talk, MediaRecorder → /api/transcribe
  WalkthroughPlayer.tsx
/lib
  /openai.ts                  Client + helpers
  /elevenlabs.ts
  /gemini.ts
  /prompts.ts                 All prompt templates
  /catalog.ts                 Hardcoded 20-item IKEA SG list
  /demo-data.ts               Pre-seeded canonical example data
/public
  /demo
    canonical-before.jpg
    canonical-scandi.jpg
    canonical-japandi.jpg
    canonical-industrial.jpg
    canonical-walkthrough.mp4
```

---

## Hour-by-hour build plan

### Hour 0–0.5 — Scaffold (must finish on time)

1. `npx create-next-app@latest reno --typescript --tailwind --app --eslint --src-dir false`
2. Install deps: `npm i openai elevenlabs @google/genai @vercel/blob`
3. Install shadcn: `npx shadcn@latest init`, add `button card input toast`
4. Set up `.env.local` with all keys, test each API once with a hello-world call
5. Deploy to Vercel immediately, **on the Pro tier** (function timeout 60s — required for image gen). Get a working URL up before writing real code.
6. Confirm the URL works on a phone browser.
7. **Kick off the canonical Veo 3 walk-through render in the background** (~30–120s job, quota-gated). It needs to be saved to `/public/demo/canonical-walkthrough.mp4` before the end of the build. Don't wait until hour 5.5.

**Exit criterion:** Vercel URL loads on phone. Each AI provider returns at least one successful response from a test endpoint. Veo 3 walk-through render is queued or already saved.

---

### Hour 0.5–1.5 — Photo upload + vision analysis

**Build:**

1. `<PhotoUpload />` component with `<input type="file" accept="image/*" capture="environment">`. On file pick, upload to Vercel Blob, get back URL.
2. `POST /api/analyze` route:
   - Receives image URL
   - Calls OpenAI vision with the analysis prompt (see prompts section)
   - Returns structured JSON: `{ roomType, estimatedSize, lighting, currentStyle, keyElements: [], fixedElements: [] }`
3. `<AnalysisPanel />` displays the result with a typewriter-style reveal.

**Exit criterion:** Take a photo on phone → upload → see structured analysis appear within 8 seconds.

---

### Hour 1.5–3 — Style redesign pipeline

**Build:**

1. `POST /api/generate-styles` route:
   - Receives analysis JSON + original image URL
   - Fires three parallel calls to gpt-image-2 (or fallback) with the three style prompts (see prompts section)
   - Each prompt instructs the model to keep fixed elements (windows, doors, ceiling) and change furniture/style
   - Returns `[{ style: 'scandi', imageUrl }, { style: 'japandi', imageUrl }, { style: 'industrial', imageUrl }]`
2. `<StyleGrid />` shows three cards with loading skeletons, fills as each completes.
3. `<RedesignView />` shows full-size when card is tapped, with a before/after toggle.

**Exit criterion:** Upload photo → ~25 seconds later see three photorealistic redesigns. User can tap any card to see full-size with before/after toggle.

**Cut-rule:** If parallel generation is unstable, do sequential. If image quality is poor, tighten the system prompt to emphasise photorealism and fixed-element preservation.

---

### Hour 3–4 — Iteration (text + voice)

**Build:**

1. `POST /api/iterate` route:
   - Receives current image URL + edit prompt (e.g., "make the sofa green")
   - Uses gpt-image-2 image-edit endpoint with the existing redesign as base
   - Returns new image URL
2. Text input below redesign: type prompt → submit → image regenerates inline (replace, with brief loading state).
3. `POST /api/transcribe` route:
   - Receives a `FormData` audio blob
   - Calls `openai.audio.transcriptions.create({ file, model: "gpt-4o-mini-transcribe" })` (fallback `whisper-1`)
   - Returns `{ text: string }`
4. `<VoiceButton />` component:
   - Mic icon, hold-to-talk
   - Uses `MediaRecorder` (works on iOS Safari, Chrome, Android)
   - Detect MIME with `MediaRecorder.isTypeSupported()` — iOS produces `audio/mp4`, others `audio/webm`. Whisper accepts both.
   - On release → POST blob to `/api/transcribe` → transcript fills the text input → auto-submits to `/api/iterate`

**Exit criterion:** Tap mic, say "make the sofa blue and add a tall plant," release → transcript shows in ~1.5s, image updates ~6s after that.

**Notes:**
- First mic tap on iOS triggers the permission prompt. Plan demo choreography so the rehearsal device has already granted mic permission.
- Text input is the always-available fallback. If anything about voice is flaky on stage, type instead.
- Total round trip: record + transcribe + image edit ≈ 7–8 seconds. Show a clear loading state.

---

### Hour 4–5 — Shoppable overlay + cost

**Build:**

1. `lib/catalog.ts` — hardcode 20 IKEA SG items: `{ id, name, category, priceSGD, imageUrl, productUrl }`. Mix sofas, chairs, tables, lamps, rugs, plants, art.
2. `<ShoppableOverlay />`:
   - For MVP simplicity, **don't** try to detect items in the image. Instead, show 4–6 items as a horizontal scrollable strip below the redesign, labelled "Shop this look". Each item has a thumbnail + name + price.
   - Each style preset has a curated list of 4–6 catalog items — define this in `demo-data.ts`. (Iteration can update the curated list with a simple prompt to GPT to map remaining items.)
3. `<CostSummary />` — sums the visible items, displays at bottom: *"Total: S$X,XXX. Tap any item to buy."*

**Exit criterion:** Below each redesign, a strip of 4–6 shoppable items with prices and a total. Tapping opens the IKEA product page in a new tab.

**Cut-rule:** If short on time, skip the curated mapping logic — just show the same 6 items for every style.

---

### Hour 5–5.5 — Voice narration (ElevenLabs)

**Build:**

1. `POST /api/narrate` route:
   - Receives text
   - Calls ElevenLabs `text-to-speech` with a warm conversational voice (use `Rachel` or `Bella` voice ID)
   - Returns audio URL or base64
2. When the analysis JSON arrives, auto-call narrate with a friendly summary: *"I can see a cosy living room, around 18 square meters, with a leather sofa and a window facing north. Here are three ways to reimagine it."*
3. `<audio>` plays automatically.

**Exit criterion:** After analysis, a voice speaks the room description naturally. Voice should feel like a designer, not a robot.

---

### Hour 5.5–6.5 — Veo 3 walk-through

**Important:** the canonical walk-through MP4 should ideally be pre-rendered **in hour 0**, asynchronously, while the agent is scaffolding. Veo 3 jobs can take 30–120s and quotas are tight. If you wait until hour 5.5 to start, you may not have the file in time. Treat hour 5.5 as "wire up playback," not "first attempt at generation."

**Build:**

1. **Pre-render the canonical walk-through NOW** (or confirm the hour-0 pre-render landed). Use the Gemini API with Veo 3, give it the canonical Japandi redesign image and a prompt: *"Slow cinematic camera dolly forward through the living room, 6 seconds, gentle natural light, photorealistic."* Save the resulting MP4 to `/public/demo/canonical-walkthrough.mp4`.
2. `POST /api/walkthrough` route — same logic, on-demand. **Warning: this can take 30–120 seconds.** Return a job ID, poll for completion.
3. `<WalkthroughPlayer />` — shows a "Watch the walk-through" button. Tap → if pre-rendered exists for this image, play it; otherwise start live generation with a "Generating cinematic walk-through..." loading state.
4. For demo: only the canonical example has pre-rendered. Live attempt is a stretch goal.

**Exit criterion:** On the canonical demo page, the walk-through video plays smoothly. On any other redesign, "Watch walk-through" attempts live generation but does not block the demo.

---

### Hour 6.5–7 — Polish, fallbacks, demo rehearsal

**Tasks:**

1. **Pre-seed canonical demo data:** at `/demo`, hardcode an entire successful flow — original photo, analysis JSON, three pre-cached redesign URLs, narration audio, walk-through video. This is your bulletproof fallback. Make it look exactly like a real session.
2. Add error boundaries: if any AI call fails, fall back to a sensible default and never show a stack trace.
3. Add a subtle "🎬 Demo mode" toggle in the corner that switches to canonical data even on the main page (for stage use).
4. **Run the full demo three times end-to-end on an actual phone.** Time each run. If any step takes >15 seconds, optimise or pre-cache.
5. Brief the team on the demo script and stage choreography. Decide who holds the phone, who narrates, who watches the laptop screen.

**Exit criterion:** Demo runs cleanly three times in a row. Total elapsed under 90 seconds. Fallback works if anything fails.

---

## API contracts

### POST /api/analyze
**In:** `{ imageUrl: string }`
**Out:**
```json
{
  "roomType": "living room",
  "estimatedSizeM2": 18,
  "lighting": "natural, north-facing window",
  "currentStyle": "modern minimalist with leather accents",
  "keyElements": ["leather sofa", "wooden coffee table", "area rug"],
  "fixedElements": ["window", "ceiling fan", "wall outlets"],
  "narrationText": "I can see a cosy living room around 18 square meters..."
}
```

### POST /api/generate-styles
**In:** `{ imageUrl: string, analysis: AnalysisJSON }`
**Out:** `[{ style: "scandi" | "japandi" | "industrial", imageUrl: string }]` (3 items)

### POST /api/iterate
**In:** `{ imageUrl: string, editPrompt: string }`
**Out:** `{ imageUrl: string }`

### POST /api/transcribe
**In:** `multipart/form-data` with field `audio` (Blob, `audio/mp4` on iOS or `audio/webm` elsewhere)
**Out:** `{ text: string }`

### POST /api/narrate
**In:** `{ text: string, voiceId?: string }`
**Out:** `{ audioUrl: string }`

### POST /api/walkthrough
**In:** `{ imageUrl: string }`
**Out:** `{ videoUrl: string }` (may take 60+ seconds)

---

## Key prompts (drop into `/lib/prompts.ts`)

### Vision analysis prompt

```
You are an interior design analyst. Look at this room photo and return a structured JSON describing what you see.

Identify:
- roomType (living room, bedroom, kitchen, etc.)
- estimatedSizeM2 (a rough number)
- lighting (natural / artificial, direction if visible)
- currentStyle (a short descriptive phrase)
- keyElements: list the main movable items (sofa, table, rug)
- fixedElements: list things that should NOT change in a redesign (windows, doors, ceiling, structural walls, plumbing fixtures)

Also write a friendly one-paragraph narration (narrationText) suitable for a designer to speak aloud, conversational and warm, ~30 words.

Return ONLY valid JSON, no markdown.
```

### Style generation prompt template

```
A photorealistic interior design redesign of the same room shown in the reference image, in {STYLE} style.

CRITICAL: Preserve all of these from the original — do not move, remove, or alter:
- Window positions and sizes
- Door positions
- Ceiling height and structure
- Wall layout
- Floor material (unless style explicitly calls for change)

Replace and restyle:
- All furniture
- Decor and accessories
- Wall paint colour
- Lighting fixtures (if appropriate)
- Rugs and textiles

Style: {STYLE_DESCRIPTION}

Render at high quality, natural daylight, slight depth of field, professional interior photography aesthetic.
```

Style descriptions:
- **Scandi:** *"Light oak wood, off-white walls, soft greys, sheepskin throws, simple Nordic furniture, lots of negative space, plants, brass accents."*
- **Japandi:** *"Warm minimal — light timber, paper lanterns, low natural-fibre furniture, neutral tones, subtle greenery, calm and uncluttered."*
- **Industrial:** *"Exposed brick or concrete accent wall, dark metal fixtures, leather upholstery, edison bulbs, dark stained wood, urban warehouse feel."*

### Iteration prompt template

```
Edit the provided redesign image with this change: "{USER_EDIT}"

Preserve everything else in the image. Only modify what the instruction calls for. Maintain the same style, lighting, and composition.
```

---

## Demo script (90 seconds, for stage)

1. **(15s) Hook:** "Singaporeans spend up to a hundred thousand dollars on home renovation and have to commit before they can see the result. Designers are expensive and slow. We built Reno."
2. **(10s) Capture:** "Let's redesign this corner of the room right now." Walk to a part of the venue, take a photo on phone.
3. **(15s) Analyse:** Upload. Voice narration plays automatically describing what the AI sees. Three style cards begin loading.
4. **(15s) Reveal:** Three photorealistic redesigns appear. "Three styles, generated in twenty-five seconds, each preserving the existing windows and walls."
5. **(15s) Iterate by voice:** "Let's tweak this one." Hold mic: *"Make the sofa green and add a tall plant."* Image updates in 6 seconds.
6. **(10s) Shop:** "Every item here is real, available in Singapore right now." Scroll the product strip. "Total cost for this room: about four thousand dollars."
7. **(10s) Walk-through:** "And before they spend a cent, they can step inside." Tap walk-through. Veo 3 video plays.
8. **(close) Pitch:** "Five revenue streams: subscription, furniture affiliates, designer leads, white-label for retailers, and a real estate tier. Reno."

---

## Cut-scope rules (when running behind)

Cut features in this exact order:

1. **First to cut:** Live Veo 3 generation. Use only the pre-rendered canonical example.
2. **Second:** Voice iteration. Keep text iteration only.
3. **Third:** Shoppable overlay. Just show a static "estimated total cost" line.
4. **Fourth:** Iteration entirely. User can only see the three initial redesigns.
5. **Fifth:** ElevenLabs narration. Display analysis as text only.

**Never cut:** photo upload, vision analysis, three style redesigns, pre-seeded canonical demo.

If by hour 5 you still don't have all three style redesigns generating reliably, **stop adding features and polish the canonical demo to perfection.** A flawless 60-second demo of two features beats a buggy 90-second demo of six.

---

## Platform notes & known gotchas

These are real constraints learned the hard way. Plan around them, don't discover them on stage.

**Vercel function timeout.**
- Hobby tier caps serverless functions at **10s**. Image generation alone takes 15–30s; three in parallel each take that long. You will hit timeouts.
- **Use Vercel Pro ($20/mo) for 60s functions**, or implement the job-poll pattern (return job ID immediately, client polls for result). For a 7-hour hackathon, just buy Pro.
- Veo 3 walk-through cannot live within any Vercel function — it must be a job-poll pattern regardless. Or, just play the pre-rendered MP4.

**iOS Safari.**
- **`webkitSpeechRecognition` is not supported.** This is why we use OpenAI transcribe via MediaRecorder.
- **`<audio>` autoplay is blocked** without a prior user gesture. The first tap (e.g., the "Try it" button on the upload screen) unlocks audio for the rest of the session. Don't auto-play narration before any user interaction.
- **`MediaRecorder` outputs `audio/mp4`**, not `audio/webm`. Whisper accepts both, but check `MediaRecorder.isTypeSupported()` before choosing.
- **HEIC photos** from iPhones may not decode server-side. Convert to JPEG client-side (e.g., draw to `<canvas>` and `toBlob('image/jpeg')`) before upload.
- **`capture="environment"`** opens the camera but iOS sometimes ignores it and goes straight to the photo library. Test on a real device.

**Image generation fidelity.**
- OpenAI image models do **not** have true structural-preservation. Prompting "preserve windows, doors, ceiling" works ~60% of the time. The model often regenerates a *similar* room rather than the *same* room restyled.
- The canonical demo (where you've hand-curated good outputs) will look perfect. Live judge photos will be hit-or-miss. Frame the demo accordingly: "here are three reimaginings of your space" — not "here is your exact room redesigned."

**Model names.**
- `gpt-image-2` and `gpt-5.5` are speculative names in this plan. Assume you'll be on `gpt-image-1` and `gpt-5` / `gpt-4o`. Don't burn time hunting for newer model IDs.

**Web Speech API.**
- Removed entirely. Use OpenAI transcribe (see Hour 3–4). Web Speech only works on Chrome desktop and Android Chrome — not iOS Safari, not iOS Chrome (which uses WebKit).

---

## Critical "must work on stage" checklist

- [ ] Phone camera upload works on iOS Safari and Chrome Android (HEIC → JPEG conversion in place)
- [ ] Vision analysis returns valid JSON 95%+ of the time (test with 10 different real photos)
- [ ] Three style redesigns complete within 30 seconds total
- [ ] Voice input works end-to-end on iOS Safari (MediaRecorder → /api/transcribe → /api/iterate)
- [ ] First-tap audio unlock implemented so ElevenLabs narration plays on iOS
- [ ] Vercel project on **Pro tier** so functions don't time out at 10s
- [ ] Canonical Veo 3 walk-through MP4 in `/public/demo/` (pre-rendered, not live)
- [ ] Pre-seeded canonical demo loads instantly and looks beautiful
- [ ] Vercel URL works on the venue WiFi (test the day before — venue WiFi can block calls)
- [ ] Have OpenAI / Gemini / ElevenLabs all funded with credits, not hitting rate limits
- [ ] Demo script rehearsed end-to-end three times
- [ ] One team member's phone has hotspot ready as backup if venue WiFi fails
- [ ] Mic permission already granted on the demo phone before going on stage

---

## Things to NOT do

- Do not build authentication. The demo doesn't need it.
- Do not build a database schema. SessionStorage and in-memory only.
- Do not optimise for production cost. Burn API credits freely during the build.
- Do not build a landing page or marketing site. The app IS the demo.
- Do not write tests.
- Do not build settings, preferences, or profile pages.
- Do not add analytics events.
- Do not over-engineer the catalog matching. Hardcode 20 items and move on.
- Do not try to support multi-room layouts.
- Do not add account-tier logic (free vs paid).
- Do not split the codebase into packages or a monorepo.

---

## Kickoff instructions for the agent

1. **Walk me through your understanding of the plan in 5 bullet points before writing any code.** Confirm you know which features are mandatory and which are cuttable.
2. **Start with hour 0–0.5 (scaffold) and complete the deploy step before continuing.** Get a Vercel URL live first.
3. **Implement the canonical demo data and `/demo` page early — by hour 2.** Even if other features are incomplete, this guarantees a fallback exists.
4. **Test on a real phone after every major feature.** Desktop testing alone is not sufficient — the demo runs on a phone.
5. **Make small decisions inline without asking.** Only ask for guidance on scope changes or if a sponsor's API is broken.
6. **Stop and report at hour 4 (midpoint).** Show what's working and what isn't, before continuing.
