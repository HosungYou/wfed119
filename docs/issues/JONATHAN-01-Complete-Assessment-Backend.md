# JONATHAN-01: Complete Assessment Module Backend

**Priority:** P1 (Sprint 1 - Week 1)
**Owner:** @jonathan (Database/Backend Lead)
**Type:** feature
**Estimate:** 10 hours
**Dependencies:** Supabase setup complete

## 🎯 Objective
Complete the backend implementation for all assessment modules (Enneagram, Strengths, Career) with proper database schema, API endpoints, and data validation.

## ✅ Definition of Ready
- [ ] Supabase access configured
- [ ] Understanding of assessment logic for each module
- [ ] TypeScript/Next.js environment ready
- [ ] Access to existing Values Discovery implementation

## 📋 Acceptance Criteria
- [ ] Complete database schema for all modules
- [ ] CRUD operations for each assessment type
- [ ] Data validation and constraints
- [ ] Proper error handling
- [ ] API response time < 200ms
- [ ] Transaction support for data integrity
- [ ] Migration scripts with rollback capability

## 🛠️ Implementation Tasks

### 1. Database Schema Completion
**File**: `database/migrations/004-complete-assessment-schema.sql`

```sql
-- ============================================
-- ENNEAGRAM MODULE
-- ============================================

-- Enneagram questions bank
CREATE TABLE enneagram_questions (
  id SERIAL PRIMARY KEY,
  question_text TEXT NOT NULL,
  category VARCHAR(50),
  weight DECIMAL(3,2) DEFAULT 1.0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User responses to Enneagram questions
CREATE TABLE enneagram_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES enneagram_questions(id),
  response_value INTEGER CHECK (response_value BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- Calculated Enneagram results
CREATE TABLE enneagram_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_type INTEGER CHECK (primary_type BETWEEN 1 AND 9),
  wing_type INTEGER CHECK (wing_type BETWEEN 1 AND 9),
  tritype VARCHAR(10),
  scores JSONB NOT NULL, -- {type1: score, type2: score, ...}
  calculated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- STRENGTHS MODULE
-- ============================================

-- Strength categories based on LifeCraft
CREATE TABLE strength_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(7), -- hex color
  order_index INTEGER DEFAULT 0
);

-- User's identified strengths
CREATE TABLE strength_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES strength_categories(id),
  strength_name VARCHAR(200) NOT NULL,
  description TEXT,
  evidence TEXT[], -- Array of examples/stories
  confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
  ai_extracted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- CAREER ALIGNMENT MODULE
-- ============================================

-- Career paths database
CREATE TABLE career_paths (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  onet_code VARCHAR(20), -- O*NET occupation code
  education_level VARCHAR(50),
  avg_salary_min INTEGER,
  avg_salary_max INTEGER,
  growth_outlook VARCHAR(50),
  required_skills TEXT[],
  related_values TEXT[],
  related_strengths TEXT[],
  active BOOLEAN DEFAULT TRUE
);

-- User's career alignment scores
CREATE TABLE career_alignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  career_id INTEGER REFERENCES career_paths(id),
  alignment_score DECIMAL(3,2) CHECK (alignment_score BETWEEN 0 AND 1),
  factors JSONB, -- {values: 0.8, strengths: 0.7, interests: 0.9}
  user_interest_rating INTEGER CHECK (user_interest_rating BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, career_id)
);

-- ============================================
-- UNIFIED PROGRESS TRACKING
-- ============================================

CREATE TABLE user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  module VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'not_started', -- not_started, in_progress, completed
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  last_activity TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  metadata JSONB,
  UNIQUE(user_id, module)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_enneagram_responses_user ON enneagram_responses(user_id);
CREATE INDEX idx_strength_profiles_user ON strength_profiles(user_id);
CREATE INDEX idx_career_alignments_user ON career_alignments(user_id);
CREATE INDEX idx_user_progress_user_module ON user_progress(user_id, module);

-- ============================================
-- SEED DATA
-- ============================================

-- Insert Enneagram questions (sample)
INSERT INTO enneagram_questions (question_text, category) VALUES
('I am more comfortable with facts than theories', 'thinking'),
('I enjoy helping others achieve their goals', 'feeling'),
('I prefer working independently', 'autonomy');

-- Insert strength categories
INSERT INTO strength_categories (name, description, order_index) VALUES
('Thinking', 'Cognitive and analytical abilities', 1),
('Relating', 'Interpersonal and communication skills', 2),
('Executing', 'Task completion and implementation abilities', 3),
('Creating', 'Innovation and creative problem-solving', 4);
```

