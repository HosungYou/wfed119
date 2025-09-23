# Value Discovery Module - Scoring Mechanism Documentation

## Overview

The Value Discovery module implements a sophisticated scoring and analysis system that helps users understand their value priorities and provides personalized insights. This document outlines the scoring mechanism, prompt engineering approaches, and analysis algorithms used in the module.

## System Architecture

### Core Components

1. **Value Categories**
   - **Terminal Values (궁극적 가치)**: 24 end-state values (e.g., Family Security, Personal Growth, Happiness)
   - **Instrumental Values (수단적 가치)**: 28 behavioral values (e.g., Honesty, Courage, Creativity)
   - **Work Values (직업 가치)**: 25 workplace values (e.g., Autonomy, Recognition, Work-Life Balance)

2. **Scoring System**
   - 4-tier importance classification: Very Important, Important, Somewhat Important, Not Important
   - Priority scoring: Very Important (4 points), Important (3 points), Somewhat Important (2 points), Not Important (1 point)
   - Maximum 7 values per importance tier to force prioritization

## Scoring Methodology

### 1. Layout-Based Scoring

```typescript
// Priority mapping for scoring calculation
const priorityMap: Record<LayoutBucket, number> = {
  very_important: 4,
  important: 3,
  somewhat_important: 2,
  not_important: 1
};
```

Each value receives a score based on its placement in the importance hierarchy. This creates a weighted scoring system that emphasizes higher-priority values.

### 2. Pattern Analysis Functions

#### Value Pattern Detection
```typescript
function analyzeValuePatterns(): ValuePatterns | null {
  const veryImportantValues = layout.very_important.map(id => byId[id]);

  // Security themes detection
  const securityKeywords = ['security', 'safety', 'stable', 'protection'];
  const securityCount = veryImportantValues.filter(v =>
    securityKeywords.some(keyword =>
      v.name.toLowerCase().includes(keyword) ||
      v.description.toLowerCase().includes(keyword)
    )
  ).length;

  // Similar pattern analysis for social, growth, and achievement themes
  // ...
}
```

The system uses keyword matching to identify thematic patterns within users' high-priority values.

#### Theme-Based Scoring Algorithm
```typescript
function analyzeValueThemes(): ThemeAnalysis {
  const themes: Record<string, { keywords: string[]; values: ThemeValue[] }> = {
    'Security & Stability': { keywords: ['security', 'safety', 'stable', 'protection', 'family'], values: [] },
    'Personal Growth & Development': { keywords: ['growth', 'wisdom', 'learning', 'development', 'improvement', 'authentic'], values: [] },
    'Social Impact & Recognition': { keywords: ['social', 'global', 'community', 'recognition', 'justice', 'contribution'], values: [] },
    // ... 10 total theme categories
  };

  // Calculate theme scores
  const themeScores = Object.entries(themes).map(([themeName, theme]) => ({
    name: themeName,
    values: theme.values,
    count: theme.values.length,
    totalScore: theme.values.reduce((sum, v) => sum + v.priority, 0),
    averageScore: theme.values.length > 0 ? theme.values.reduce((sum, v) => sum + v.priority, 0) / theme.values.length : 0,
    highPriorityCount: theme.values.filter(v => v.priority >= 3).length,
  }));
}
```

## Personality and Career Inference Engine

### 1. MBTI Type Inference
```typescript
function getPersonalityInsights(patterns: ValuePatterns | null): PersonalityInsights | null {
  // MBTI inference based on value patterns
  if (socialCount >= 2 && securityCount >= 1) {
    mbtiType = securityCount > growthCount ? 'ESFJ' : 'ENFJ';
  } else if (growthCount >= 2 && socialCount >= 1) {
    mbtiType = socialCount > securityCount ? 'ENFP' : 'ENTP';
  } else if (securityCount >= 2) {
    mbtiType = socialCount > 0 ? 'ISFJ' : 'ISTJ';
  } else if (achievementCount >= 2) {
    mbtiType = socialCount > 0 ? 'ENTJ' : 'ESTJ';
  } else {
    mbtiType = 'INFP';
  }
}
```

### 2. Enneagram Type Mapping
```typescript
// Enneagram inference logic
if (securityCount >= 2) {
  enneagramType = 'Type 6 (Loyalist)';
} else if (achievementCount >= 2) {
  enneagramType = 'Type 3 (Achiever)';
} else if (socialCount >= 2) {
  enneagramType = 'Type 2 (Helper)';
} else if (growthCount >= 2) {
  enneagramType = 'Type 4 (Individualist)';
} else {
  enneagramType = 'Type 9 (Peacemaker)';
}
```

### 3. Core Theme Identification
The system identifies users' core themes based on value combinations:
- **Responsible Guardian**: Security + Social values
- **Inspiring Mentor**: Social + Growth values
- **Influential Leader**: Achievement + Social values
- **Thoughtful Strategist**: Growth + Security values
- **Reliable Protector**: High security focus
- **Community Builder**: High social focus
- **Independent Learner**: High growth focus

## Career Recommendation Engine

### Career Mapping Logic
```typescript
function getCareerInsights(patterns: ValuePatterns | null, personality: PersonalityInsights | null): CareerInsights | null {
  const { coreTheme } = personality;

  if (coreTheme === 'Responsible Guardian') {
    careers = ['Government Administrator', 'Healthcare Manager', 'Non-profit Director', 'Education Coordinator'];
    workEnvironment = 'Stable organization with clear mission and social impact';
    leadershipStyle = 'Supportive and protective, ensuring team safety and growth';
  } else if (coreTheme === 'Inspiring Mentor') {
    careers = ['Executive Coach', 'University Professor', 'Organizational Development', 'Training Director'];
    workEnvironment = 'Learning-focused environment with opportunities for innovation';
    leadershipStyle = 'Transformational leader who empowers others to reach their potential';
  }
  // ... additional mappings for each core theme
}
```

