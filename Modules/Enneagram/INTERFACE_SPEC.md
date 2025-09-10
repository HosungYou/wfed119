# Enneagram Interface Specification

## API Endpoints

### Assessment Endpoints

#### GET /api/enneagram/items
Retrieves assessment questions for the current stage.

**Query Parameters:**
```
stage: 'screener' | 'discriminators' | 'wings' | 'instincts'
locale: 'en' | 'ko'
sessionId: string (optional)
```

**Response:**
```json
{
  "stage": "screener",
  "items": [
    {
      "id": "EN001",
      "text": "I am more comfortable with facts than theories",
      "type": "likert",
      "scale": {
        "min": 1,
        "max": 5,
        "labels": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
      },
      "relatedTypes": [1, 5, 6]
    }
  ],
  "totalItems": 90,
  "requiredResponses": 45
}
```

#### POST /api/enneagram/answer
Submits answers and progresses through assessment.

**Request:**
```json
{
  "sessionId": "uuid",
  "stage": "screener",
  "input": {
    "responses": [
      { "itemId": "EN001", "value": 4 },
      { "itemId": "EN002", "value": 2 }
    ]
  },
  "locale": "en"
}
```

**Response:**
```json
{
  "nextStage": "discriminators",
  "progress": 0.25,
  "message": "Great! Let's refine your type with some targeted questions.",
  "requiredTypes": [4, 5],
  "continueAssessment": true
}
```

#### POST /api/enneagram/score
Calculates and returns Enneagram type scores.

**Request:**
```json
{
  "sessionId": "uuid",
  "calculateFinal": true
}
```

**Response:**
```json
{
  "scores": {
    "1": 72.5,
    "2": 45.3,
    "3": 68.9,
    "4": 85.7,
    "5": 88.2,
    "6": 55.1,
    "7": 42.8,
    "8": 61.4,
    "9": 39.6
  },
  "primaryType": 5,
  "wing": 4,
  "confidence": 0.89,
  "closeTypes": [4, 1],
  "instinctualStack": ["sp", "sx", "so"],
  "tritype": "514"
}
```

#### GET /api/enneagram/export
Exports assessment results in various formats.

**Query Parameters:**
```
sessionId: string
format: 'json' | 'pdf' | 'html'
includeDetails: boolean
```

**Response (JSON format):**
```json
{
  "exportDate": "2024-01-15T10:30:00Z",
  "session": {
    "id": "uuid",
    "completedAt": "2024-01-15T10:00:00Z"
  },
  "results": {
    "type": 5,
    "wing": 4,
    "title": "The Investigator",
    "subtype": "5w4 - The Iconoclast",
    "instincts": {
      "dominant": "self-preservation",
      "secondary": "sexual",
      "tertiary": "social"
    },
    "tritype": {
      "code": "514",
      "description": "The Researcher"
    }
  },
  "analysis": {
    "strengths": [],
    "challenges": [],
    "growth_path": [],
    "stress_behavior": [],
    "security_behavior": []
  }
}
```

### Type Information Endpoints

#### GET /api/enneagram/types
Returns information about all Enneagram types.

**Response:**
```json
{
  "types": [
    {
      "number": 1,
      "name": "The Perfectionist",
      "title": "The Reformer",
      "core_motivation": "To be good, right, and perfect",
      "core_fear": "Being corrupt, defective, or imperfect",
      "stress_arrow": 4,
      "growth_arrow": 7,
      "wings": [9, 2],
      "center": "body",
      "keywords": ["principled", "purposeful", "self-controlled", "perfectionistic"]
    }
  ]
}
```

#### GET /api/enneagram/type/:number
Returns detailed information about a specific type.

**Response:**
```json
{
  "number": 5,
  "name": "The Investigator",
  "overview": "Fives are alert, insightful, and curious...",
  "levels": {
    "healthy": ["Level 1: Visionary Pioneer", "Level 2: Perceptive Observer"],
    "average": ["Level 4: Studious Expert", "Level 5: Intense Conceptualizer"],
    "unhealthy": ["Level 7: Isolated Nihilist", "Level 8: Delusive Schizoid"]
  },
  "relationships": {
    "with_1": { "compatibility": 0.7, "dynamics": "..." },
    "with_2": { "compatibility": 0.6, "dynamics": "..." }
  },
  "growth_recommendations": [],
  "famous_examples": ["Albert Einstein", "Stephen Hawking", "Bill Gates"]
}
```

