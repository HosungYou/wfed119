# Enneagram Development Guide

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ (or Docker)
- pnpm or npm
- Basic understanding of Enneagram theory

### Initial Setup

1. **Navigate to the project:**
```bash
cd "/Volumes/External SSD/Projects/Research/WFED119/lifecraft-bot"
```

2. **Install dependencies:**
```bash
pnpm install
```

3. **Configure environment:**
```bash
# Copy environment template
cp .env.example .env.local

# Add required variables:
DB_ENABLED=true
DATABASE_URL="postgresql://user:password@localhost:5432/lifecraft"
```

4. **Set up database:**
```bash
# Run migrations
pnpm prisma migrate dev

# Seed Enneagram data
pnpm run seed:enneagram
```

5. **Start development:**
```bash
pnpm dev
# Visit http://localhost:3000/discover/enneagram
```

## Module Structure

### Core Files Overview
```
src/
├── app/api/enneagram/      # API endpoints
├── lib/enneagram/          # Core logic
│   ├── scoring.ts          # Scoring algorithms
│   ├── discriminators.ts   # Type refinement
│   ├── itemBank.ts         # Questions database
│   └── instincts.ts        # Instinctual variants
└── app/discover/enneagram/ # UI components
```

## Development Workflows

### Working on Assessment Logic

#### 1. Modifying Scoring Algorithm

Edit `/src/lib/enneagram/scoring.ts`:

```typescript
// Example: Adjusting type scoring weights
export function calculateTypeScores(responses: Response[]): TypeScores {
  const scores = initializeScores();
  
  responses.forEach(response => {
    // Custom scoring logic
    const weight = getQuestionWeight(response.questionId);
    const types = getRelatedTypes(response.questionId);
    
    types.forEach(type => {
      scores[type] += response.value * weight;
    });
  });
  
  return normalizeScores(scores);
}

// Add normalization
function normalizeScores(scores: TypeScores): TypeScores {
  const max = Math.max(...Object.values(scores));
  
  Object.keys(scores).forEach(key => {
    scores[key] = (scores[key] / max) * 100;
  });
  
  return scores;
}
```

#### 2. Adding New Questions

Edit `/src/lib/enneagram/itemBank.ts`:

```typescript
// Add new questions to the item bank
const newQuestions: EnneagramQuestion[] = [
  {
    id: "EN_NEW_001",
    text: "I prefer to work independently rather than in teams",
    type: "likert",
    relatedTypes: [5, 4, 9],
    weight: 1.2,
    category: "core",
    scoringKey: {
      "1": { "5": 0, "4": 1, "9": 2 },
      "2": { "5": 1, "4": 2, "9": 3 },
      "3": { "5": 3, "4": 3, "9": 3 },
      "4": { "5": 4, "4": 4, "9": 2 },
      "5": { "5": 5, "4": 5, "9": 1 }
    }
  }
];

// Add to appropriate stage
export function getScreenerItems(locale: string = 'en') {
  return [...existingItems, ...newQuestions];
}
```

#### 3. Implementing Discriminators

Edit `/src/lib/enneagram/discriminators.ts`:

```typescript
// Add discriminator for types 4 and 5
export const discriminator_4_5: Discriminator = {
  types: [4, 5],
  questions: [
    {
      id: "DISC_4_5_1",
      text: "I am more driven by emotions than logic",
      scoring: {
        "1": { "4": 0, "5": 5 },  // Strongly disagree favors 5
        "2": { "4": 1, "5": 4 },
        "3": { "4": 3, "5": 3 },
        "4": { "4": 4, "5": 1 },
        "5": { "4": 5, "5": 0 }   // Strongly agree favors 4
      }
    }
  ],
  threshold: 0.65 // Confidence threshold
};

// Register discriminator
export function getDiscriminator(type1: number, type2: number) {
  const key = [type1, type2].sort().join('_');
  return discriminatorMap[key];
}
```

### Working on API Endpoints

#### 1. Modifying Answer Processing

Edit `/src/app/api/enneagram/answer/route.ts`:

