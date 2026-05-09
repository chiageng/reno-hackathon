# Coding Standards & Best Practices

> **Audience**: AI coding agents (and humans) working on this Next.js fullstack hackathon repo (**Reno**).
> **Purpose**: Lock in project-specific conventions that cannot be inferred from the codebase, and prevent common mistakes.
>
> Treat every rule below as **MUST** unless explicitly marked as a recommendation. When in doubt, mirror existing files in the repo.
>
> Companion docs:
> - [`CLAUDE.md`](./CLAUDE.md) — operating manual & golden rules (auto-loaded into every session)
> - [`reno-execution-plan.md`](./reno-execution-plan.md) — product spec, hour-by-hour plan, API contracts, prompts

---

## Table of Contents
1. [TL;DR Checklist](#tldr-checklist)
2. [Stack & Versions](#stack--versions)
3. [General Principles](#general-principles)
4. [Client-Side Pages, Server-Side Routes](#client-side-pages-server-side-routes)
5. [TypeScript Standards](#typescript-standards)
6. [React & Component Standards](#react--component-standards)
7. [API Integration Patterns (Frontend)](#api-integration-patterns-frontend)
8. [Backend / Route Handler Standards](#backend--route-handler-standards)
9. [External AI SDK Integration](#external-ai-sdk-integration)
10. [Authentication](#authentication)
11. [State Management](#state-management)
12. [Styling & UI Standards](#styling--ui-standards)
13. [Error Handling & User Feedback](#error-handling--user-feedback)
14. [Code Organization](#code-organization)
15. [Naming Conventions](#naming-conventions)
16. [Performance & Optimization](#performance--optimization)
17. [Hackathon Mindset](#hackathon-mindset)
18. [Anti-Patterns Reference](#anti-patterns-reference)

---

## TL;DR Checklist

Stop and re-read this list before finishing any task.

**Frontend (client components)**
- [ ] Every component file starts with `"use client";`
- [ ] All imports use `@/` (no relative paths like `../../`)
- [ ] Type imports use the `type` keyword: `import type { ... } from '...'`
- [ ] Never import `message` or `Modal` directly from `antd` — use `useMessage()` / `useModal()` from `@/utils/common`
- [ ] Never hardcode colors — use `colorConfig` from `@/config/colors`
- [ ] Use `<HText>` / `<PText>` from `@/components/MyText` instead of raw `<h1>` / `<p>`
- [ ] All HTTP via TanStack Query — `fetch('/api/...')` lives **inside** `queryFn` / `mutationFn`, never in component bodies or event handlers
- [ ] **Never import an AI SDK (`openai`, `elevenlabs`, `@google/genai`, `@vercel/blob`) into a client component**

**Backend (Route Handlers `src/app/api/**/route.ts`)**
- [ ] No `"use client";` in a route handler
- [ ] Long-running routes export `maxDuration` (60s for image gen, narration, video)
- [ ] API keys are read from `process.env.X` directly — never `NEXT_PUBLIC_X`
- [ ] Errors return `NextResponse.json({ error }, { status })`, never throw a stack trace at the client
- [ ] AI SDK clients are constructed in `src/lib/{openai,elevenlabs,gemini}.ts` and imported from there

**Universal**
- [ ] Avoid `any`. If unavoidable (untyped third-party data), comment why
- [ ] Event handlers prefixed with `handle*`; booleans prefixed with `is/has/should/can`
- [ ] No `console.log` in committed code (`console.error` / `console.warn` are OK)
- [ ] Prefer editing existing files over creating new ones
- [ ] Never edit `src/client/*.gen.ts` (dormant for hackathon, but still off-limits)

---

## Stack & Versions

### Frontend
| Library | Version | Notes |
|---|---|---|
| Next.js | 15.x (App Router, Turbopack) | Pages are client-rendered. Backend is Next.js Route Handlers — see [Client-Side Pages, Server-Side Routes](#client-side-pages-server-side-routes) |
| React | 19.x | |
| TypeScript | 5.x | |
| Ant Design | 5.x | UI component library — primary source of components |
| TanStack Query | 5.x | All server state goes through this |
| Tailwind CSS | 4.x | Available, but inline styles + `colorConfig` are the dominant pattern |

### Backend (Route Handlers + AI SDKs)
| Library | Version | Used in | Purpose |
|---|---|---|---|
| `openai` | latest | `src/lib/openai.ts` | Vision (`gpt-4o`/`gpt-5`), image gen (`gpt-image-1`/`gpt-image-2`), STT (`gpt-4o-mini-transcribe` / `whisper-1`) |
| `elevenlabs` | latest | `src/lib/elevenlabs.ts` | Text-to-speech narration |
| `@google/genai` | latest | `src/lib/gemini.ts` | Veo 3 video generation |
| `@vercel/blob` | latest | route handlers | Image upload storage |
| `@fal-ai/serverless-client` | latest (optional) | `src/lib/fal.ts` | Optional image-gen acceleration |

### Dormant for hackathon (don't use)
| Library | Notes |
|---|---|
| `@hey-api/openapi-ts` | Generates `src/client/*.gen.ts` from an external backend's OpenAPI spec. **Not used** for hackathon — backend logic is in `src/app/api/**`. |

When you need a UI element, default to **Ant Design** before pulling another library. When you need an AI capability, default to the SDKs already listed above before adding another dependency.

---

## General Principles

1. **Never edit auto-generated files** — `*.gen.ts` (specifically `src/client/sdk.gen.ts`, `src/client/types.gen.ts`, `src/client/client.gen.ts`). Dormant for hackathon, but still off-limits.
2. **Prefer editing over creating** — only create a new file when no existing file fits.
3. **DRY** — extract shared logic into `src/utils/`, `src/hooks/`, or shared components in `src/components/`. **For the hackathon, don't over-DRY** — three similar lines are better than a premature abstraction.
4. **KISS** — prefer obvious code over clever code. A junior reading it later should not be surprised.
5. **Absolute imports always** — use `@/` prefix, never relative paths like `../../`.
6. **Mirror existing patterns** — when adding something new (page, form, route handler), look at an existing one in this repo and follow its shape.
7. **Demo-first.** A working demo of fewer features beats a buggy demo of more. See [Hackathon Mindset](#hackathon-mindset).

---

## Client-Side Pages, Server-Side Routes

**Pages and components**: client-only — no Server Components, no SSR, no Server Actions.
**Backend logic**: Next.js Route Handlers (`src/app/api/**/route.ts`) — server-side, but they're **not** React Server Components. They're a different primitive entirely.

### Rules for pages and components

```typescript
// ✅ ALWAYS — every page/component file begins with this directive
"use client";

import React from 'react';
// ...
```

- **Every** `.tsx` file under `src/app/` (except `src/app/api/`), `src/components/`, and `src/contexts/` MUST start with `"use client";`.
- Do **not** use `async` page/layout components (that pattern is Server Components).
- Do **not** use `next/headers`, `next/cookies`, or any `server-only` API in pages.
- Do **not** use Server Actions.
- Data fetching happens client-side via TanStack Query, calling our own `/api/*` Route Handlers.
- It's fine to access `window`, `localStorage`, `document` directly inside `useEffect` or event handlers.

### Rules for Route Handlers

```typescript
// ✅ src/app/api/analyze/route.ts — NEVER add "use client"
import { NextResponse } from 'next/server';

export const maxDuration = 60; // for long-running AI calls

export async function POST(req: Request) {
  // server-side only
}
```

- Route handlers live **only** under `src/app/api/**/route.ts`.
- They are server-side; they read `process.env.OPENAI_API_KEY` (and similar) directly.
- They never import React components, hooks, or anything client-only.

### Why
Pages are client-rendered to keep token handling and hydration simple. Backend logic lives in Route Handlers because we need to keep AI API keys server-side — a bare-browser call to OpenAI would leak the key.

---

## TypeScript Standards

### 1. Type-only imports
```typescript
// ✅ CORRECT
import type { UserResponse } from '@/client/types.gen';
import type { FC, ReactNode } from 'react';

// ❌ WRONG
import { UserResponse } from '@/client/types.gen';
```

### 2. Interfaces vs types
- Use `interface` for object shapes (props, API objects).
- Use `type` for unions, intersections, primitives, and mapped types.

```typescript
interface UserCardProps {
  user: UserResponse;
  onEdit: (id: string) => void;
  isEditable?: boolean;
}

type Status = 'pending' | 'approved' | 'rejected';
```

### 3. Avoid `any`

`any` defeats type checking. Default to proper types or `unknown`.

```typescript
// ✅ CORRECT
const data: UserResponse = response.data;
const raw: unknown = JSON.parse(payload);

// ✅ ACCEPTABLE — only with a comment explaining why
// WebSocket payloads are dynamic and not typed by backend
const handleMessage = (data: any) => { /* ... */ };

// ❌ WRONG — reaching for `any` to silence the compiler
const data: any = response.data;
```

### 4. Const objects
```typescript
const ACTION_TYPE = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
} as const satisfies Record<string, string>;
```

---

## React & Component Standards

### 1. File template
```typescript
"use client";

import React, { useState, useEffect } from 'react';
import { Button, Card } from 'antd';
import { HText } from '@/components/MyText';
import type { UserResponse } from '@/client/types.gen';

interface MyComponentProps {
  title: string;
  user: UserResponse;
  onSubmit: (id: string) => void;
  isLoading?: boolean;
}

export default function MyComponent({
  title,
  user,
  onSubmit,
  isLoading = false,
}: MyComponentProps) {
  // 1. State
  const [draft, setDraft] = useState<string>('');

  // 2. Hooks (queries, mutations, effects)
  useEffect(() => {
    // ...
  }, [user.id]);

  // 3. Event handlers
  const handleSubmit = () => {
    onSubmit(user.id);
  };

  // 4. Render — use early returns for loading/empty/error states
  if (isLoading) return null;

  return (
    <Card>
      <HText variant="h4">{title}</HText>
      <Button onClick={handleSubmit}>Submit</Button>
    </Card>
  );
}
```

### 2. Where to put a component
- **`src/components/`** — used by 2+ pages, or part of the app shell (layout, navigation, providers).
- **`src/app/<route>/`** — used by exactly one page; co-locate it next to `page.tsx`.

```
src/app/redesign/
├── page.tsx          # Route component
├── PhotoUpload.tsx   # Page-specific upload (co-located)
└── StyleGrid.tsx     # Page-specific result grid (co-located)
```

### 3. Hooks rules
- Custom hooks must start with `use`.
- Call hooks at the top level — never inside conditionals, loops, or after early returns.
- Custom hooks live in `src/hooks/` (create the directory when first needed).

### 4. Props
- Always destructure props in the function signature.
- Provide defaults for optional props in the signature, not inside the body.
- Avoid `React.FC` for new components — use the plain function signature shown in the template above (existing files using `React.FC` may stay).

---

## API Integration Patterns (Frontend)

The frontend talks to **our own Next.js Route Handlers** under `/api/*`. Backend logic lives in `src/app/api/**/route.ts` — see [Backend / Route Handler Standards](#backend--route-handler-standards) for the route side.

### 1. Always go through TanStack Query
Even though `fetch('/api/...')` is "just a fetch," wrap it in `useQuery` / `useMutation` so we get loading state, retries, and cache invalidation for free. **Never call `fetch` from a component body or event handler directly.**

### 2. Inline `fetch` lives inside `queryFn` / `mutationFn`
For a hackathon repo we skip the typed-helper layer. The fetch call sits **inline** inside the TanStack Query callback. Define the response type next to the call.

### 3. POST — `useMutation` (the dominant pattern in this repo)

```typescript
"use client";

import { useMutation } from '@tanstack/react-query';
import { useMessage } from '@/utils/common';

interface AnalysisResult {
  roomType: string;
  estimatedSizeM2: number;
  lighting: string;
  currentStyle: string;
  keyElements: string[];
  fixedElements: string[];
  narrationText: string;
}

const { displayErrorMessage } = useMessage();

const { mutate, data, isPending } = useMutation({
  mutationFn: async (imageUrl: string): Promise<AnalysisResult> => {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl }),
    });
    if (!res.ok) throw new Error((await res.json()).error ?? 'Analyze failed');
    return res.json();
  },
  onError: (error) => displayErrorMessage(error, 'Could not analyze the photo'),
});

mutate(imageUrl);
```

### 4. GET — `useQuery` (rare in this repo)

```typescript
const { data, isLoading } = useQuery({
  queryKey: ['catalog'],
  queryFn: async () => {
    const res = await fetch('/api/catalog');
    if (!res.ok) throw new Error('Failed to load catalog');
    return res.json();
  },
});
```

### 5. Multipart / file upload (e.g. transcribe)

```typescript
const { mutate } = useMutation({
  mutationFn: async (audioBlob: Blob): Promise<{ text: string }> => {
    const form = new FormData();
    form.append('audio', audioBlob);
    const res = await fetch('/api/transcribe', { method: 'POST', body: form });
    if (!res.ok) throw new Error('Transcription failed');
    return res.json();
  },
});
```

### 6. Query key conventions
- Always an array. First element is the resource name, rest are scoping arguments.
- Mutations should `invalidateQueries` on the resource name(s) they affect.

```typescript
['analysis', imageUrl]                   // single resource by id
['styles', imageUrl]                     // derived list
['catalog']                              // static-ish list
```

### 7. Don't use the dormant generated SDK
`src/client/*.gen.ts` would be the way to call an external backend. For the hackathon there is no external backend — call our own `/api/*` Route Handlers via inline `fetch` as shown above.

---

## Backend / Route Handler Standards

All backend logic for the hackathon lives in **Next.js Route Handlers** under `src/app/api/**/route.ts`. The contracts (input/output JSON shape per route) are in [`reno-execution-plan.md`](./reno-execution-plan.md) § "API contracts" — when in doubt, follow that.

### 1. File template

```typescript
// src/app/api/analyze/route.ts
import { NextResponse } from 'next/server';
import { analyzeRoomImage } from '@/lib/openai';

// Default Vercel timeout is 10s on Hobby. Image gen / video / narration need more.
// Pro tier caps at 60s — set this on any route that calls an AI provider.
export const maxDuration = 60;

interface AnalyzeBody {
  imageUrl: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<AnalyzeBody>;
    if (!body.imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
    }

    const analysis = await analyzeRoomImage(body.imageUrl);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('[POST /api/analyze]', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
```

### 2. Rules

- **No `"use client";`** — route handlers are server-side by definition.
- **`maxDuration = 60`** on any route that calls an AI provider (image gen, narration, video). Vercel Hobby caps at 10s; we deploy on Pro for 60s.
- **Read API keys from `process.env.X` directly.** Never `NEXT_PUBLIC_X` (that exposes them to the browser).
- **Validate inputs minimally** — a single `if (!body.imageUrl)` guard is enough. Don't pull in Zod for a hackathon.
- **Return shape:**
  - Success: `NextResponse.json(payload)` with status 200.
  - Failure: `NextResponse.json({ error: 'human-readable string' }, { status: 4xx | 5xx })`.
  - **Never let a stack trace reach the client.** Wrap every handler body in `try/catch` and `console.error` the real error server-side.
- **Construct AI clients in `src/lib/{openai,elevenlabs,gemini}.ts`** and import the helper from the route. Keeps secrets and SDK quirks in one place.
- **Don't read `cookies()` / `headers()` / `next/headers` APIs** unless you actually need them — most Reno routes just take a JSON body.

### 3. Handling long jobs (Veo 3 walk-through)

Veo 3 jobs can take 30–120 seconds — longer than the 60s Vercel cap.

- Pre-render the canonical walk-through and serve it as a static file from `public/demo/canonical-walkthrough.mp4`.
- For on-demand generation in `/api/walkthrough`, return a job ID immediately and have the client poll a `GET /api/walkthrough/[jobId]` until the video is ready. Only attempt this if there's time after the demo essentials are working.

### 4. Don't expose providers from the route shape

The frontend should not care which provider produced an output. Keep response shapes neutral — e.g. `{ imageUrl }`, `{ audioUrl }`, `{ text }` — even if internally you switch from `gpt-image-1` to `gpt-image-2` to Fal.

---

## External AI SDK Integration

All AI provider SDKs (`openai`, `elevenlabs`, `@google/genai`, `@vercel/blob`, optional `@fal-ai/serverless-client`) are constructed once in `src/lib/` and imported from there.

### 1. Where each SDK lives

| File | Provider | Used for |
|---|---|---|
| `src/lib/openai.ts` | OpenAI | Vision (`gpt-4o`/`gpt-5`), image gen (`gpt-image-1`/`gpt-image-2`), STT (`gpt-4o-mini-transcribe`/`whisper-1`) |
| `src/lib/elevenlabs.ts` | ElevenLabs | Text-to-speech narration |
| `src/lib/gemini.ts` | Google | Veo 3 video generation |
| `src/lib/prompts.ts` | — | All prompt templates (vision, style gen, iteration) |

### 2. Module template

```typescript
// src/lib/openai.ts — server-only
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeRoomImage(imageUrl: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [/* see src/lib/prompts.ts */],
  });
  // parse + return typed result
}

export async function generateStyleImage(opts: { /* ... */ }) {
  // ...
}
```

### 3. Rules

- **Server-only imports.** These files must never be imported from a `page.tsx` or component. The bundler will warn; in any case the API key won't exist in the browser bundle.
- **Single client instance per SDK** — construct once at module scope, reuse across requests.
- **Model fallbacks**: speculative model names (`gpt-image-2`, `gpt-5.5`) may not be available. If the call 404s, fall back to the documented stable name (`gpt-image-1`, `gpt-4o`). Log which model was used.
- **Prompts live in `src/lib/prompts.ts`**, not inlined in `route.ts` or `lib/openai.ts`. Easier to tune.
- **Never `console.log` secrets, full image base64, or full audio buffers.** Use `console.error` for diagnostic info only.

---

## Authentication

Authentication uses a bearer token managed by `src/lib/api-client.ts` and exposed through `AuthContext` in `src/contexts/AuthContext.tsx`.

> **Dormant for the hackathon.** The Reno demo has no login. `AuthContext` and `api-client.ts` exist for the dormant external-backend SDK only — you should not reference them in new code. The rules below apply if/when auth is reactivated.

### Reading auth state in a component
```typescript
"use client";

import { useAuth } from '@/contexts/AuthContext';

export default function Profile() {
  const { token, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) return null;
  // ...
}
```

### Rules
- Token is stored in `localStorage` under the key `authToken` and re-applied to the API client on mount.
- Call `login(token)` after a successful login response. Call `logout()` on sign-out.
- Don't read `localStorage.getItem('authToken')` directly from components — go through `useAuth()`.
- The `AuthProvider` is mounted in `src/app/layout.tsx`. Don't nest a second one.

---

## State Management

| Kind of state | Tool |
|---|---|
| Component-local (form input, toggle, modal open) | `useState` |
| Server data (fetched from backend) | TanStack Query — `useQuery` / `useMutation` |
| Auth | `useAuth()` (`src/contexts/AuthContext.tsx`) |
| Cross-component UI state shared by many pages | New context in `src/contexts/` |
| Form fields | Ant Design `Form` (`Form.useForm()`) |
| WebSocket | `useRef<WebSocket>` + `useEffect` cleanup |

### Form pattern
```typescript
"use client";

import { Form, Input, Button } from 'antd';

export default function CreateUserForm() {
  const [form] = Form.useForm();

  const handleFinish = (values: { name: string; email: string }) => {
    // submit
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish}>
      <Form.Item name="name" label="Name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
        <Input />
      </Form.Item>
      <Button type="primary" htmlType="submit">Submit</Button>
    </Form>
  );
}
```

### WebSocket pattern
```typescript
const wsRef = useRef<WebSocket | null>(null);

useEffect(() => {
  const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/ws`);
  wsRef.current = ws;

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // ...
  };

  return () => ws.close();
}, []);
```

---

## Styling & UI Standards

### 1. Colors — always go through `colorConfig`
```typescript
import { colorConfig } from '@/config/colors';

<div style={{ color: colorConfig.primaryColor }}>Text</div>
<div style={{ backgroundColor: colorConfig.successColor }}>OK</div>

// ❌ NEVER hardcode hex/rgb values in components
<div style={{ color: '#1890ff' }} />
```

If a color you need doesn't exist in `colorConfig`, **add it to `src/config/colors.ts`** rather than inlining a literal.

### 2. Typography — `<HText>` / `<PText>`
```typescript
import { HText, PText } from '@/components/MyText';

<HText variant="h1">Page Title</HText>     // 48px bold
<HText variant="h2">Section</HText>        // 40px bold
<HText variant="h4">Card Title</HText>     // 24px bold
<PText variant="normal">Body</PText>       // 16px
<PText variant="small">Caption</PText>     // 14px

// ❌ Don't use raw <h1>, <h2>, <p> for content text
```

### 3. Layout primitives
- Page width container: `<SectionContainer maxWidth="1400px">…</SectionContainer>` (`src/components/SectionContainer.tsx`).
- App shell / navigation: `<AppLayout>` (`src/components/AppLayout.tsx`).

### 4. Spacing
Use multiples of **4px**: `4, 8, 12, 16, 24, 32, 48, 64`. Inline `style` is acceptable; CSS classes via Tailwind are also available if preferred for one-off layouts.

### 5. Responsive design (no SSR-unsafe code)
Since this is client-only, `window` is fine — but only inside hooks/effects, not at module scope.

```typescript
// ✅ CORRECT
const [isMobile, setIsMobile] = useState(false);
useEffect(() => {
  const update = () => setIsMobile(window.innerWidth < 768);
  update();
  window.addEventListener('resize', update);
  return () => window.removeEventListener('resize', update);
}, []);

// ❌ WRONG — runs at module load; brittle and not reactive
const isMobile = window.innerWidth < 768;
```

For most cases, prefer Ant Design's responsive `Grid` / `Col` props or CSS media queries over JS measurements.

---

## Error Handling & User Feedback

### 1. Messages — `useMessage()`
```typescript
import { useMessage } from '@/utils/common';

const { displaySuccessMessage, displayErrorMessage, displayInfoMessage, displayWarningMessage } = useMessage();

displaySuccessMessage(response.data, 'Saved!');     // reads response.data.message, falls back to "Saved!"
displayErrorMessage(error, 'Failed to save');       // reads error.detail/error.message, falls back
displayInfoMessage('Processing…');
displayWarningMessage('Heads up!');

// ❌ NEVER:
import { message } from 'antd';
message.success('...');
```

### 2. Modals — `useModal()`
```typescript
import { useModal } from '@/utils/common';

const { modal } = useModal();

modal.confirm({
  title: 'Delete item?',
  content: 'This cannot be undone.',
  centered: true,           // always include `centered: true`
  okText: 'Delete',
  okType: 'danger',
  cancelText: 'Cancel',
  onOk: () => deleteItem(),
});

// ❌ NEVER:
import { Modal } from 'antd';
Modal.confirm({ /* ... */ });
```

### 3. Async error handling
- Inside `useMutation`, use `onSuccess` / `onError` — that's the primary pattern.
- For raw async work outside mutations, wrap in `try/catch` and route through `displayErrorMessage`.

```typescript
const handleClick = async () => {
  try {
    await doSomething();
    displaySuccessMessage({}, 'Done!');
  } catch (error) {
    displayErrorMessage(error, 'Something went wrong');
    console.error('[doSomething]', error);
  }
};
```

### 4. Loading & empty states
- Use early returns, not nested ternaries.

```typescript
if (isLoading) return <Spin />;
if (error) return <PText>Failed to load.</PText>;
if (!data || data.length === 0) return <PText>No data yet.</PText>;
return <List items={data} />;
```

---

## Code Organization

### Directory map
```
src/
├── app/
│   ├── api/                # 🆕 BACKEND — Route Handlers (server-only)
│   │   ├── analyze/route.ts
│   │   ├── generate-styles/route.ts
│   │   ├── iterate/route.ts
│   │   ├── transcribe/route.ts
│   │   ├── narrate/route.ts
│   │   └── walkthrough/route.ts
│   ├── demo/page.tsx       # 🆕 Pre-seeded canonical demo (bulletproof fallback)
│   ├── layout.tsx          # Root layout — providers mounted here
│   ├── page.tsx            # Home — main upload → redesign flow
│   └── <route>/            # Page + co-located components
├── components/             # Shared components used in 2+ places
├── client/                 # 🚫 AUTO-GENERATED, dormant for hackathon — do not edit
├── contexts/               # React Context providers (AuthContext — dormant)
├── hooks/                  # Custom hooks (create when first needed)
├── lib/                    # External integrations / SDK glue
│   ├── openai.ts           # 🆕 Server-only — OpenAI client + helpers
│   ├── elevenlabs.ts       # 🆕 Server-only — ElevenLabs TTS
│   ├── gemini.ts           # 🆕 Server-only — Google Gemini / Veo 3
│   ├── prompts.ts          # 🆕 Prompt templates
│   ├── catalog.ts          # 🆕 Hardcoded IKEA SG catalog
│   ├── demo-data.ts        # 🆕 Canonical pre-seeded outputs
│   └── api-client.ts       # External backend SDK config (dormant)
├── config/                 # Static config (colors.ts, …)
└── utils/                  # Pure utility functions and shared hooks (common.ts)

public/
└── demo/                   # 🆕 Pre-rendered canonical assets (Veo 3 mp4, before/after jpgs)
```

### File naming
- **Components**: `PascalCase.tsx` — `UserCard.tsx`, `AlarmForm.tsx`
- **Utilities / non-component modules**: `camelCase.ts` — `apiClient.ts`, `formatters.ts`
- **Pages**: `page.tsx`, `layout.tsx` (Next.js convention)

### Environment variables

Two distinct kinds. Mixing them up will either leak secrets or produce `undefined` at runtime.

**Server-only** (read from Route Handlers + `src/lib/{openai,elevenlabs,gemini}.ts`):
- **Never** prefix with `NEXT_PUBLIC_` — that exposes the value to the browser bundle.
- Read directly: `process.env.OPENAI_API_KEY`.
- Examples in this repo: `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, `GEMINI_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `FAL_KEY`.

**Public** (safe to expose to the browser):
- MUST be prefixed `NEXT_PUBLIC_` (Next.js requirement).
- Read with a sensible default:
  ```typescript
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  ```

Document any new var in `.env.example`.

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Variable / function | `camelCase` | `userName`, `getUserData()` |
| React component | `PascalCase` | `UserProfile` |
| Component file | `PascalCase.tsx` | `UserProfile.tsx` |
| Constant (top-level immutable primitive) | `UPPER_SNAKE_CASE` | `MAX_RETRIES`, `API_BASE_URL` |
| Const object map | `UPPER_SNAKE_CASE` + `as const satisfies …` | `ACTION_TYPE` |
| Type / Interface | `PascalCase` | `UserCardProps` |
| Boolean | prefix `is/has/should/can` | `isLoading`, `hasError` |
| Event handler | prefix `handle` | `handleSubmit`, `handleChange` |
| Custom hook | prefix `use` | `useAuth`, `useMessage` |
| Query key element | `kebab-case` strings or `camelCase` keys | `['user', userId]`, `['users', { isActive: true }]` |

---

## Performance & Optimization

### 1. Memoization
Use sparingly — only when there's a measurable problem or a clear hot path.
```typescript
const sortedUsers = useMemo(
  () => [...users].sort((a, b) => a.name.localeCompare(b.name)),
  [users],
);

const handleClick = useCallback(() => { /* … */ }, []);
```

### 2. `useEffect` dependencies
Always include every reactive value the effect reads. The ESLint `react-hooks/exhaustive-deps` rule must stay green — don't disable it.

### 3. List keys
Use stable IDs from your data (`user.id`), never the array index.

### 4. Conditional rendering
Prefer early returns over nested ternaries (see [Loading & empty states](#4-loading--empty-states)).

---

## Hackathon Mindset

Reno is a 7-hour build for AI Engineer Singapore 2026. Read [`reno-execution-plan.md`](./reno-execution-plan.md) for the full plan; the rules below are the engineering posture that comes with it.

1. **Ship for demo, not for production.** The goal is a flawless 90-second on-stage flow, not a maintainable codebase.
2. **The canonical `/demo` route is sacred.** Even if everything else fails, that flow must work. Test it after every meaningful change.
3. **Cut features in this order when behind** (from `reno-execution-plan.md` § "Cut-scope rules"):
   1. Live Veo 3 generation → use only the pre-rendered canonical
   2. Voice iteration → keep text-only
   3. Shoppable overlay → static "estimated cost" line
   4. Iteration entirely → only the 3 initial redesigns
   5. ElevenLabs narration → display analysis as text
   - **Never cut**: photo upload, vision analysis, three style redesigns, pre-seeded canonical demo.
4. **Don't refactor unrelated code while fixing a bug.** Don't introduce abstractions for hypothetical future flexibility.
5. **No tests.** Type checking and a working demo are the only verification.
6. **No auth, no DB, no analytics.** `sessionStorage` and in-memory state only.
7. **When the AI provider misbehaves**, fall back rather than retrying forever. The canonical demo data is the ultimate fallback.
8. **Burn API credits freely** during the build — don't optimize cost.

---

## Anti-Patterns Reference

A consolidated list of things that should never appear in a PR.

### Frontend
| ❌ Anti-pattern | ✅ Use instead |
|---|---|
| `import { message } from 'antd'` | `useMessage()` from `@/utils/common` |
| `import { Modal } from 'antd'` (for confirm/info dialogs) | `useModal()` from `@/utils/common` |
| `<h1>`, `<p>` for content text | `<HText>`, `<PText>` from `@/components/MyText` |
| Hardcoded hex / rgb colors | `colorConfig` from `@/config/colors` |
| Relative imports `../../` | Absolute imports with `@/` |
| `async function Page()` (Server Component) | `"use client"` + `useQuery` / `useMutation` |
| `fetch('/api/...')` in a component body or event handler | `fetch` inside `queryFn` / `mutationFn` of TanStack Query |
| `import OpenAI from 'openai'` in a `.tsx` component | Server-only — call `/api/*` from the client |
| `process.env.OPENAI_API_KEY` from a client component | Server-only — read it inside a Route Handler |
| `localStorage.getItem('authToken')` in a component | `useAuth()` (dormant for hackathon) |
| `: any` to silence TypeScript | Real type, or `unknown` + narrowing |
| `console.log(...)` in committed code | Remove it (keep `console.error` / `console.warn` if useful) |
| Magic numbers (`setTimeout(fn, 5000)`) | Named constant (`const DEBOUNCE_MS = 500`) |
| Index as React key | Stable ID |
| Calling hooks conditionally | Lift state / split component |

### Backend (Route Handlers)
| ❌ Anti-pattern | ✅ Use instead |
|---|---|
| `"use client";` at top of `route.ts` | Remove it — route handlers are server-side |
| Throwing raw errors / leaking stack traces to the client | `try/catch` + `NextResponse.json({ error }, { status })` |
| `NEXT_PUBLIC_OPENAI_API_KEY` | `OPENAI_API_KEY` (server-only) |
| Constructing `new OpenAI({...})` inside every handler | Once in `src/lib/openai.ts`, import the helper |
| Inlining prompt strings in `route.ts` | Put them in `src/lib/prompts.ts` |
| Adding Zod / a validation library for one route | A single `if (!body.x) return ...` guard |
| Forgetting `export const maxDuration = 60` on AI routes | Add it — Vercel default is 10s |
| Editing files in `src/client/*.gen.ts` | Don't — dormant for hackathon, still off-limits |

---

## Updating This Document

This file is expected to evolve as the project grows. When a new convention is introduced:

1. Add the rule with a ✅/❌ pair (concrete code beats prose).
2. If it replaces an old pattern, update or remove the old text — don't leave both.
3. Add it to the [TL;DR Checklist](#tldr-checklist) and/or [Anti-Patterns Reference](#anti-patterns-reference) so it's discoverable.
4. Bump the date below.

**Last Updated**: 2026-05-09 (repurposed for Reno hackathon — fullstack mode with Next.js Route Handlers)
