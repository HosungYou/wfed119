# WFED 119 — Enneagram Assessment (LifeCraft-Aligned) Plan

Version: v1.0 (Draft)
Owner: WFED119 Team (Hosung You et al.)
Purpose: Design a progressive, AI‑assisted Enneagram assessment aligned with LifeCraft (pp. 34–36) and integrated with the WFED119 platform. No proprietary test items; original wording only.

---

## 1) Objectives

- Provide a progressive Enneagram assessment that mirrors LifeCraft’s learner-centered intent and tone (pp. 34–36) while using original, non-proprietary items.
- Combine deterministic scoring with transparent, bounded AI assistance for tie-breaking and narrative validation.
- Export a structured profile (type, wing, instinct, confidence, notes) for downstream WFED 119 tools (Mission/Vision, Goals, Action Learning).

---

## 2) Alignment with LifeCraft (pp. 34–36)

- Learner framing: reflective, strengths-affirming, non-diagnostic. 
- Short assessment embedded in a broader narrative process (self-knowledge → action). 
- Emphasis on agency, awareness of patterns, and constructive application in study/work/wellness.
- Language: clear, neutral, and supportive; avoids labeling students or pathologizing behavior.

Note: We do not reproduce any LifeCraft or third-party Enneagram items verbatim. All items below are original and map to public-domain Enneagram descriptors (core motivations, attention patterns, coping styles).

---

## 3) Assessment Structure (Progressive)

Stage 1 — Screener (36 items)
- 4 Likert items per type (9 types × 4 = 36).
- Produces initial probability ranking with top-3 candidates.

Stage 2 — Discriminators (adaptive)
- 6–8 forced-choice items for close type pairs among top-3.
- Focus on core motives, stress/security patterns, and lookalike distinctions.

Stage 3 — Wings + Instincts
- 10–12 items to estimate probable wing (e.g., 5w4 vs 5w6) and dominant instinct (sp/so/sx).

Stage 4 — Narrative Validation (AI‑assisted)
- 2 short free-text prompts; AI highlights supporting/contradicting signals for close types.

Stage 5 — Synthesis & Export
- Type profile with confidence band, wing, instinct, and LifeCraft-aligned reflection prompts.
- Export JSON payload for other WFED119 services.

---

## 4) Scoring & AI Guardrails

Deterministic core scoring
- Stage weights: Screener 1.0, Discriminators 1.6, Wings/Instincts 0.8.
- Normalize to type probabilities ∈ [0, 1].
- Threshold to trigger discriminators: any two top types within 4%.

AI augmentation (bounded)
- Narrative evidence can adjust the two closest types by a capped ±3–5% total.
- AI may generate 2–3 clarifying tie-breakers if margin remains <3% after discriminators.
- AI cannot override a ≥7% deterministic lead.
- Always surface justification snippets; users can disregard AI suggestions.

Confidence bands
- High (≥0.20 lead), Medium (0.07–0.19), Low (<0.07). Display tips to self-verify.

---

## 5) UX Flow (EN/KR-ready)

Onboarding
- What Enneagram is/isn’t; privacy; time estimate; EN/KR toggle.

Assessment Stages
- Clear progress, save/resume, keyboard-first navigation, screen-reader labels.

Results & Reflection
- Bar chart across 9 types; primary type, likely wing/instinct; confidence band; neutral copy.
- LifeCraft-style reflection prompts: “How might this pattern help you in your studies/work?”

Export
- Structured JSON for Mission/Vision and Goals tools.

---

## 6) Data Model (Session)

Input
- `responses.stage1[]`, `responses.stage2[]`, `responses.stage3[]`, `language`, `consent`, `timestamps`.

Computed
- `typeProbabilities{1..9}`, `primaryType`, `wingEstimate`, `instinctEstimate`, `tieBreakHistory`, `aiEvidenceSummary`.

State
- `stage`, `resumeToken`, `itemBankVersion`.

Privacy
- Session-only by default; opt‑in persistence for cross-module use.

---

## 7) Draft Item Bank v1.0 (English)

Notes
- Tone: neutral, reflective, non-judgmental. 
- Each item is a statement rated 1–5 (Strongly Disagree → Strongly Agree).
- Items reference core motives and attention habits rather than behaviors that depend on culture or role.

### Stage 1 — Screener (36 items; 4 per type)

Type 1 — “Improver / Reformer” (principled, improvement-oriented)
1. I feel a strong inner pull to make things the “right” way. 
2. I notice errors and want to correct them promptly. 
3. I measure myself against high internal standards. 
4. When choices are unclear, I lean on principles to guide me.

