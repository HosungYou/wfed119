# LifeCraft APP — Implementation Plan (WFED 119)

Version: v1.0 (initial)  
Scope: Turn the schema vision into a working, pilot‑ready web app using the existing `lifecraft-bot` foundation and staged modules.

---

## 1) Product Framing

Goals
- Deliver a web-first, mobile-friendly PWA that unifies: Strength Stories → Enneagram Profiler → Values/Mission/Vision → Career Canvas → SWOT/SMART → Action Learning → Portfolio export.
- Honor LifeCraft tone (non-diagnostic, agency-affirming), with AI as clarifier not decider.
- Produce portable artifacts (Markdown/PDF) and a minimal, consent-driven data layer.

Pilot Target
- 20–30 WFED 119 students (EN/KR), 3–4 weeks per Enneagram plan.

Key Outputs
- Unified Results page (Strengths + Enneagram) with export contracts for Values/Mission and Goals modules.
- Consent-first storage; session-only default; opt‑in reuse across modules.

---

## 2) Technical Architecture

web app
- Framework: Next.js 14 (App Router, TypeScript), Tailwind + shadcn/ui, Zustand.
- i18n: `next-intl` (EN/KR), translation JSONs per module.
- Accessibility: WCAG AA, keyboard-first flows, ARIA labels, reduced motion.

backend
- API: Next.js Route Handlers with Zod validation.
- AI: Anthropic Claude 3 Haiku primary + OpenAI fallback (already present).
- RAG (Phase 2+): Document ingestion + semantic retrieval (align to `RAG-01` ticket).

data
- ORM: Prisma. Dev: SQLite. Staging/Prod: Postgres (align to `DB-01-Local-Postgres-Docker.md`).
- Caching: In-memory first; add Redis in Phase 3 if needed (rate limits, sessions).

deployment
- Dev: Local + Docker (Postgres).  
- Staging/Prod: Vercel/Render app with managed Postgres (Neon/Supabase/Render PG).  
- PDFs: Client-side render via `@react-pdf/renderer` (avoid server headless). Markdown export always available.

---

## 3) Module Map (Phase 1–4)

Phase 1 (Now)
- Strength Stories: keep current flow; refine data model and exports.
- Enneagram Profiler: implement staged assessment per `Enneagram/Enneagram_Test_Plan.md`.
- Unified Results: merge Strength + Enneagram; define/export payloads to Values/Mission & Goals.

Phase 2
- Values/Mission/Vision builders with personalization hooks.
- Career Canvas (alpha): interests/skills-to-role mapping, feasibility prompts.

Phase 3
- SWOT + SMART Goals: builder, progress dashboard, weekly nudges.

Phase 4
- Action Learning Hub: team templates, evidence capture; Portfolio compiler; instructor dashboard (ethical analytics).

---

## 4) Information Architecture (App Router)

Routes
- `/` Onboarding + consent + EN/KR toggle
- `/discover/strengths` Strength Stories chat + progress
- `/discover/enneagram` Progressive assessment (stages 1–4)
- `/results` Unified results (strengths + type distribution + confidence + next actions)
- `/define/values` Card sort (Phase 2)
- `/define/mission` Mission builder (Phase 2)
- `/define/vision` Vision storyboard (Phase 2)
- `/decide/canvas` Career Canvas (Phase 2)
- `/do/goals` SMART + SWOT (Phase 3)
- `/deliver/action` Action Learning Hub (Phase 4)
- `/portfolio` Export center (PDF/Markdown)

API
- `POST /api/session/start|save|delete` — consent-aware sessions
- `POST /api/chat` — existing; keep stage machine; add metadata hooks
- `POST /api/enneagram/answer|score|export` — staged scoring + bounded AI adjust
- `GET  /api/results/:sessionId` — unified payload
- `POST /api/export/:type` — markdown/pdf

---

## 5) Data Model (Prisma additions)

Note: Keep SQLite for dev; switch to Postgres in Staging/Prod. Add tables to complement existing `Session`, `Conversation`, `Strength`.

```prisma
model Consent {
  id         String   @id @default(uuid())
  sessionId  String   @unique
  persist    Boolean  @default(false)
  locale     String   @default("en") // "en" | "kr"
  createdAt  DateTime @default(now())
}

model EnneagramSession {
  id            String   @id @default(uuid())
  sessionId     String   @unique
  stage         String   // screener|discriminators|wings|narrative|complete
  responses     Json     // {stage1:[], stage2:[], stage3:[], texts:[]}
  typeScores    Json     // {"1":0.11, ..., "9":0.06}
  primaryType   String?
  wingEstimate  String?
  instinct      String?
  confidence    String?  // high|medium|low
  aiEvidence    Json?    // [{typePair, quote, signal}]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model ExportArtifact {
  id         String   @id @default(uuid())
  sessionId  String
  kind       String   // "values-contract" | "mission-contract" | "goals-contract" | "portfolio"
  content    Json     // export payload
  format     String   // json|md|pdf
  createdAt  DateTime @default(now())
}
```

