# StrengthDiscovery Development Guide

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+ (or Docker)
- pnpm or npm
- Git

### Initial Setup

1. **Navigate to the main project:**
```bash
cd "/Volumes/External SSD/Projects/Research/WFED119/lifecraft-bot"
```

2. **Install dependencies:**
```bash
pnpm install
# or
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env.local
# Edit .env.local with your values:
# DB_ENABLED=true
# DATABASE_URL="postgresql://..."
# OPENAI_API_KEY="sk-..."
```

4. **Start development server:**
```bash
pnpm dev
# Access at http://localhost:3000/discover/strengths
```

## Development Workflow

### Working on Visualizations

1. **Locate visualization components:**
```bash
cd src/components/visualization/
```

2. **Key files:**
- `StrengthRadarChart.tsx` - Radar chart implementation
- `StrengthHexagon.tsx` - Hexagonal strength display
- `StrengthMindMap.tsx` - Mind map visualization

3. **Testing visualizations:**
```bash
# Run dev server
pnpm dev

# Visit test page
open http://localhost:3000/discover/strengths

# Use React DevTools for debugging
```

4. **Adding new visualization:**
```typescript
// src/components/visualization/StrengthNewViz.tsx
import React from 'react';
import { UserStrength } from '@/types/strength';

interface Props {
  strengths: UserStrength[];
  // Add other props
}

export const StrengthNewViz: React.FC<Props> = ({ strengths }) => {
  // Implementation
  return <div>...</div>;
};
```

### Working on Assessment Logic

1. **Create strength service (if not exists):**
```bash
mkdir -p src/lib/strengths
touch src/lib/strengths/assessment.ts
```

2. **Implement assessment logic:**
```typescript
// src/lib/strengths/assessment.ts
export class StrengthAssessment {
  private responses: Map<string, any> = new Map();
  
  async startAssessment(userId: string) {
    // Initialize assessment
  }
  
  async processResponse(questionId: string, answer: any) {
    // Process and store response
  }
  
  async calculateResults() {
    // Calculate strength scores
  }
}
```

3. **Connect to API route:**
```typescript
// src/app/api/strength/assessment/route.ts
import { StrengthAssessment } from '@/lib/strengths/assessment';

export async function POST(req: Request) {
  const assessment = new StrengthAssessment();
  // Handle request
}
```

### Database Development

1. **Create Prisma schema (if using Prisma):**
```prisma
// prisma/schema.prisma
model UserStrength {
  id           String   @id @default(cuid())
  userId       String
  strengthId   String
  score        Float
  confidence   Float
  rank         Int
  assessmentId String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@index([userId])
  @@unique([userId, strengthId, assessmentId])
}
```

2. **Run migrations:**
```bash
pnpm prisma migrate dev --name add_strength_tables
```

3. **Generate client:**
```bash
pnpm prisma generate
```

## Testing

### Unit Tests

1. **Create test file:**
```typescript
// __tests__/strengths/assessment.test.ts
import { StrengthAssessment } from '@/lib/strengths/assessment';

describe('StrengthAssessment', () => {
  it('should calculate correct scores', () => {
    // Test implementation
  });
});
```

2. **Run tests:**
```bash
pnpm test
# or specific test
pnpm test assessment.test.ts
```

### Integration Tests

```typescript
// __tests__/api/strength.test.ts
import { POST } from '@/app/api/strength/assessment/route';

describe('Strength API', () => {
  it('should create assessment', async () => {
    const req = new Request('http://localhost:3000/api/strength/assessment', {
      method: 'POST',
      body: JSON.stringify({ userId: 'test' })
    });
    
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
```

### Manual Testing

1. **Using the UI:**
```bash
# Start dev server
pnpm dev

# Navigate to strength discovery
open http://localhost:3000/discover/strengths

# Follow the assessment flow
```

2. **Using API directly:**
```bash
# Start assessment
curl -X POST http://localhost:3000/api/strength/assessment/start \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user"}'

# Submit answer
curl -X POST http://localhost:3000/api/strength/assessment/answer \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "xxx", "questionId": "q1", "answer": 5}'
```

## Common Tasks