Type 2 — “Giver / Supporter” (helping, relationship-oriented)
5. I quickly sense what others might need from me. 
6. Offering support gives me a deep sense of purpose. 
7. I often prioritize others’ needs before my own. 
8. I pay close attention to appreciation in relationships.

Type 3 — “Achiever / Driver” (goal, image of success)
9. I naturally set measurable goals and track progress. 
10. I adapt my presentation to align with what success requires. 
11. Achieving visible results energizes me. 
12. I focus on efficiency to reach outcomes quickly.

Type 4 — “Individualist / Depth-Seeker” (identity, authenticity)
13. I strive to express an authentic, unique perspective. 
14. I often reflect on my deeper feelings and meanings. 
15. Feeling understood is essential for me to thrive. 
16. I sense what is missing and long to make it whole.

Type 5 — “Investigator / Observer” (knowledge, boundaries)
17. I conserve energy by limiting demands on my time and attention. 
18. I feel secure when I understand how things work. 
19. I prefer to gather information before engaging fully. 
20. Clear boundaries help me feel capable and resourced.

Type 6 — “Loyalist / Sentinel” (security, preparedness)
21. I regularly scan for risks and prepare backup plans. 
22. Trust builds slowly for me, then becomes steady. 
23. I seek guidance from reliable people or systems. 
24. I feel responsible to question uncertain assumptions.

Type 7 — “Enthusiast / Optimizer” (options, positive future)
25. I generate multiple options to keep possibilities open. 
26. Anticipating positive experiences keeps me motivated. 
27. I prefer to reframe difficulties to find what’s useful. 
28. I move on quickly when something feels limiting.

Type 8 — “Challenger / Protector” (strength, control)
29. I step up to take charge when things feel unclear. 
30. I protect the people and causes I care about. 
31. I value directness and straightforward decisions. 
32. I dislike feeling controlled by others or systems.

Type 9 — “Peacemaker / Stabilizer” (harmony, steadiness)
33. I maintain calm by reducing internal and external conflict. 
34. I easily see multiple perspectives and common ground. 
35. I go with the flow to keep things steady. 
36. I defer decisions until I feel settled and at ease.

Scoring (Stage 1)
- Sum items per type; z-score or min-max normalize across nine types; keep raw sums for audit.

### Stage 2 — Discriminator Blocks (adaptive)

Pairs and sample items (expand each pair to 6–8 forced-choice items):

1 vs 6 (principle vs security)
- When rules conflict with new risks, I first: (A) apply principles, (B) stress-test assumptions. 
- Under uncertainty, I’m more driven by: (A) “what’s right,” (B) “what could go wrong.” 
- I feel calmer when: (A) standards are upheld, (B) contingencies are in place.

3 vs 7 (results vs possibilities)
- I stay engaged by: (A) measurable progress, (B) fresh options. 
- When plans fail, I: (A) optimize execution, (B) pivot to new opportunities. 
- My attention goes to: (A) outcomes and status, (B) experiences and variety.

4 vs 9 (depth vs harmony)
- In tension, I: (A) explore inner truth, (B) diffuse and steady. 
- I pursue: (A) authentic self-expression, (B) shared ease and comfort. 
- I notice: (A) what’s missing inside, (B) how to smooth the edges.

5 vs 1 (understanding vs correctness)
- I rely on: (A) thorough comprehension, (B) principled rightness. 
- I push myself to: (A) master ideas, (B) meet high standards. 
- I withdraw to: (A) think and resource, (B) avoid mistakes.

2 vs 9 (connection vs harmony)
- I seek: (A) closeness and helpfulness, (B) peace and steadiness. 
- When others need me, I: (A) lean in to support, (B) keep balance and pace. 
- I adjust to: (A) relational needs, (B) overall calm.

8 vs 3 (control vs success image)
- I assert: (A) strength to protect/control, (B) a winning image to succeed. 
- I value: (A) direct power, (B) recognized achievement. 
- I move faster when: (A) stakes are high, (B) metrics are visible.

Scoring (Stage 2)
- Each forced-choice awards 1.0 to selected side; weight block total ×1.6; add to type tallies.

### Stage 3 — Wings & Instincts

Wing tendencies (generic, used contextually by primary type)
- “I tend toward structured clarity over relational nuance.” (leans to 1‑wing or 6‑wing depending on primary) 
- “I rely on emotional tone to guide decisions.” 
- “I learn by doing and iterating in public.” 
- “I prefer depth and reflection before action.” 
- “I track social dynamics and roles closely.” 
- “I keep resources and energy conserved.”