Analytics (ethical, opt‑in)
- Minimal event log (later): `Event { id, sessionId, name, props, ts }` with no PII.

---

## 6) Enneagram Profiler — Implementation Spec (Phase 1)

Stages
1. Screener (36 Likert items) → initial probabilities → top‑3.
2. Discriminators (adaptive 6–8 forced choices for close pairs).
3. Wings & Instincts (10–12 Likert; subscale sums).
4. Narrative validation (2 short prompts; bounded AI adjust ±5% total; no override ≥7% lead).

Scoring
- Deterministic core per `Enneagram_Test_Plan.md` (Stage weights: 1.0, 1.6, 0.8). Normalize to [0,1].
- Trigger discriminators when top-2 diff < 0.04.
- Bounded AI adjust only closest two types; cap at ±0.05 total; store quotes in `aiEvidence`.

API Contracts
- `POST /api/enneagram/answer` { sessionId, stage, input } → { nextStage, progress }
- `POST /api/enneagram/score` { sessionId } → { typeProbabilities, primaryType, confidence }
- `POST /api/enneagram/export` { sessionId } → JSON payload below

Export Payload (v1)
```json
{
  "primaryType": "3",
  "typeProbabilities": {"1":0.11,"2":0.08,"3":0.24,"4":0.06,"5":0.10,"6":0.13,"7":0.14,"8":0.08,"9":0.06},
  "confidence": "medium",
  "likelyWing": "3w2",
  "dominantInstinct": "so",
  "aiEvidence": [{"typePair":"3vs7","quote":"…","signal":"outcome focus"}],
  "notes": "neutral summary",
  "version": "1.0"
}
```

UI
- Wizard with clear stage labels, progress bar, save/resume. Keyboard-first controls.
- EN/KR copy from item bank files: `/app/(modules)/enneagram/items.en.json|items.kr.json`.

---

## 7) Strength Stories — Refinements (Phase 1)

Chat Flow
- Keep 5-stage progression. Improve invalid-response handling already in `aiServiceClaude`.

Results Extraction
- Use existing `analyzeStrengths` with JSON return enforced; map to 5–8 per category.
- Save to `Strength` with explicit categories: `skill|attitude|value`.

Export Payload (v1)
```json
{
  "skills": ["Problem-solving","Facilitation"],
  "attitudes": ["Curiosity","Persistence"],
  "values": ["Inclusivity","Excellence"],
  "evidenceQuotes": ["…"],
  "version": "1.0"
}
```

---

## 8) Unified Results Page (Phase 1)

Purpose
- Show both Strengths and Enneagram with confidence bands and transparent evidence.
- Offer one-click export to Values/Mission and Goals modules.

Sections
- Summary header: “What we heard” (student voice), “What to try next”.
- Strengths: 3-column cards + visualization (existing radar/mindmap).
- Enneagram: bar chart (9 types), primary type, wing/instinct, confidence band, evidence chips.
- Export: two buttons → create `ExportArtifact` for `values-contract` and `goals-contract`.

Acceptance Criteria
- Loads from `/api/results/:sessionId` within 3s.
- Displays confidence text with “what would change your type” tips.
- Exports JSON files and Markdown summaries; client-side PDF optional.

---

## 9) Personalization Engine (Phase 2)

Inputs
- Strengths + Enneagram exports; prior module choices (if persisted with consent).

Outputs
- Values card ordering, reflection prompts, mission examples, goal templates with neutral framing.

Guardrails
- Display “why this is suggested” with one-tap feedback: more/less like this.
- Log feedback minimally (event name + anonymous fingerprint).

---

## 10) Privacy & Consent

Principles
- Session-first; explicit opt‑in for persistence. No PII unless provided voluntarily.
- Export/delete controls; transparent storage duration.

Implementation
- Consent gate on onboarding writes to `Consent` table.
- All API reads/writes check `Consent.persist` before storing beyond session.
- Data export UI shows exactly what leaves the session.

---

## 11) i18n & Accessibility

i18n
- `next-intl` provider at root. Translation catalogs per module: `en.json`, `kr.json`.
- Back-translation check for assessment copy. Tone parity with LifeCraft.