## Data Models

### Core Entities

```typescript
// Enneagram Type Definition
interface EnneagramType {
  number: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  name: string;
  title: string;
  alternativeNames: string[];
  center: 'body' | 'heart' | 'head';
  
  // Core aspects
  coreMotivation: string;
  coreFear: string;
  coreDesire: string;
  keyMotivations: string[];
  
  // Dynamics
  stressPoint: number;
  growthPoint: number;
  wings: [number, number];
  
  // Characteristics
  strengths: string[];
  weaknesses: string[];
  basicProposition: string;
  
  // Cognitive patterns
  attentionPattern: string;
  emotionalHabit: string;
  defenseMechanism: string;
}

// User's Enneagram Profile
interface EnneagramProfile {
  userId: string;
  assessmentId: string;
  
  // Type identification
  primaryType: number;
  primaryConfidence: number;
  wing: number | null;
  wingBalance: number; // -1 to 1, negative favors lower wing
  
  // Instinctual variants
  instinctualStack: InstinctualVariant[];
  instinctualScores: {
    sp: number;
    sx: number;
    so: number;
  };
  
  // Tritype
  tritype: string;
  tritypeConfidence: number;
  
  // Health level
  estimatedLevel: number; // 1-9
  levelConfidence: number;
  
  // Metadata
  createdAt: Date;
  lastUpdated: Date;
}

// Instinctual Variant
interface InstinctualVariant {
  type: 'sp' | 'sx' | 'so';
  name: 'self-preservation' | 'sexual' | 'social';
  score: number;
  rank: 1 | 2 | 3;
}

// Assessment Question
interface EnneagramQuestion {
  id: string;
  text: string;
  category: 'core' | 'wing' | 'instinct' | 'health';
  format: 'likert' | 'forced_choice' | 'ranking' | 'narrative';
  
  // For likert
  scale?: {
    min: number;
    max: number;
    labels: string[];
  };
  
  // For forced choice
  options?: Array<{
    text: string;
    types: number[];
    weight: number;
  }>;
  
  // Scoring
  scoringKey: Record<string, number>;
  relatedTypes: number[];
  weight: number;
}

// Assessment Session
interface EnneagramSession {
  sessionId: string;
  userId?: string;
  
  // Progress tracking
  currentStage: AssessmentStage;
  completedStages: AssessmentStage[];
  startedAt: Date;
  lastActivity: Date;
  
  // Responses
  responses: {
    screener: Response[];
    discriminators: Response[];
    wings: Response[];
    instincts: Response[];
    narrative: string[];
  };
  
  // Intermediate results
  typeScores: Record<string, number>;
  discriminatorPairs?: Array<[number, number]>;
  
  // Final results
  finalProfile?: EnneagramProfile;
  completedAt?: Date;
}
```

### Assessment Flow Types

```typescript
type AssessmentStage = 
  | 'screener' 
  | 'discriminators' 
  | 'wings' 
  | 'instincts' 
  | 'narrative' 
  | 'complete';

interface StageTransition {
  from: AssessmentStage;
  to: AssessmentStage;
  condition: (session: EnneagramSession) => boolean;
}

interface AssessmentResponse {
  questionId: string;
  value: number | string | number[];
  timestamp: Date;
  responseTime?: number; // milliseconds
}
```

### Scoring and Analysis

```typescript
// Scoring configuration
interface ScoringConfig {
  algorithm: 'simple' | 'weighted' | 'ipsative' | 'adaptive';
  normalization: boolean;
  considerResponseTime: boolean;
  minConfidence: number;
}

// Type discrimination
interface DiscriminatorResult {
  types: [number, number];
  winner: number;
  confidence: number;
  decisiveQuestions: string[];
}

// Wing calculation
interface WingAnalysis {
  primaryType: number;
  leftWing: number;
  rightWing: number;
  dominantWing: number | null;
  balance: number; // -1 to 1
}

// Health level estimation
interface HealthLevelEstimate {
  level: number;
  confidence: number;
  indicators: string[];
  recommendations: string[];
}
```

