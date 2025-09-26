# Module Data Architecture

This document describes how LifeCraft currently captures and stores the outputs of the two live discovery modules (Strengths Discovery and Values Discovery). The goal is to ensure that each module’s distinctive insights persist in Prisma so they can inform downstream analysis and cross-module synthesis.

---

## 1. High-Level Flow

1. **Frontend interaction** – The user completes a module in the browser. The UI bundles both raw placements (e.g., drag-and-drop buckets, AI-generated strength lists) and derived insights (pattern summaries, recommendations).
2. **API layer** – Module-specific API routes normalise payloads, attach the authenticated Google user (if present), and persist results through Prisma.
3. **Database** – Prisma pushes to Postgres using the `schema.postgres.prisma` schema. Each module writes to a dedicated result table plus supporting tables (e.g., conversations) so later services can query structured outputs.

---

## 2. Values Discovery Module (`/discover/values/[set]`)

### API Entry Point
- `POST /api/discover/values/results`
- `GET  /api/discover/values/results?user_id=…&set=…`
- `GET  /api/discover/values/results/all`

### Prisma Tables
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `ValueResult` | One record per user per value set (`terminal`, `instrumental`, `work`). Stores the raw layout and curated insights. | `userId`, `valueSet`, `layout (JSON)`, `top3 (JSON)`, `insights (JSON)`, `moduleVersion` |

### Stored Payload (JSON excerpt)
```json
{
  "layout": {
    "very_important": ["tv1", "tv9"],
    "important": ["tv6"],
    "somewhat_important": [],
    "not_important": ["tv14"]
  },
  "top3": ["Family Security", "Sense of Accomplishment", "Inner Peace"],
  "insights": {
    "bucketStats": {
      "veryImportant": 2,
      "important": 1,
      "somewhatImportant": 0,
      "notImportant": 1
    },
    "patternSummary": {
      "securityCount": 1,
      "socialCount": 0,
      "growthCount": 1,
      "achievementCount": 1,
      "veryImportantValues": [
        { "id": "tv1", "name": "Family Security", "description": "…" },
        { "id": "tv9", "name": "Sense of Accomplishment", "description": "…" }
      ]
    },
    "personality": {
      "mbtiType": "ESFJ",
      "enneagramType": "Type 6 (Loyalist)",
      "coreTheme": "Responsible Guardian"
    },
    "career": {
      "careers": ["Government Administrator", "Healthcare Manager"],
      "workEnvironment": "Stable organization with clear mission and social impact",
      "leadershipStyle": "Supportive and protective"
    },
    "themeInsights": {
      "profileInsight": "Impactful Achiever",
      "balanceInsight": "You prioritize meaningful pursuits over comfort."
    },
    "generatedAt": "2025-09-26T07:30:00.000Z"
  },
  "moduleVersion": "v2025-09-26"
}
```

### Notes
- `layout` preserves the drag-and-drop placement for rehydration back into the UI.
- `insights` holds module-specific interpretation (pattern counts, personality/career pointers, theme summaries). All entries are JSON-serialisable to support future analytics.
- `moduleVersion` lets us evolve scoring rules without corrupting prior saved records.

---

## 3. Strengths Discovery Module (`/discover/strengths`)

### API Entry Point
- `POST /api/session/save`
  - Triggered automatically during the conversation and by the explicit Save button.

### Prisma Tables
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `UserSession` | Primary record for authenticated users. Keeps stage tracking and metadata. | `userId`, `sessionId`, `sessionType`, `currentStage`, `metadata (JSON)` |
| `Session` | Legacy fallback for unauthenticated sessions. | `sessionId`, `userGoogleId`, `userEmail`, `userName` |
| `Conversation` | Full transcript of the user ↔ AI exchange. | `sessionId`, `role`, `content`, `metadata (JSON)` |
| `Strength` | Individual strength statements categorised as skill/attitude/value. | `sessionId`, `category`, `name`, `confidence`, `userGoogleId`, `userEmail` |
| **`StrengthProfile`** | Aggregated snapshot derived from the conversation that other modules can consume. | `sessionKey`, `userId`, `userEmail`, `strengths (JSON)`, `summary`, `insights (JSON)` |

### Stored Payloads
**`StrengthProfile.strengths`**
```json
{
  "skills": ["Strategic Vision", "Facilitation"],
  "attitudes": ["Empathy", "Resilience"],
  "values": ["Service", "Growth"]
}
```

**`StrengthProfile.insights`**
```json
{
  "topPicks": {
    "skill": "Strategic Vision",
    "attitude": "Empathy",
    "value": "Service"
  },
  "counts": {
    "skills": 2,
    "attitudes": 2,
    "values": 2
  },
  "stage": "analysis",
  "completed": false,
  "updatedAt": "2025-09-26T07:32:10.000Z"
}
```

**`UserSession.metadata`**
```json
{
  "module": "strengths",
  "lastUpdated": "2025-09-26T07:32:10.000Z"
}
```

### Notes
- If a user is authenticated, `UserSession` is used and linked to the `User` table. Otherwise the fallback `Session` record captures name/email if available.
- Each strength (skills/attitudes/values) is stored individually in `Strength` so we can query frequency or build recommendation models later.
- `StrengthProfile` provides a one-row-per-session summary that downstream services (e.g., comprehensive report generation or matching algorithms) can consume without replaying the full conversation.

---

## 4. Cross-Module Considerations

- Both modules now persist *insights* JSON blobs (`ValueResult.insights`, `StrengthProfile.insights`). These are intentionally structured to expose:
  - theme counts and top picks for values
  - top strengths and category counts for strengths
  - timestamps and module versions for data lineage
- The `User` table links to `valueResults` and `strengthProfiles`, enabling joins for future combined dashboards or the `AnalysisResult` table.
- Future modules should follow the same pattern: raw artefacts, structured insights, and a version tag.

---

## 5. Checklist for New Modules

1. **Frontend** – Capture raw selections plus computed insights; ensure everything is JSON-serialisable.
2. **API** – Resolve the authenticated user, normalise payloads, and upsert into a module-specific Prisma model. Include a `moduleVersion` string.
3. **Database** – Add dedicated tables/fields in `schema.postgres.prisma` and mirror the same structure in `schema.prisma` for local work.
4. **Docs** – Append the new module’s data contract to this file so collaborators understand how to query and reuse the results.

---

_Last updated: 2025-09-26_
