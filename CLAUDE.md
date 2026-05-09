# CLAUDE.md

This file is the operating manual for AI agents (Claude Code) working in this repository. It is auto-loaded into every Claude Code session, so keep it concise and high-signal. For deeper conventions, see [`coding_standard.md`](.claude/coding_standard.md).

---

## Project Snapshot

- **What it is**: Next.js 15 (App Router) frontend template. Client-rendered only.
- **UI library**: Ant Design 5
- **Server state**: TanStack Query 5
- **API**: Auto-generated SDK from backend OpenAPI spec (`src/client/*.gen.ts`)
- **Auth**: Bearer token in `localStorage`, managed by `src/contexts/AuthContext.tsx`
- **Styling**: Inline styles + `colorConfig` (Tailwind 4 available but not the dominant pattern)

---

## Golden Rules

These are the highest-leverage rules. Internalize them before editing.

1. **Always read [`coding_standard.md`](.claude/coding_standard.md) before starting a non-trivial task.** It is the source of truth.
2. **Every component file starts with `"use client";`.** This project does NOT use Server Components or SSR.
3. **Never edit `*.gen.ts` files.** They are regenerated via `npm run gen-client`.
4. **Always use `@/` imports.** No `../../` paths.
5. **Never import `message` or `Modal` directly from `antd`.** Use `useMessage()` and `useModal()` from `@/utils/common`.
6. **Never hardcode colors.** Use `colorConfig` from `@/config/colors`.
7. **Never use raw `<h1>`, `<p>` for content text.** Use `<HText>` / `<PText>` from `@/components/MyText`.
8. **Never call the backend with raw `fetch()`.** Use the generated SDK + TanStack Query.
9. **Prefer editing existing files over creating new ones.** Mirror nearby patterns when adding something new.
10. **No `console.log` in committed code** (keep `console.error` / `console.warn` if useful).

---

## Workflow Expectations

### Before writing code
- Skim `.claude/coding_standard.md` sections relevant to the task (API, forms, styling, etc.).
- Look at an existing similar file in the repo and mirror its shape.
- If a backend endpoint is missing, ask first — do not invent a URL or hand-write a `fetch`.

### While writing code
- Follow the file template in `.claude/coding_standard.md` § "React & Component Standards".
- Type everything. Avoid `any`; if unavoidable, leave a one-line comment explaining why.
- All HTTP through `useQuery` / `useMutation`.
- All user-facing messages through `useMessage()`. All confirms through `useModal()`.

### Before declaring done
- Run through the **TL;DR Checklist** at the top of `.claude/coding_standard.md`.
- `npm run lint` must pass.
- For UI changes: confirm visually with `npm run dev`. If you can't run a browser, say so explicitly — don't claim "tested" when you didn't.

---

## Common Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Run production server
npm run lint         # ESLint
npm run gen-client   # Regenerate src/client/*.gen.ts from backend OpenAPI spec
```

---

## Directory Quick Reference

```
src/
├── app/              # Pages (Next.js App Router) — every component is "use client"
├── components/       # Shared components used in 2+ places
├── client/           # 🚫 AUTO-GENERATED — never edit
├── contexts/         # React Context (AuthContext, …)
├── hooks/            # Custom hooks (create when first needed)
├── lib/              # External integrations / SDK glue
├── config/           # Static config (colors.ts, …)
└── utils/            # Pure utilities + shared hooks (useMessage, useModal)
```

**Page-specific components** are co-located next to their `page.tsx`:
```
src/app/dummy/
├── page.tsx
├── DummyForm.tsx
└── DummyList.tsx
```

---

## Key Files to Know

| File | Why it matters |
|---|---|
| `src/app/layout.tsx` | Root layout — providers (`AntdProvider`, `QueryProvider`, `AuthProvider`) mounted here |
| `src/contexts/AuthContext.tsx` | `useAuth()` source — login/logout/token state |
| `src/lib/api-client.ts` | Configures the generated SDK with `baseUrl` + bearer token |
| `src/utils/common.ts` | `useMessage()`, `useModal()`, `useNotification()` — the only sanctioned way to message/dialog |
| `src/config/colors.ts` | `colorConfig` — single source of truth for colors |
| `src/components/MyText.tsx` | `<HText>` / `<PText>` typography components |
| `src/components/AppLayout.tsx` | App shell / navigation |
| `src/components/SectionContainer.tsx` | Page-width container |
| `openapi-ts.config.ts` | Controls how `npm run gen-client` generates the SDK |

---

## Environment

- All client-exposed env vars are prefixed `NEXT_PUBLIC_`.
- Backend URL: `process.env.NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:8000`).
- Document any new var in `.env.example`.

---

## When You're Unsure

- **Naming, file placement, patterns** → read `.claude/coding_standard.md` § "Code Organization" and "Naming Conventions".
- **API call shape** → look at an existing `useQuery` / `useMutation` in `src/app/`.
- **A new convention is needed** → add it to `.claude/coding_standard.md`, not just to the code.
- **The standard contradicts the code** → ask the user which one is authoritative; don't silently pick.

---

## Out of Scope (do not do without explicit request)

- Don't introduce SSR, Server Components, Server Actions, or `next/headers`.
- Don't add new dependencies without asking — prefer Ant Design + existing utilities.
- Don't write tests unless asked (no testing setup is in place yet).
- Don't refactor unrelated code while fixing a bug.
- Don't create `.md` documentation files unless requested.