```typescript
export async function POST(req: NextRequest) {
  const { sessionId, stage, input } = await req.json();
  
  // Validate input
  if (!validateInput(input)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  
  // Process based on stage
  switch (stage) {
    case 'screener':
      return handleScreenerResponse(sessionId, input);
    case 'discriminators':
      return handleDiscriminatorResponse(sessionId, input);
    case 'wings':
      return handleWingResponse(sessionId, input);
    default:
      return NextResponse.json({ error: 'Unknown stage' }, { status: 400 });
  }
}

async function handleScreenerResponse(sessionId: string, input: any) {
  // Store responses
  await storeResponses(sessionId, 'screener', input.responses);
  
  // Calculate preliminary scores
  const scores = calculateTypeScores(input.responses);
  
  // Determine if discriminators needed
  const closeTypes = findCloseTypes(scores);
  
  if (closeTypes.length > 0) {
    return NextResponse.json({
      nextStage: 'discriminators',
      requiredTypes: closeTypes,
      message: 'Let\'s clarify between some close types'
    });
  }
  
  return NextResponse.json({
    nextStage: 'wings',
    primaryType: getPrimaryType(scores)
  });
}
```

#### 2. Adding New Endpoint

Create `/src/app/api/enneagram/insights/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getTypeInsights } from '@/lib/enneagram/insights';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = parseInt(searchParams.get('type') || '0');
  
  if (type < 1 || type > 9) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }
  
  const insights = await getTypeInsights(type);
  
  return NextResponse.json({
    type,
    insights,
    generated: new Date().toISOString()
  });
}
```

### Working on Database

#### 1. Adding Prisma Schema

Edit `/prisma/schema.prisma`:

```prisma
model EnneagramSession {
  id          String   @id @default(cuid())
  sessionId   String   @unique
  userId      String?
  stage       String
  responses   Json
  typeScores  Json
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  completedAt DateTime?
  
  @@index([userId])
  @@index([sessionId])
}

model EnneagramProfile {
  id               String   @id @default(cuid())
  userId           String
  primaryType      Int
  wing             Int?
  confidence       Float
  instinctualStack Json
  tritype          String?
  assessmentId     String
  createdAt        DateTime @default(now())
  
  @@index([userId])
}
```

#### 2. Run Migration

```bash
# Create migration
pnpm prisma migrate dev --name add_enneagram_tables

# Generate client
pnpm prisma generate
```

### Testing

#### 1. Unit Tests

Create `__tests__/enneagram/scoring.test.ts`:

```typescript
import { calculateTypeScores, normalizeScores } from '@/lib/enneagram/scoring';

describe('Enneagram Scoring', () => {
  test('calculates type scores correctly', () => {
    const responses = [
      { questionId: 'EN001', value: 5, types: [1, 2] },
      { questionId: 'EN002', value: 3, types: [2, 3] }
    ];
    
    const scores = calculateTypeScores(responses);
    
    expect(scores['1']).toBeGreaterThan(0);
    expect(scores['2']).toBeGreaterThan(scores['1']);
  });
  
  test('normalizes scores to 100', () => {
    const scores = { '1': 50, '2': 75, '3': 100 };
    const normalized = normalizeScores(scores);
    
    expect(normalized['3']).toBe(100);
    expect(normalized['1']).toBe(50);
  });
});
```

#### 2. Integration Tests

```typescript
// __tests__/api/enneagram.test.ts
describe('Enneagram API', () => {
  test('complete assessment flow', async () => {
    // Start assessment
    let res = await fetch('/api/enneagram/items?stage=screener');
    const items = await res.json();
    expect(items.items).toHaveLength(90);
    
    // Submit answers
    res = await fetch('/api/enneagram/answer', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'test-session',
        stage: 'screener',
        input: { responses: mockResponses }
      })
    });
    
    const result = await res.json();
    expect(result.nextStage).toBeDefined();
  });
});
```

#### 3. Manual Testing Flow

```bash
# 1. Start dev server
pnpm dev

# 2. Open browser
open http://localhost:3000/discover/enneagram

# 3. Complete assessment
# - Answer screener questions
# - Complete discriminators if needed
# - Review results

# 4. Check database
pnpm prisma studio
# View EnneagramSession and EnneagramProfile tables
```

## Common Development Tasks

### Adding Korean Translations