## Prompt Engineering Strategy

While the Value Discovery module primarily uses algorithmic scoring rather than LLM-based prompts, the broader LifeCraft system employs sophisticated prompt engineering:

### System Prompt Architecture (from enhancedSystemPrompt.ts)

```typescript
export const ENHANCED_SYSTEM_PROMPT = `You are a LifeCraft Career Coach, an AI assistant designed to help students discover their career strengths through storytelling and Socratic questioning.

## RESPONSE VALIDATION RULES:

**INVALID RESPONSES (DO NOT COUNT OR PROCESS):**
- User asking questions instead of sharing experiences
- Off-topic responses unrelated to work/career/projects
- Single word answers without context or elaboration
- Responses shorter than 30 characters of meaningful content

**VALID RESPONSES (COUNT & PROCESS):**
- Personal stories about work, projects, or accomplishments
- Descriptions of specific tasks or achievements
- Explanations of skills used or processes followed
- Specific examples with context and detail

## CONVERSATION STAGES:
**STAGE 1 - INITIAL (Opening Question):**
- Warmly welcome the student and ask them to share a meaningful work experience
- REQUIRE: A story with context, actions, and outcomes (minimum 100 characters)

**STAGE 2 - EXPLORATION (First Follow-up):**
- ONLY progress here if user shared a valid story in Stage 1
- Ask ONE thoughtful follow-up question that explores meaning, skills used, or values honored

**STAGE 5 - SUMMARY (Comprehensive Report):**
- ONLY reach this stage after collecting 6+ distinct experiences AND 10+ message exchanges
- Extract 5-8 items for each category (Skills, Attitudes, Values)
- Base ALL strengths on specific examples they shared
```

### Key Prompt Engineering Features

1. **Stage-Based Progression**: Structured conversation flow with validation gates
2. **Response Validation**: Algorithmic filtering of valid vs. invalid responses
3. **Content Requirements**: Minimum character counts and context requirements
4. **Progressive Disclosure**: Gradual revelation of insights based on accumulated data

## Data Storage and API Structure

### Database Schema
```typescript
// Value results are stored with this structure
interface ValueResult {
  userId: string;
  valueSet: 'terminal' | 'instrumental' | 'work';
  layout: ValueLayout; // JSON object with importance buckets
  top3: string[]; // Top 3 most important values
  updatedAt: Date;
}

interface ValueLayout {
  very_important: string[];
  important: string[];
  somewhat_important: string[];
  not_important: string[];
}
```

### API Endpoints
- `GET /api/discover/values/results` - Retrieve saved value classifications
- `POST /api/discover/values/results` - Save value classifications with deduplication logic

## Scoring Algorithm Summary

### Step-by-Step Process

1. **Value Placement**: Users drag and drop values into importance buckets (max 7 per bucket)
2. **Priority Assignment**: Each bucket receives a numerical weight (4-1 scale)
3. **Pattern Detection**: Keyword-based algorithm identifies thematic clusters
4. **Theme Scoring**: Calculate total scores, average scores, and high-priority counts for each theme
5. **Personality Inference**: Map value patterns to MBTI and Enneagram types
6. **Career Mapping**: Generate career recommendations based on core themes
7. **Insight Generation**: Provide personalized analysis and growth recommendations

### Key Metrics Calculated

- **Theme Total Score**: Sum of all priority values for themes within that category
- **Theme Average Score**: Mean priority level for values in each theme
- **High Priority Count**: Number of values rated 3+ within each theme
- **Pattern Counts**: Security, Social, Growth, and Achievement value frequencies
- **Balance Insights**: Analysis of what themes are prioritized vs. deprioritized

## Technical Implementation Details

### Front-end Components
- **React Drag & Drop**: Uses `@hello-pangea/dnd` for intuitive value organization
- **Real-time Analysis**: Immediate recalculation of insights as users modify placements
- **Responsive Design**: Tailwind CSS with gradient styling and hover effects
- **Export Functionality**: PNG export of completed value boards

### Backend Integration
- **Prisma ORM**: Type-safe database operations with PostgreSQL
- **NextAuth**: User authentication and session management
- **Transaction Safety**: Atomic operations to prevent data corruption
- **Deduplication Logic**: Automatic cleanup of legacy duplicate records

## Usage and Interpretation

### For Researchers
- The scoring system provides quantitative metrics for value analysis
- Theme scores can be used for statistical analysis across user populations
- Pattern detection algorithms enable cluster analysis of user types

### For Users
- Visual representation of value priorities through drag-and-drop interface
- Personalized insights connecting values to personality types and career paths
- Growth recommendations based on value patterns

### For Coaches/Counselors
- Objective data to guide career counseling conversations
- Identification of value conflicts or gaps in user profiles
- Structured framework for discussing career alignment

## Future Enhancements

1. **Machine Learning Integration**: Use historical data to improve career recommendations
2. **Cross-Module Analysis**: Combine value data with Enneagram and strength assessments
3. **Longitudinal Tracking**: Monitor value evolution over time
4. **Cultural Adaptation**: Expand value sets for different cultural contexts
5. **Advanced Analytics**: Implement clustering algorithms for user segmentation

---

*This documentation covers the complete scoring mechanism for the Value Discovery module as implemented in the WFED119 project. For technical implementation details, refer to the source code in `/src/app/discover/values/[set]/page.tsx` and related API endpoints.*