Accessibility
- Semantic headings, ARIA labels, focus states, skip links.
- Time estimates per task; reduced motion preference honored.

---

## 12) Instrumentation & Success Metrics

Metrics
- Learning: resonance/clarity self-report, rubric-aligned mission quality (later), goal feasibility.
- Adoption: stage completion rates, time-on-task, export downloads.
- Equity: completion parity by locale; a11y feedback count.
- Reliability: <3s AI interactions; error banners minimized.

Implementation (pilot)
- Lightweight event logger (server) with no PII.
- Anonymous run-id per session for funnel analysis.

---

## 13) Testing & QA

Scopes
- Unit: scoring functions, bounded adjustment, export mappers.
- Integration: API route Zod validation, DB writes under consent flags.
- E2E: happy-path flows (Playwright) for EN/KR.

Fixtures
- Seed Enneagram responses with known probabilities for repeatable tests.

---

## 14) Delivery Plan (Phase 1 — 3 weeks)

Week 1
- Enneagram Stage 1 screener UI + scoring (EN/KR).
- DB: add `Consent`, `EnneagramSession`, `ExportArtifact` models; migrations.
- Results page scaffold; export contract drafts.

Week 2
- Stage 2 discriminators (adaptive) + Stage 3 wings/instincts.
- Bounded AI narrative validation + evidence capture.
- Unified Results complete; export to `values-contract`, `goals-contract` JSON.

Week 3
- Copy QA EN/KR; a11y pass; error handling; Markdown/PDF export.
- Pilot instrumentation; consent UX; performance tune (<3s average AI latency target).

Exit Criteria
- 90%+ success on E2E happy path (EN/KR).  
- 100% deterministic scoring parity across runs.  
- Bounded AI never exceeds ±5% nor overrides ≥7% lead.  
- Exports validate against Zod schemas.

---

## 15) File/Code Changes (Phase 1 punch list)

Backend
- `prisma/schema.prisma`: add 3 models above; switch provider to `postgresql` in staging/prod.
- `/src/app/api/enneagram/*`: `answer`, `score`, `export` route handlers with Zod.
- `/src/app/api/results/[sessionId]/route.ts`: aggregates strengths + enneagram.
- `/src/lib/enneagram/*`: scoring functions, item banks (EN/KR), bounded adjust utility.
- `/src/lib/export/*`: values/goals mappers → Markdown/JSON.

Frontend
- `/src/app/(modules)/enneagram/*`: wizard pages and components.
- `/src/app/results/page.tsx`: unified results (charts + chips + exports).
- `/src/app/(modules)/onboarding/page.tsx`: consent + EN/KR toggle; privacy copy.
- `/src/i18n/*`: translation catalogs + provider.

Testing
- `/tests/enneagram.spec.ts`: scoring and boundaries.  
- `/tests/results.e2e.ts`: EN/KR flows.

---

## 16) Guardrails for AI

- Never diagnose; always frame as patterns/signals; student edits/approves.
- Show confidence bands and “what would change your type”.
- Log AI adjustments with quotes; cap ±5% total; no override ≥7% lead.

---

## 17) Pilot Protocol (20–30 students)

Setup
- Consent text (course-approved); anonymized analytics; EN/KR toggle at start.

Measures
- Resonance: “felt accurate?” (Likert), time-on-task, drop-off stage.
- Content clarity: item comprehension (open text), copy fixes list.

Runbook
- TA dry run (5 students) → copy fixes → class pilot (2 weeks) → debrief.

---

## 18) Risks & Mitigations

- IP: Use original items only (already drafted). SME review before release.
- Latency: Prefer Claude Haiku; stream responses; cache prompts; prefetch next items.
- Privacy: Session-first default; explicit persistence; export/delete controls.
- Scope creep: Phase gates; strict acceptance criteria per phase.

---

## 19) References

- `Research/WFED119/Enneagram/Enneagram_Test_Plan.md` (content & scoring)
- `Research/WFED119/WFED119_Integrated_Services_Workflow.md` (integration)
- `Research/WFED119/lifecraft-bot/docs/lifecraft_bot_architecture.md` (current bot)
- Starter tickets: `Collaboration/starter-tickets/issues/RAG-01-Ingestion-v0.md`, `.../DB-01-Local-Postgres-Docker.md`

---

## 20) Immediate Next Steps (PR-ready)

1. Approve this plan scope and Phase 1 acceptance criteria.  
2. Freeze Enneagram item copy EN/KR; add JSON item banks.  
3. Implement DB models + API scaffolds; wire the screener stage.  
4. Ship unified Results with exports; prep pilot instrumentation.  
5. Schedule SME review for bounded AI adjustments and copy tone.