```typescript
// src/lib/enneagram/i18n.ts
const translations = {
  en: {
    type_1: "The Perfectionist",
    type_1_desc: "Principled, purposeful, self-controlled"
  },
  ko: {
    type_1: "완벽주의자",
    type_1_desc: "원칙적이고, 목적이 분명하며, 자제력이 강함"
  }
};

// In itemBank.ts
export function getScreenerItems(locale: string = 'en') {
  return items.map(item => ({
    ...item,
    text: translations[locale][item.id] || item.text
  }));
}
```

### Implementing Instinctual Variants

Edit `/src/lib/enneagram/instincts.ts`:

```typescript
export function calculateInstinctualStack(responses: Response[]) {
  const scores = {
    sp: 0, // self-preservation
    sx: 0, // sexual/one-to-one
    so: 0  // social
  };
  
  responses.forEach(r => {
    const instinct = getInstinctFromQuestion(r.questionId);
    if (instinct) {
      scores[instinct] += r.value;
    }
  });
  
  // Return ordered stack
  return Object.entries(scores)
    .sort(([,a], [,b]) => b - a)
    .map(([key]) => key);
}
```

### Adding Tritype Calculation

```typescript
// src/lib/enneagram/tritype.ts
export function calculateTritype(typeScores: TypeScores) {
  // Group by center
  const centers = {
    body: [8, 9, 1],
    heart: [2, 3, 4],
    head: [5, 6, 7]
  };
  
  const tritype = [];
  
  // Get highest from each center
  Object.entries(centers).forEach(([center, types]) => {
    const centerScores = types.map(t => ({
      type: t,
      score: typeScores[t]
    }));
    
    centerScores.sort((a, b) => b.score - a.score);
    tritype.push(centerScores[0].type);
  });
  
  // Order by overall score
  tritype.sort((a, b) => typeScores[b] - typeScores[a]);
  
  return tritype.join('');
}
```

## Debugging

### Common Issues and Solutions

#### 1. Questions Not Loading
```typescript
// Check itemBank
console.log('Available items:', getScreenerItems('en').length);

// Verify API response
const res = await fetch('/api/enneagram/items?stage=screener');
console.log('API response:', await res.json());
```

#### 2. Scoring Inconsistencies
```typescript
// Add logging to scoring
export function calculateTypeScores(responses) {
  console.log('Input responses:', responses);
  const scores = {};
  
  // ... calculation logic
  
  console.log('Final scores:', scores);
  return scores;
}
```

#### 3. Session Not Persisting
```bash
# Check database connection
pnpm prisma db pull

# Verify session creation
SELECT * FROM "EnneagramSession" WHERE "sessionId" = 'your-session-id';
```

### Debug Tools

1. **Browser DevTools**
   - Network tab for API calls
   - Console for client-side errors
   - Application tab for session storage

2. **Prisma Studio**
```bash
pnpm prisma studio
# Visual database browser at http://localhost:5555
```

3. **API Testing**
```bash
# Using curl
curl http://localhost:3000/api/enneagram/items?stage=screener

# Using httpie
http GET localhost:3000/api/enneagram/items stage==screener
```

## Performance Optimization

### Caching Questions
```typescript
// src/lib/enneagram/cache.ts
const questionCache = new Map();

export function getCachedQuestions(stage: string, locale: string) {
  const key = `${stage}:${locale}`;
  
  if (!questionCache.has(key)) {
    const questions = loadQuestions(stage, locale);
    questionCache.set(key, questions);
  }
  
  return questionCache.get(key);
}
```

### Batch Processing Responses
```typescript
// Process responses in batches
export async function batchProcessResponses(responses: Response[]) {
  const batchSize = 10;
  const results = [];
  
  for (let i = 0; i < responses.length; i += batchSize) {
    const batch = responses.slice(i, i + batchSize);
    const batchResults = await processBatch(batch);
    results.push(...batchResults);
  }
  
  return results;
}
```

## Deployment Considerations

### Environment Variables
```bash
# Production settings
NODE_ENV=production
DATABASE_URL=postgresql://prod_connection
ENABLE_ANALYTICS=true
SESSION_TIMEOUT=3600000
```

### Build Optimization
```json
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@/lib/enneagram']
  }
};
```

### Health Check
```typescript
// src/app/api/health/enneagram/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    itemBank: checkItemBank(),
    scoring: checkScoringEngine()
  };
  
  const healthy = Object.values(checks).every(v => v);
  
  return NextResponse.json({
    status: healthy ? 'healthy' : 'degraded',
    checks
  });
}
```