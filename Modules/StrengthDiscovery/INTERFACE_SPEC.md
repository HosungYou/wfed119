# StrengthDiscovery Interface Specification

## API Endpoints

### Assessment Endpoints

#### POST /api/strength/assessment/start
Initiates a new strength assessment session.

**Request:**
```json
{
  "userId": "string",
  "assessmentType": "quick" | "comprehensive" | "focused",
  "locale": "en" | "ko"
}
```

**Response:**
```json
{
  "sessionId": "string",
  "assessmentId": "string",
  "firstQuestion": {
    "id": "string",
    "text": "string",
    "type": "scale" | "ranking" | "multiple_choice",
    "options": []
  }
}
```

#### POST /api/strength/assessment/answer
Submits an answer and receives the next question.

**Request:**
```json
{
  "sessionId": "string",
  "questionId": "string",
  "answer": "any",
  "timestamp": "ISO-8601"
}
```

**Response:**
```json
{
  "nextQuestion": {} | null,
  "progress": 0.75,
  "isComplete": false
}
```

#### GET /api/strength/assessment/results/:assessmentId
Retrieves assessment results.

**Response:**
```json
{
  "assessmentId": "string",
  "completedAt": "ISO-8601",
  "topStrengths": [
    {
      "rank": 1,
      "name": "Strategic Thinking",
      "category": "Thinking",
      "score": 95.5,
      "confidence": 0.92,
      "description": "string"
    }
  ],
  "strengthProfile": {
    "thinking": [],
    "executing": [],
    "influencing": [],
    "relationship": []
  },
  "insights": []
}
```

### Profile Endpoints

#### GET /api/strength/profile/:userId
Retrieves user's current strength profile.

**Response:**
```json
{
  "userId": "string",
  "profile": {
    "lastUpdated": "ISO-8601",
    "topStrengths": [],
    "developingStrengths": [],
    "hiddenStrengths": []
  },
  "history": [],
  "recommendations": []
}
```

#### POST /api/strength/profile/compare
Compares strength profiles between users or teams.

**Request:**
```json
{
  "userIds": ["string"],
  "comparisonType": "complementary" | "similar" | "gap"
}
```

### Insights Endpoints

#### GET /api/strength/insights/:userId
Retrieves personalized strength insights.

**Response:**
```json
{
  "daily": {
    "tip": "string",
    "challenge": "string",
    "affirmation": "string"
  },
  "weekly": {
    "focusArea": "string",
    "exercises": []
  },
  "trends": []
}
```

## Data Models

### Core Entities

```typescript
// Strength Definition
interface Strength {
  id: string;
  name: string;
  category: StrengthCategory;
  description: string;
  behaviors: string[];
  edges: {
    overuse: string;
    underuse: string;
  };
  development: {
    exercises: string[];
    resources: string[];
  };
}

// Strength Categories (Gallup-inspired)
enum StrengthCategory {
  EXECUTING = "executing",
  INFLUENCING = "influencing",
  RELATIONSHIP = "relationship",
  STRATEGIC_THINKING = "thinking"
}

// User Strength Assessment
interface StrengthAssessment {
  id: string;
  userId: string;
  completedAt: Date;
  responses: AssessmentResponse[];
  results: AssessmentResult;
  version: string;
}

// Assessment Response
interface AssessmentResponse {
  questionId: string;
  answer: any;
  responseTime: number;
  confidence?: number;
}

// Assessment Result
interface AssessmentResult {
  topStrengths: RankedStrength[];
  strengthScores: Map<string, number>;
  confidenceLevel: number;
  profileType: string;
}

// Ranked Strength
interface RankedStrength {
  strength: Strength;
  rank: number;
  score: number;
  confidence: number;
  percentile?: number;
}
```

### Visualization Data Formats

```typescript
// Radar Chart Data
interface RadarChartData {
  labels: string[];
  datasets: [{
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
  }];
}

// Hexagon Data
interface HexagonData {
  vertices: [{
    label: string;
    value: number;
    category: string;
    color: string;
  }];
  center: {
    x: number;
    y: number;
  };
}

// Mind Map Data
interface MindMapData {
  name: string;
  children: [{
    name: string;
    value: number;
    children?: MindMapData[];
  }];
}
```

## Event System

### Events Emitted

```typescript
// Assessment Events
interface AssessmentStarted {
  type: 'assessment.started';
  payload: {
    userId: string;
    assessmentId: string;
    timestamp: Date;
  };
}

interface AssessmentCompleted {
  type: 'assessment.completed';
  payload: {
    userId: string;
    assessmentId: string;
    results: AssessmentResult;
  };
}

// Profile Events
interface ProfileUpdated {
  type: 'profile.updated';
  payload: {
    userId: string;
    changes: string[];
    timestamp: Date;
  };
}

// Insight Events
interface InsightGenerated {
  type: 'insight.generated';
  payload: {
    userId: string;
    insightType: string;
    content: any;
  };
}
```

## Integration Interfaces

### With Enneagram Module

```typescript
interface StrengthEnneagramCorrelation {
  strengthId: string;
  enneagramType: number;
  correlationScore: number;
  sharedTraits: string[];
}
```

### With Chat Interface

```typescript
interface StrengthChatContext {
  currentStrengths: RankedStrength[];
  conversationStage: 'discovery' | 'exploration' | 'development';
  userPreferences: {
    visualizationType: 'radar' | 'hexagon' | 'mindmap';
    detailLevel: 'summary' | 'detailed';
  };
}
```

### With Database

```typescript
interface StrengthRepository {
  // User Strengths
  getUserStrengths(userId: string): Promise<RankedStrength[]>;
  saveAssessment(assessment: StrengthAssessment): Promise<void>;
  
  // Strength Catalog
  getStrengthById(id: string): Promise<Strength>;
  getStrengthsByCategory(category: StrengthCategory): Promise<Strength[]>;
  
  // Analytics
  getStrengthDistribution(): Promise<Map<string, number>>;
  getCommonStrengthPairs(): Promise<Array<[string, string, number]>>;
}
```

## WebSocket/Real-time Interfaces

```typescript
// Real-time strength updates
interface StrengthWebSocket {
  // Client -> Server
  subscribe(userId: string): void;
  unsubscribe(userId: string): void;
  
  // Server -> Client
  onStrengthUpdate(callback: (data: RankedStrength[]) => void): void;
  onInsightAvailable(callback: (insight: any) => void): void;
  onPeerComparison(callback: (comparison: any) => void): void;
}
```

## Error Handling

```typescript
// Strength-specific errors
class StrengthAssessmentError extends Error {
  code: 'INCOMPLETE_ASSESSMENT' | 'INVALID_RESPONSE' | 'SESSION_EXPIRED';
  details: any;
}

class StrengthProfileError extends Error {
  code: 'PROFILE_NOT_FOUND' | 'INSUFFICIENT_DATA' | 'CALCULATION_ERROR';
  details: any;
}
```

## Configuration Interface

```typescript
interface StrengthModuleConfig {
  assessment: {
    questionCount: number;
    timeLimit?: number;
    adaptiveMode: boolean;
  };
  scoring: {
    algorithm: 'simple' | 'weighted' | 'ml-based';
    normalization: boolean;
    populationComparison: boolean;
  };
  visualization: {
    defaultType: 'radar' | 'hexagon' | 'mindmap';
    colorScheme: string[];
    animations: boolean;
  };
  storage: {
    cacheEnabled: boolean;
    cacheTTL: number;
    compressionEnabled: boolean;
  };
}
```