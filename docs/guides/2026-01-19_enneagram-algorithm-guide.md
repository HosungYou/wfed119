# Enneagram Assessment Algorithm & AI Integration Guide

> **Version**: 2.0 (Updated: 2026-01-19)
> **Module**: Enneagram Assessment
> **Location**: `src/lib/enneagram/`, `src/app/api/enneagram/`

---

## Table of Contents

1. [Overview](#overview)
2. [Assessment Architecture](#assessment-architecture)
3. [4-Stage Assessment Pipeline](#4-stage-assessment-pipeline)
4. [Algorithm Details](#algorithm-details)
5. [AI Integration Points](#ai-integration-points)
6. [Data Flow](#data-flow)
7. [Confidence & Validation](#confidence--validation)
8. [Type Profiles System](#type-profiles-system)
9. [Technical Implementation](#technical-implementation)

---

## Overview

The WFED119 Enneagram Assessment module determines a user's personality type using a **multi-stage adaptive algorithm** combined with **AI-powered narrative validation**. This approach balances psychometric rigor with user experience.

### Key Features

- **45-item screener** based on Riso-Hudson methodology (textbook p.66-69)
- **Adaptive discriminator questions** to differentiate between similar types
- **Instinct subtype assessment** (Self-Preservation, Social, Intimate)
- **AI-powered narrative validation** using natural language responses
- **Randomized item presentation** to reduce order bias

---

## Assessment Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ENNEAGRAM ASSESSMENT PIPELINE                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Stage 1          Stage 2           Stage 3         Stage 4           │
│  ┌─────────┐     ┌───────────┐     ┌─────────┐     ┌───────────┐       │
│  │Screener │ ──▶ │Discrimina-│ ──▶ │Instinct │ ──▶ │ Narrative │       │
│  │(45 items)│     │   tors    │     │ (12 items)│    │Validation │       │
│  └─────────┘     └───────────┘     └─────────┘     └───────────┘       │
│       │                │                │                │              │
│       ▼                ▼                ▼                ▼              │
│  [Probability     [Type           [Subtype        [AI Context     ]    │
│   Distribution]   Refinement]     Detection]       Integration   ]    │
│                                                                         │
│                         ┌─────────────┐                                │
│                         │   SCORING   │                                │
│                         │   ENGINE    │                                │
│                         └─────────────┘                                │
│                               │                                        │
│                               ▼                                        │
│                    ┌─────────────────────┐                             │
│                    │     FINAL RESULT    │                             │
│                    │  Type + Wing +      │                             │
│                    │  Instinct +         │                             │
│                    │  Confidence Level   │                             │
│                    └─────────────────────┘                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4-Stage Assessment Pipeline

### Stage 1: Screener (45 Items)

**Purpose**: Establish initial probability distribution across all 9 types.

**Algorithm**:
```typescript
// File: src/lib/enneagram/scoring.ts

function scoreStage1(responses: Stage1Response[], locale: Locale): TypeScores {
  // 1. Initialize raw scores for each type
  const raw = { '1': 0, '2': 0, ..., '9': 0 };

  // 2. Map each item to its corresponding type
  const typeMap = itemTypeMap(locale);  // s1_01 → Type 1, etc.

  // 3. Aggregate Likert scores (1-5) per type
  for (const response of responses) {
    const type = typeMap[response.itemId];
    raw[type] += response.value;
  }

  // 4. Normalize to probability distribution
  const total = sum(raw);
  const probabilities = {};
  for (const type of Object.keys(raw)) {
    probabilities[type] = raw[type] / total;
  }

  return { raw, probabilities };
}
```

**Item Distribution**:
| Type | Items | ID Range |
|------|-------|----------|
| 1 - Perfectionist | 5 | s1_01 ~ s1_05 |
| 2 - Helper | 5 | s1_06 ~ s1_10 |
| 3 - Achiever | 5 | s1_11 ~ s1_15 |
| 4 - Individualist | 5 | s1_16 ~ s1_20 |
| 5 - Investigator | 5 | s1_21 ~ s1_25 |
| 6 - Loyalist | 5 | s1_26 ~ s1_30 |
| 7 - Enthusiast | 5 | s1_31 ~ s1_35 |
| 8 - Challenger | 5 | s1_36 ~ s1_40 |
| 9 - Peacemaker | 5 | s1_41 ~ s1_45 |

**Randomization**: Items are shuffled using Fisher-Yates algorithm to prevent order bias.

---

### Stage 2: Discriminators (Adaptive)

**Purpose**: Differentiate between top 3 candidate types identified in Stage 1.

**Algorithm**:
```typescript
// File: src/lib/enneagram/discriminators.ts

function getDiscriminatorPairsForTop(topTypes: number[]): PairId[] {
  // Available comparison pairs
  const pairs = ['1vs6', '3vs7', '4vs9', '5vs1', '2vs9', '8vs3'];

  // Select pairs where BOTH types are in top 3
  const selected = pairs.filter(pair => {
    const [left, right] = pair.split('vs').map(Number);
    return topTypes.includes(left) && topTypes.includes(right);
  });

  // Fallback: ensure at least 2 pairs include top-1 type
  if (selected.length < 2) {
    // Add pairs containing the primary candidate
  }

  return selected.slice(0, 3);  // Max 3 pairs (6 questions)
}
```

**Discriminator Pairs**:
| Pair | Distinguishing Focus |
|------|---------------------|
| 1 vs 6 | Principles vs Security |
| 3 vs 7 | Achievement vs Experience |
| 4 vs 9 | Authenticity vs Harmony |
| 5 vs 1 | Knowledge vs Correctness |
| 2 vs 9 | Helping vs Peace |
| 8 vs 3 | Power vs Success |

**Forced-Choice Format**: Each question presents two options (A/B), each representing one type.

---

### Stage 3: Instinct Assessment (12 Items)

**Purpose**: Determine dominant instinctual subtype.

**Algorithm**:
```typescript
// File: src/lib/enneagram/instincts.ts

function scoreInstincts(responses): { sp, so, sx, dominant } {
  const scores = { sp: 0, so: 0, sx: 0 };

  for (const response of responses) {
    const instinct = itemToInstinct[response.itemId];
    scores[instinct] += response.value;  // Likert 1-5
  }

  const dominant = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])[0][0];

  return { ...scores, dominant };
}
```

**Instinct Types**:
| Code | Name | Korean | Focus |
|------|------|--------|-------|
| SP | Self Preservation | 자기보존 | Safety, resources, comfort |
| SO | Social | 사회적 | Groups, status, belonging |
| SX | Intimate | 친밀 | Deep connections, intensity |

**Item Distribution**: 4 items per instinct (12 total)

---

### Stage 4: Narrative Validation

**Purpose**: Collect free-text responses for AI-powered type verification.

**Prompts**:
1. "Describe a recent situation that felt 'very you.' What were you seeking, avoiding, or protecting?"
2. "Under pressure or relaxed, how do your priorities and behavior shift? Give a brief example."

**Data Storage**:
```typescript
// Stored in responses.narrative
{
  narrative: [
    "최근 프로젝트에서 팀원의 실수를 발견했을 때...",  // Response 1
    "스트레스 상황에서는 더 완벽해지려 하고..."        // Response 2
  ]
}
```

---

## Algorithm Details

### Probability Normalization

The screener uses **relative probability** rather than absolute scoring:

```
P(Type i) = RawScore(i) / Σ(RawScores)
```

This ensures all probabilities sum to 1.0, allowing meaningful comparison.

### Wing Determination

Wings are limited to adjacent types on the Enneagram circle:

```typescript
// File: src/app/api/enneagram/score/route.ts

const wingCandidates = {
  '1': ['9', '2'],  // Type 1 can have 9-wing or 2-wing
  '2': ['1', '3'],
  '3': ['2', '4'],
  '4': ['3', '5'],
  '5': ['4', '6'],
  '6': ['5', '7'],
  '7': ['6', '8'],
  '8': ['7', '9'],
  '9': ['8', '1'],
};

// Wing = adjacent type with highest probability
const wing = wingCandidates[primaryType]
  .sort((a, b) => probabilities[b] - probabilities[a])[0];
```

### Confidence Bands

Result confidence is determined by the gap between top-2 types:

```typescript
function confidenceBand(probabilities): 'high' | 'medium' | 'low' {
  const sorted = Object.values(probabilities).sort((a, b) => b - a);
  const lead = sorted[0] - sorted[1];  // Gap between #1 and #2

  if (lead >= 0.20) return 'high';     // Clear dominant type
  if (lead >= 0.07) return 'medium';   // Moderate distinction
  return 'low';                         // Close competition
}
```

| Confidence | Lead Gap | Interpretation |
|------------|----------|----------------|
| High | ≥ 20% | Clear type identification |
| Medium | 7-19% | Likely type, consider alternatives |
| Low | < 7% | Multiple types possible |

---

## AI Integration Points

### 1. Narrative Analysis (Future Enhancement)

The narrative responses collected in Stage 4 can be processed by AI to:

- **Validate** the algorithmically determined type
- **Identify** type-specific patterns in language
- **Detect** integration/disintegration behaviors
- **Assess** instinctual focus from descriptions

**Potential Implementation**:
```typescript
// Pseudo-code for AI integration
async function analyzeNarrative(narratives: string[], candidateType: number) {
  const prompt = `
    Based on these self-descriptions:
    1. "${narratives[0]}"
    2. "${narratives[1]}"

    And the candidate Enneagram type ${candidateType}:
    - Does the language pattern match Type ${candidateType} characteristics?
    - What instinctual variant (SP/SO/SX) is most evident?
    - What integration/disintegration patterns appear?
  `;

  return await claude.analyze(prompt);
}
```

### 2. Type Profile Generation

AI can generate personalized insights by combining:
- Determined type (1-9)
- Wing influence
- Instinctual subtype
- User's narrative context

### 3. Cross-Module Integration

Enneagram results feed into other LifeCraft modules:

```
Enneagram Data → Life Themes → Vision → Career Options → SWOT
     ↓
[Type + Wing + Instinct]
     ↓
AI generates personalized career suggestions based on type patterns
```

---

## Data Flow

### Request/Response Cycle

```
┌──────────┐    POST /api/enneagram/answer     ┌──────────────┐
│  Client  │ ─────────────────────────────────▶│  API Route   │
│  (React) │                                   │  (Next.js)   │
└──────────┘                                   └──────────────┘
     │                                               │
     │ Stage: 'screener'                             │
     │ Input: { items: [{itemId, value}...] }        │
     │                                               ▼
     │                                    ┌─────────────────────┐
     │                                    │   Supabase Admin    │
     │                                    │   (enneagram_       │
     │                                    │    sessions table)  │
     │                                    └─────────────────────┘
     │                                               │
     │ ◀─────────────────────────────────────────────┘
     │ Response: { nextStage: 'discriminators' }
     │
     │    POST /api/enneagram/score
     ▼
┌──────────┐                               ┌──────────────┐
│  Final   │ ◀─────────────────────────────│   Scoring    │
│  Result  │                               │   Engine     │
└──────────┘                               └──────────────┘
```

### Database Schema

```sql
-- Table: enneagram_sessions
CREATE TABLE enneagram_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  locale VARCHAR(2) DEFAULT 'en',
  stage VARCHAR(20) DEFAULT 'screener',
  responses JSONB DEFAULT '{}',
  scores JSONB,
  primary_type INTEGER,
  wing_estimate VARCHAR(10),
  instinct VARCHAR(2),
  confidence VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Responses JSONB Structure

```json
{
  "screener": [
    { "itemId": "s1_01", "value": 4 },
    { "itemId": "s1_02", "value": 3 },
    // ... 45 items
  ],
  "discriminators": [
    { "itemId": "d_1vs6_01", "choice": "A" },
    { "itemId": "d_1vs6_02", "choice": "B" },
    // ... 6 items
  ],
  "wings": [
    { "itemId": "i_01", "value": 5 },
    { "itemId": "i_02", "value": 3 },
    // ... 12 items
  ],
  "narrative": [
    "My recent 'very me' moment was when...",
    "Under pressure, I tend to..."
  ]
}
```

---

## Confidence & Validation

### Multi-Layer Validation

1. **Statistical Confidence**: Gap between top types
2. **Discriminator Consistency**: Stage 2 results align with Stage 1
3. **Narrative Coherence**: Free-text matches type patterns (AI-assisted)
4. **Cross-Module Correlation**: Type aligns with values and themes

### Low Confidence Handling

When confidence is 'low':
- Display top 3 candidate types with probabilities
- Encourage exploration of each type's profile
- Offer AI-powered "type exploration" conversation

---

## Type Profiles System

### Profile Data Structure

```typescript
// File: src/lib/enneagram/typeProfiles.ts

interface EnneagramTypeProfile {
  type: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  name: { en: string; ko: string };

  // Center of Intelligence
  center: { en: 'Head' | 'Heart' | 'Body'; ko: '머리' | '가슴' | '장' };
  centerDescription: { en: string; ko: string };

  // Integration/Disintegration
  integrationDirection: number;
  disintegrationDirection: number;
  integrationDescription: { en: string; ko: string };
  disintegrationDescription: { en: string; ko: string };

  // Psychological Patterns
  selfImage: { en: string; ko: string };
  fixation: { en: string; ko: string };
  passion: { en: string; ko: string };
  basicFear: { en: string; ko: string };
  basicDesire: { en: string; ko: string };

  // Practical Applications
  strengths: { en: string[]; ko: string[] };
  weaknesses: { en: string[]; ko: string[] };
  suitableWork: { en: string[]; ko: string[] };
  workEnvironment: { en: string; ko: string };
}
```

### Centers of Intelligence

```
        ┌───────────────────────────────────────┐
        │           ENNEAGRAM CENTERS           │
        └───────────────────────────────────────┘

               9
            ╱     ╲
          1         8       ← BODY CENTER (장)
         │           │        Types 8, 9, 1
         │           │        Focus: Autonomy, Control
        2             7
         ╲           ╱      ← HEAD CENTER (머리)
          3         6         Types 5, 6, 7
            ╲     ╱           Focus: Security, Guidance
               4
             │ │
             5─┘            ← HEART CENTER (가슴)
                              Types 2, 3, 4
                              Focus: Identity, Image
```

---

## Technical Implementation

### File Structure

```
src/lib/enneagram/
├── itemBank.ts         # 45 screener items (EN/KR)
├── discriminators.ts   # Adaptive comparison questions
├── instincts.ts        # Subtype items + display names
├── scoring.ts          # Core scoring algorithms
└── typeProfiles.ts     # Extended type descriptions

src/app/api/enneagram/
├── items/route.ts      # GET: Fetch stage items (with shuffle)
├── answer/route.ts     # POST: Submit stage responses
├── score/route.ts      # POST: Calculate final results
└── export/route.ts     # GET: Export assessment data
```

### Key Functions

| Function | File | Purpose |
|----------|------|---------|
| `scoreStage1()` | scoring.ts | Calculate type probabilities |
| `confidenceBand()` | scoring.ts | Determine result confidence |
| `primaryType()` | scoring.ts | Extract dominant type |
| `getDiscriminatorPairsForTop()` | discriminators.ts | Select adaptive questions |
| `scoreInstincts()` | instincts.ts | Calculate subtype scores |
| `shuffleArray()` | items/route.ts | Randomize item order |
| `getTypeProfile()` | typeProfiles.ts | Retrieve type details |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/enneagram/items` | GET | Fetch items for current stage |
| `/api/enneagram/answer` | POST | Submit stage responses |
| `/api/enneagram/score` | POST | Calculate and save final score |
| `/api/enneagram/export` | GET | Export full assessment data |

---

## Appendix: Algorithm Pseudocode

### Complete Assessment Flow

```
PROCEDURE EnneagramAssessment(user):
    session = createSession(user)

    // Stage 1: Screener
    screenerItems = shuffle(getScreenerItems())
    screenerResponses = collectResponses(screenerItems, likert=1-5)
    probabilities = scoreStage1(screenerResponses)
    topTypes = getTop3(probabilities)

    // Stage 2: Discriminators
    pairs = getDiscriminatorPairsForTop(topTypes)
    discriminatorItems = getDiscriminatorItems(pairs)
    discriminatorResponses = collectResponses(discriminatorItems, forced-choice)
    probabilities = adjustProbabilities(probabilities, discriminatorResponses)

    // Stage 3: Instincts
    instinctItems = getInstinctItems()
    instinctResponses = collectResponses(instinctItems, likert=1-5)
    instinct = scoreInstincts(instinctResponses).dominant

    // Stage 4: Narrative
    narrativePrompts = getNarrativePrompts()
    narrativeTexts = collectFreeText(narrativePrompts)

    // Final Scoring
    primaryType = getPrimaryType(probabilities)
    wing = determineWing(primaryType, probabilities)
    confidence = calculateConfidence(probabilities)

    // Store Result
    saveResult(session, {
        primaryType,
        wing,
        instinct,
        confidence,
        probabilities,
        narrativeTexts
    })

    RETURN {
        type: primaryType,
        wing: primaryType + 'w' + wing,
        instinct: instinct,
        confidence: confidence
    }
END PROCEDURE
```

---

## References

- Riso, D.R., & Hudson, R. (1999). *The Wisdom of the Enneagram*
- WFED119 Course Textbook, p.66-75
- Enneagram Institute Type Descriptions

---

*Document maintained by WFED119 Development Team*