### Adding a New Strength Category

1. **Update types:**
```typescript
// src/types/strength.ts
export enum StrengthCategory {
  EXECUTING = "executing",
  INFLUENCING = "influencing",
  RELATIONSHIP = "relationship",
  STRATEGIC_THINKING = "thinking",
  NEW_CATEGORY = "new_category" // Add new
}
```

2. **Update database:**
```sql
INSERT INTO strength_categories (name, description)
VALUES ('new_category', 'Description of new category');
```

3. **Update UI components:**
```typescript
// Update visualization components to handle new category
const categoryColors = {
  executing: '#FF6B6B',
  influencing: '#4ECDC4',
  relationship: '#45B7D1',
  thinking: '#96CEB4',
  new_category: '#DDA0DD' // Add color
};
```

### Implementing Caching

```typescript
// src/lib/strengths/cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN
});

export async function getCachedStrengths(userId: string) {
  const cached = await redis.get(`strengths:${userId}`);
  if (cached) return JSON.parse(cached);
  
  // Fetch from DB
  const strengths = await fetchFromDB(userId);
  
  // Cache for 1 hour
  await redis.setex(`strengths:${userId}`, 3600, JSON.stringify(strengths));
  return strengths;
}
```

### Adding Internationalization

```typescript
// src/lib/strengths/i18n.ts
const translations = {
  en: {
    strategic_thinking: "Strategic Thinking",
    description: "You excel at analyzing patterns..."
  },
  ko: {
    strategic_thinking: "전략적 사고",
    description: "당신은 패턴 분석에 뛰어납니다..."
  }
};

export function getTranslation(key: string, locale: string = 'en') {
  return translations[locale]?.[key] || translations.en[key];
}
```

## Debugging

### Common Issues

1. **Visualization not rendering:**
```typescript
// Check if data is properly formatted
console.log('Strength data:', strengths);

// Verify component is receiving props
useEffect(() => {
  console.log('Props received:', props);
}, [props]);
```

2. **API route not found:**
```bash
# Check file location
ls -la src/app/api/strength/

# Verify route export
# Must export GET, POST, etc.
```

3. **Database connection issues:**
```bash
# Test connection
pnpm prisma db pull

# Check DATABASE_URL in .env.local
echo $DATABASE_URL
```

### Debug Tools

1. **React DevTools:** Inspect component props and state
2. **Network tab:** Monitor API calls
3. **Prisma Studio:** View database
```bash
pnpm prisma studio
```

## Performance Optimization

### Frontend Optimizations

```typescript
// Use React.memo for expensive components
export const StrengthVisualization = React.memo(({ strengths }) => {
  // Component logic
});

// Lazy load heavy libraries
const D3Chart = dynamic(() => import('./D3Chart'), {
  loading: () => <Skeleton />,
  ssr: false
});
```

### API Optimizations

```typescript
// Implement pagination
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  
  const strengths = await prisma.userStrength.findMany({
    skip: (page - 1) * limit,
    take: limit
  });
  
  return Response.json(strengths);
}
```

### Database Optimizations

```sql
-- Add indexes for common queries
CREATE INDEX idx_user_strengths_user_id ON user_strengths(user_id);
CREATE INDEX idx_user_strengths_rank ON user_strengths(user_id, rank);

-- Use materialized views for complex queries
CREATE MATERIALIZED VIEW user_top_strengths AS
SELECT user_id, strength_id, score, rank
FROM user_strengths
WHERE rank <= 5;
```

## Deployment

### Build for Production

```bash
# Build the application
pnpm build

# Test production build
pnpm start
```

### Environment Setup

```bash
# Production environment variables
DATABASE_URL=postgresql://prod...
REDIS_URL=redis://prod...
NEXT_PUBLIC_API_URL=https://api.lifecraft.com
```

### Health Checks

```typescript
// src/app/api/health/strength/route.ts
export async function GET() {
  try {
    // Check database
    await prisma.userStrength.count();
    
    // Check cache
    await redis.ping();
    
    return Response.json({ status: 'healthy' });
  } catch (error) {
    return Response.json({ status: 'unhealthy', error }, { status: 500 });
  }
}
```