Instincts (dominant tendency)
- self‑preservation (sp): “I habitually manage comfort, energy, and practical security.” 
- social (so): “I naturally attune to group roles, belonging, and shared aims.” 
- sexual/one‑to‑one (sx): “I focus intensely on select people/projects that spark me.”

Example items (Likert; 10–12 total in this stage)
1. I continuously optimize my daily resources (time, money, energy). (sp)
2. I notice shifts in group mood and adjust my role. (so)
3. I pursue compelling connections/projects with strong intensity. (sx)
4. I express myself more boldly with a trusted few than with groups. (sx)
5. I feel settled when practical needs are handled first. (sp)
6. I think in terms of “we”—how we function together. (so)
7. I curate environments that feel safe and replenishing. (sp)
8. I track status, influence, or positioning in groups. (so)
9. I’m energized by deep, focused exchanges over breadth. (sx)
10. I plan around comfort, maintenance, and reliability. (sp)
11. I naturally host, convene, or coordinate people. (so)
12. I follow sparks even if it means narrowing focus. (sx)

Scoring (Stage 3)
- Wing: map wing-tendency items relevant to the primary type; select higher wing score as likely wing. 
- Instinct: sum sp/so/sx subscales; top score = dominant instinct.

### Stage 4 — Narrative Validation (AI‑assisted)

Prompt A (motivation): “Describe a recent situation that felt ‘very you.’ What were you seeking, avoiding, or protecting?”

Prompt B (stress/security): “In stress or ease, how do your priorities and behavior shift? Give a brief example.”

AI evidence extraction (bounded influence)
- Extract signals keyed to motives (e.g., correctness, security, options, identity, boundaries). 
- Up/down-adjust only the two closest types by ≤5% total; store quotes as justification.

---

## 8) Integration Contracts

Export payload (JSON)
```
{
  "primaryType": "3",
  "typeProbabilities": {"1":0.11,"2":0.08,"3":0.24,"4":0.06,"5":0.10,"6":0.13,"7":0.14,"8":0.08,"9":0.06},
  "confidence": "medium",
  "likelyWing": "3w2",
  "dominantInstinct": "so",
  "aiEvidence": [{"typePair":"3vs7","quote":"…","signal":"outcome focus"}],
  "notes": "student-visible neutral summary",
  "version": "1.0"
}
```

Consumers
- Mission & Vision Architect: import motives/values language; seed mission phrases. 
- Wellness Goal Platform: inform SWOT strengths and blind-spot cautions. 
- Action Learning Hub: surface team balance insights (optional, opt‑in only).

---

## 9) AI Prompt Pack (Operations)

Tie-breaker generator (system prompt excerpt)
- “Given close types X and Y, produce 3 forced-choice items contrasting their core motives and attention patterns. Avoid stereotypes; keep language neutral and student-friendly.”

Evidence extractor (system prompt excerpt)
- “Identify sentences indicating motives/concerns (principles, needs, outcomes, identity, understanding, security, options, power, harmony). Return top 5 signals with quoted snippets and mapped types.”

Reflection coach (system prompt excerpt)
- “Offer 2 short LifeCraft-style reflections and 1 action idea aligned to the student’s top type and wing. Maintain supportive, non-diagnostic tone.”

---

## 10) Validation & Pilot

Content & Ethics
- Instructor/SME review for accuracy, neutrality, and cultural fit (EN→KR back-translation). 
- Clear disclaimers; student control over saving/sharing results.

Pilot (20–30 students)
- Measures: internal consistency (split-half), resonance (“felt accurate?”), time-on-task, drop-offs. 
- Calibration: thresholds (4% discriminator trigger, 3–5% AI cap), item clarity.

---

## 11) Timeline (3–4 weeks)

Week 1
- Finalize Stage 1 items; design wireframes; instructor feedback.

Week 2
- Complete discriminator sets (6–8 per pair); wing/instinct items; AI prompt pack v1.

Week 3
- Copy edits; EN/KR alignment; scoring spec freeze; export contract; pilot prep.

Week 4
- Pilot run readiness; finalize documentation for implementation.

---

## 12) Risks & Mitigations

- IP risk: Original items only; no RHETI or proprietary wording. 
- Over-certainty: Confidence bands; suggest self-checks and alternative hypotheses. 
- Cultural nuance: EN/KR authoring; back-translation; student feedback loop. 
- AI bias: Deterministic core; bounded AI adjustments; transparency of signals.

---

## 13) Next Actions

- Translate and back-translate all items (KR) and review tone with instructor. 
- Expand discriminator blocks to full 6–8 items per pair. 
- Draft wireframes (onboarding, stages, results) for sign-off. 
- Prepare pilot consent script and brief survey.