## Event System

```typescript
// Assessment events
interface AssessmentEvent {
  type: string;
  sessionId: string;
  timestamp: Date;
  data: any;
}

interface AssessmentStarted extends AssessmentEvent {
  type: 'assessment.started';
  data: {
    userId?: string;
    locale: string;
  };
}

interface StageCompleted extends AssessmentEvent {
  type: 'stage.completed';
  data: {
    stage: AssessmentStage;
    responses: number;
    nextStage: AssessmentStage;
  };
}

interface TypeDetermined extends AssessmentEvent {
  type: 'type.determined';
  data: {
    primaryType: number;
    confidence: number;
    closeTypes: number[];
  };
}

interface AssessmentCompleted extends AssessmentEvent {
  type: 'assessment.completed';
  data: {
    profile: EnneagramProfile;
    duration: number;
  };
}
```

## Integration Interfaces

### With StrengthDiscovery Module

```typescript
interface EnneagramStrengthCorrelation {
  enneagramType: number;
  strengths: Array<{
    strengthId: string;
    correlationScore: number;
    explanation: string;
  }>;
  typeSpecificStrengths: string[];
}
```

### With Database

```typescript
interface EnneagramRepository {
  // Sessions
  createSession(userId?: string): Promise<EnneagramSession>;
  getSession(sessionId: string): Promise<EnneagramSession | null>;
  updateSession(sessionId: string, data: Partial<EnneagramSession>): Promise<void>;
  
  // Profiles
  saveProfile(profile: EnneagramProfile): Promise<void>;
  getUserProfiles(userId: string): Promise<EnneagramProfile[]>;
  getLatestProfile(userId: string): Promise<EnneagramProfile | null>;
  
  // Questions
  getQuestions(stage: AssessmentStage, locale: string): Promise<EnneagramQuestion[]>;
  getDiscriminatorQuestions(types: number[]): Promise<EnneagramQuestion[]>;
  
  // Analytics
  getTypeDistribution(): Promise<Record<string, number>>;
  getCommonTritypes(): Promise<Array<{ tritype: string; count: number }>>;
}
```

### With Visualization Components

```typescript
interface EnneagramVisualizationData {
  // Type wheel
  typeWheel: {
    types: Array<{
      number: number;
      score: number;
      isPrimary: boolean;
      isWing: boolean;
    }>;
    connections: Array<{
      from: number;
      to: number;
      type: 'stress' | 'growth';
    }>;
  };
  
  // Instinctual stack
  instinctualStack: {
    dominant: InstinctualVariant;
    secondary: InstinctualVariant;
    tertiary: InstinctualVariant;
  };
  
  // Centers of intelligence
  centers: {
    body: number;
    heart: number;
    head: number;
  };
}
```

## WebSocket/Real-time Interfaces

```typescript
interface EnneagramWebSocket {
  // Client -> Server
  startAssessment(locale: string): void;
  submitResponse(response: AssessmentResponse): void;
  requestHint(questionId: string): void;
  
  // Server -> Client  
  onQuestionReady(callback: (question: EnneagramQuestion) => void): void;
  onProgressUpdate(callback: (progress: number) => void): void;
  onStageComplete(callback: (stage: AssessmentStage) => void): void;
  onResultsReady(callback: (profile: EnneagramProfile) => void): void;
}
```

## Configuration

```typescript
interface EnneagramModuleConfig {
  assessment: {
    minQuestionsPerStage: Record<AssessmentStage, number>;
    maxQuestionsPerStage: Record<AssessmentStage, number>;
    adaptiveQuestioning: boolean;
    allowSkip: boolean;
    sessionTimeout: number; // minutes
  };
  
  scoring: {
    algorithm: ScoringConfig;
    confidenceThreshold: number;
    requireDiscriminators: boolean;
    considerInstincts: boolean;
  };
  
  localization: {
    supportedLocales: string[];
    defaultLocale: string;
  };
  
  export: {
    formats: ('json' | 'pdf' | 'html')[];
    includeSensitiveData: boolean;
    watermark: boolean;
  };
}
```