### 2. Enneagram API Implementation
**File**: `src/app/api/discover/enneagram/calculate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

interface EnneagramResponse {
  questionId: number;
  value: number;
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();

  // Verify authentication
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (!session || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const responses: EnneagramResponse[] = await req.json();

    // Validate input
    if (!Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json(
        { error: 'Invalid responses format' },
        { status: 400 }
      );
    }

    // Start transaction
    const { data: existingResults } = await supabase
      .from('enneagram_results')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    // Save responses
    const { error: responseError } = await supabase
      .from('enneagram_responses')
      .upsert(
        responses.map(r => ({
          user_id: session.user.id,
          question_id: r.questionId,
          response_value: r.value
        })),
        { onConflict: 'user_id,question_id' }
      );

    if (responseError) throw responseError;

    // Calculate Enneagram type
    const calculatedType = calculateEnneagramType(responses);

    // Save or update results
    const { data: result, error: resultError } = await supabase
      .from('enneagram_results')
      .upsert({
        user_id: session.user.id,
        primary_type: calculatedType.primary,
        wing_type: calculatedType.wing,
        tritype: calculatedType.tritype,
        scores: calculatedType.scores
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (resultError) throw resultError;

    // Update progress
    await updateUserProgress(supabase, session.user.id, 'enneagram', 100);

    return NextResponse.json({
      success: true,
      result: {
        primaryType: result.primary_type,
        wingType: result.wing_type,
        tritype: result.tritype,
        description: getEnneagramDescription(result.primary_type)
      }
    });

  } catch (error) {
    console.error('[ENNEAGRAM_CALCULATE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate Enneagram type' },
      { status: 500 }
    );
  }
}

function calculateEnneagramType(responses: EnneagramResponse[]) {
  // Implement Enneagram calculation logic
  // This is a simplified version - real implementation would be more complex
  const scores: Record<number, number> = {};

  for (let i = 1; i <= 9; i++) {
    scores[i] = 0;
  }

  // Process responses and calculate scores
  responses.forEach(response => {
    // Map responses to type scores based on question categories
    // This is placeholder logic
    const typeMapping = getQuestionTypeMapping(response.questionId);
    if (typeMapping) {
      scores[typeMapping] += response.value;
    }
  });

  // Find primary type
  const primary = Object.entries(scores)
    .sort(([,a], [,b]) => b - a)[0][0];

  // Determine wing (adjacent type with higher score)
  const wing = determineWing(parseInt(primary), scores);

  return {
    primary: parseInt(primary),
    wing,
    tritype: calculateTritype(scores),
    scores
  };
}

function getQuestionTypeMapping(questionId: number): number {
  // Map question IDs to Enneagram types
  // This would be based on your question design
  const mapping: Record<number, number> = {
    1: 1, 2: 2, 3: 3, // etc.
  };
  return mapping[questionId] || 1;
}

function determineWing(primary: number, scores: Record<number, number>): number {
  const leftWing = primary === 1 ? 9 : primary - 1;
  const rightWing = primary === 9 ? 1 : primary + 1;

  return scores[leftWing] > scores[rightWing] ? leftWing : rightWing;
}

function calculateTritype(scores: Record<number, number>): string {
  // Calculate tritype (one from each center: gut, heart, head)
  const gut = [8, 9, 1];
  const heart = [2, 3, 4];
  const head = [5, 6, 7];

  const gutType = gut.sort((a, b) => scores[b] - scores[a])[0];
  const heartType = heart.sort((a, b) => scores[b] - scores[a])[0];
  const headType = head.sort((a, b) => scores[b] - scores[a])[0];

  return `${gutType}${heartType}${headType}`;
}

function getEnneagramDescription(type: number): string {
  const descriptions: Record<number, string> = {
    1: "The Perfectionist - Principled, purposeful, self-controlled",
    2: "The Helper - Caring, interpersonal, generous",
    3: "The Achiever - Success-oriented, adaptable, driven",
    4: "The Individualist - Sensitive, withdrawn, expressive",
    5: "The Investigator - Intense, cerebral, perceptive",
    6: "The Loyalist - Responsible, anxious, suspicious",
    7: "The Enthusiast - Busy, fun-loving, spontaneous",
    8: "The Challenger - Powerful, dominating, self-confident",
    9: "The Peacemaker - Easygoing, self-effacing, receptive"
  };
  return descriptions[type] || "Unknown type";
}

async function updateUserProgress(
  supabase: any,
  userId: string,
  module: string,
  percentage: number
) {
  await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      module,
      progress_percentage: percentage,
      status: percentage === 100 ? 'completed' : 'in_progress',
      completed_at: percentage === 100 ? new Date().toISOString() : null
    }, {
      onConflict: 'user_id,module'
    });
}
```

### 3. Dashboard Aggregation API
**File**: `src/app/api/dashboard/complete-profile/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();

  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (!session || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch all assessment data in parallel
    const [
      valuesData,
      enneagramData,
      strengthsData,
      careerData,
      progressData
    ] = await Promise.all([
      supabase
        .from('value_results')
        .select('*')
        .eq('user_id', session.user.id),

      supabase
        .from('enneagram_results')
        .select('*')
        .eq('user_id', session.user.id)
        .single(),

      supabase
        .from('strength_profiles')
        .select('*, category:strength_categories(*)')
        .eq('user_id', session.user.id),

      supabase
        .from('career_alignments')
        .select('*, career:career_paths(*)')
        .eq('user_id', session.user.id)
        .order('alignment_score', { ascending: false })
        .limit(10),

      supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', session.user.id)
    ]);

    // Calculate overall completion
    const modules = ['values', 'enneagram', 'strengths', 'career'];
    const progress = progressData.data || [];
    const overallProgress = modules.reduce((acc, module) => {
      const moduleProgress = progress.find(p => p.module === module);
      return acc + (moduleProgress?.progress_percentage || 0);
    }, 0) / modules.length;

    return NextResponse.json({
      success: true,
      data: {
        values: valuesData.data,
        enneagram: enneagramData.data,
        strengths: strengthsData.data,
        topCareers: careerData.data,
        progress: {
          overall: Math.round(overallProgress),
          modules: progress
        },
        recommendations: generateRecommendations({
          values: valuesData.data,
          enneagram: enneagramData.data,
          strengths: strengthsData.data
        })
      }
    });

  } catch (error) {
    console.error('[COMPLETE_PROFILE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch complete profile' },
      { status: 500 }
    );
  }
}

function generateRecommendations(data: any) {
  // Generate personalized recommendations based on all assessment data
  const recommendations = [];

  if (data.values?.length > 0) {
    recommendations.push({
      type: 'career_alignment',
      message: 'Based on your values, consider careers that emphasize...',
      priority: 'high'
    });
  }

  if (data.enneagram) {
    recommendations.push({
      type: 'work_environment',
      message: `As a Type ${data.enneagram.primary_type}, you thrive in...`,
      priority: 'medium'
    });
  }

  if (data.strengths?.length > 0) {
    recommendations.push({
      type: 'skill_development',
      message: 'Leverage your top strengths by...',
      priority: 'high'
    });
  }

  return recommendations;
}
```

### 4. Data Validation Middleware
**File**: `src/lib/middleware/validation.ts`

```typescript
import { z } from 'zod';

// Validation schemas
export const EnneagramResponseSchema = z.object({
  questionId: z.number().min(1),
  value: z.number().min(1).max(5)
});

export const StrengthProfileSchema = z.object({
  categoryId: z.number().min(1),
  strengthName: z.string().min(1).max(200),
  description: z.string().optional(),
  evidence: z.array(z.string()).optional(),
  confidenceScore: z.number().min(0).max(1)
});

export const CareerAlignmentSchema = z.object({
  careerId: z.number().min(1),
  userInterestRating: z.number().min(1).max(5).optional(),
  notes: z.string().optional()
});

// Validation middleware
export function validateRequest(schema: z.ZodSchema) {
  return async (req: Request) => {
    try {
      const body = await req.json();
      const validated = schema.parse(body);
      return { success: true, data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        };
      }
      return { success: false, error: 'Invalid request format' };
    }
  };
}
```

## 📊 Testing Requirements

### Database Tests
```sql
-- Test data integrity
SELECT COUNT(*) FROM enneagram_responses
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Test unique constraints
INSERT INTO enneagram_responses (user_id, question_id, response_value)
VALUES ('test-user-id', 1, 3), ('test-user-id', 1, 4);
-- Should fail on second insert

-- Test cascade deletes
DELETE FROM auth.users WHERE id = 'test-user-id';
-- Should remove all related records
```

### API Tests
```typescript
// src/app/api/discover/__tests__/enneagram.test.ts
describe('Enneagram API', () => {
  it('should calculate type from responses');
  it('should update existing results');
  it('should handle invalid responses');
  it('should require authentication');
  it('should complete within 200ms');
});
```

## 🎯 Definition of Done
- [ ] All database tables created with proper constraints
- [ ] Migration scripts tested and reversible
- [ ] All API endpoints implemented and documented
- [ ] Data validation in place for all inputs
- [ ] Error handling with meaningful messages
- [ ] Response time < 200ms for all endpoints
- [ ] Unit tests > 80% coverage
- [ ] Integration tests passing
- [ ] Code review by @trivikram
- [ ] Documentation updated
- [ ] Deployed to staging

## 📈 Success Metrics
- Zero data integrity violations
- API response time p95 < 200ms
- Zero unhandled errors in production
- 100% backward compatibility maintained

## 🔗 Resources
- [Supabase Database Guide](https://supabase.com/docs/guides/database)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Don%27t_Do_This)
- Existing implementation: `src/app/api/discover/values/`

## 🐛 Potential Issues & Solutions

### Issue 1: Transaction Management
**Solution**: Use Supabase transactions for multi-table operations

### Issue 2: N+1 Query Problem
**Solution**: Use proper JOINs and batch fetching

### Issue 3: Data Migration for Existing Users
**Solution**: Create backward-compatible schema changes

## 📝 Notes
- Coordinate with @trivikram on API contract for AI integration
- Consider implementing caching layer in Sprint 2
- Plan for data export functionality in next phase
- Ensure FERPA compliance for educational data