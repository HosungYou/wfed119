# API Reference

LifeCraft Bot v2.0 API documentation for developers and integrators.

## Base URL

```
Local Development: http://localhost:3000
Production: https://your-domain.com
```

## Authentication

All API endpoints use server-side authentication with API keys configured via environment variables.

## Endpoints

### Chat API

#### POST `/api/chat`

Create a synchronous chat completion.

**Request Body:**
```typescript
{
  sessionId: string;          // Unique session identifier
  messages: ChatMessage[];    // Conversation history
  stage: SessionStage;        // Current conversation stage
  context?: SessionContext;   // Additional context data
}
```

**Response:**
```typescript
{
  message: string;           // AI-generated response
  newStage?: SessionStage;   // Updated conversation stage
  shouldAnalyze: boolean;    // Whether to trigger strength analysis
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "sess_123",
    "messages": [
      {
        "role": "user",
        "content": "I led a team project last semester that really energized me.",
        "timestamp": "2025-01-27T10:00:00Z"
      }
    ],
    "stage": "exploration"
  }'
```

#### POST `/api/chat/stream`

Create a streaming chat completion for real-time responses.

**Request Body:** Same as `/api/chat`

**Response:** Server-Sent Events stream
```
data: {"chunk": "I'd love to hear more"}
data: {"chunk": " about that experience."}
data: {"chunk": " What specifically energized you?"}
data: {"done": true}
```

### Session Management

#### GET `/api/session/[sessionId]`

Retrieve session data including conversation history and analysis results.

**Parameters:**
- `sessionId` (string): Session identifier

**Response:**
```typescript
{
  id: string;
  messages: ChatMessage[];
  stage: SessionStage;
  strengths: StrengthAnalysis;
  createdAt: string;
  updatedAt: string;
  metadata?: object;
}
```

#### POST `/api/session/save`

Save or update session data.

**Request Body:**
```typescript
{
  sessionId: string;
  messages: ChatMessage[];
  strengths: StrengthAnalysis;
  stage: SessionStage;
  metadata?: object;
}
```

**Response:**
```typescript
{
  success: boolean;
  sessionId: string;
  message: string;
}
```

### Health Check

#### GET `/api/health`

Check API availability and AI service status.

**Response:**
```typescript
{
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: {
    claude: "available" | "unavailable";
    openai: "available" | "unavailable";
    database: "connected" | "disconnected";
  };
  version: string;
}
```

## Data Types

### ChatMessage
```typescript
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}
```

### SessionStage
```typescript
type SessionStage = 'initial' | 'exploration' | 'deepening' | 'analysis' | 'summary';
```

### SessionContext
```typescript
interface SessionContext {
  stage: SessionStage;
  messageCount: number;
  extractedThemes?: string[];
  invalidResponseCount?: number;
}
```

### StrengthAnalysis
```typescript
interface StrengthAnalysis {
  skills: string[];        // Identified competencies
  attitudes: string[];     // Behavioral patterns
  values: string[];        // Core principles
  invalid?: boolean;       // Validation flag
  reason?: string;         // Validation failure reason
}
```

### ResponseValidation
```typescript
interface ResponseValidation {
  isValid: boolean;
  reason?: string;
  shouldRedirect: boolean;
  redirectMessage?: string;
}
```

## AI Service Integration

### Claude API Configuration

The primary AI service uses Anthropic's Claude 3 Haiku model:

```typescript
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const response = await anthropic.messages.create({
  model: "claude-3-haiku-20240307",
  messages: conversationHistory,
  system: enhancedSystemPrompt,
  max_tokens: 600,
  temperature: 0.7,
});
```

### OpenAI Fallback

When Claude is unavailable, the system automatically falls back to OpenAI:

```typescript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: conversationHistory,
  temperature: 0.7,
  max_completion_tokens: 600,
});
```

## Response Validation System

### Validation Pipeline

1. **Length Validation**: Minimum 30 characters of meaningful content
2. **Pattern Detection**: Identifies questions, deflection, off-topic responses
3. **Context Analysis**: Ensures responses align with current conversation stage
4. **Quality Assessment**: Validates educational value and relevance

### Validation Examples

**Valid Response:**
```typescript
{
  isValid: true,
  shouldRedirect: false
}
```

**Invalid Response - Too Short:**
```typescript
{
  isValid: false,
  reason: "Response too short",
  shouldRedirect: true,
  redirectMessage: "Could you tell me more about that experience? I'm interested in hearing the details of what you did and how it made you feel."
}
```

**Invalid Response - User Asking Questions:**
```typescript
{
  isValid: false,
  reason: "User asking questions instead of sharing",
  shouldRedirect: true,
  redirectMessage: "Your curiosity is wonderful! But first, I'd love to learn about YOUR experiences. Think of a specific time when you worked on something engaging. What was that like?"
}
```

## Error Handling

### Standard Error Response
```typescript
{
  error: string;           // Error message
  code: string;            // Error code
  details?: object;        // Additional error details
  timestamp: string;       // Error occurrence time
}
```

### Common Error Codes

- `INVALID_SESSION`: Session not found or invalid
- `AI_SERVICE_ERROR`: AI service unavailable or failed
- `VALIDATION_ERROR`: Request validation failed
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Unexpected server error

### Rate Limiting

API endpoints are rate-limited to prevent abuse:

- Chat endpoints: 30 requests/minute per session
- Session endpoints: 60 requests/minute per IP
- Health check: 120 requests/minute per IP

## SDK Usage Examples

### Node.js Client

```typescript
import axios from 'axios';

class LifeCraftClient {
  constructor(private baseURL: string) {}
  
  async sendMessage(sessionId: string, message: string, stage: SessionStage) {
    const response = await axios.post(`${this.baseURL}/api/chat`, {
      sessionId,
      messages: [{ role: 'user', content: message }],
      stage
    });
    
    return response.data;
  }
  
  async getSession(sessionId: string) {
    const response = await axios.get(`${this.baseURL}/api/session/${sessionId}`);
    return response.data;
  }
}

// Usage
const client = new LifeCraftClient('http://localhost:3000');
const result = await client.sendMessage('sess_123', 'My story...', 'exploration');
```

### JavaScript Fetch API

```javascript
// Send message
async function sendMessage(sessionId, content, stage) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId,
      messages: [{ role: 'user', content }],
      stage
    })
  });
  
  return await response.json();
}

// Stream response
async function streamChat(sessionId, content, stage) {
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId,
      messages: [{ role: 'user', content }],
      stage
    })
  });
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        if (data.chunk) {
          console.log(data.chunk);
        }
      }
    }
  }
}
```

## Webhook Support

### Session Events

Configure webhooks to receive notifications about session events:

```typescript
// Webhook payload for session completion
{
  event: "session.completed";
  sessionId: string;
  stage: "summary";
  strengths: StrengthAnalysis;
  timestamp: string;
}
```

### Configuration

Set webhook URL in environment variables:
```env
WEBHOOK_URL=https://your-app.com/webhooks/lifecraft
WEBHOOK_SECRET=your_webhook_secret
```

## Performance Considerations

### Caching Strategy

- Conversation context cached for 1 hour
- AI responses cached for 24 hours for identical inputs
- Session data cached for 7 days

### Optimization Tips

1. **Batch Requests**: Combine multiple operations when possible
2. **Stream for Long Responses**: Use streaming for better UX
3. **Cache Session Data**: Store session data locally to reduce API calls
4. **Implement Retry Logic**: Handle transient failures gracefully

### Cost Optimization

- Claude 3 Haiku: ~$0.25-1.25 per 1M tokens
- Response caching reduces duplicate API calls
- Smart fallback minimizes expensive OpenAI usage
- Token optimization in prompts reduces costs

## Development & Testing

### Local Development Setup

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Add your API keys

# Start development server
npm run dev

# Run tests
npm test
```

### API Testing

Use the provided test suite:

```bash
# Unit tests
npm run test:unit

# Integration tests  
npm run test:integration

# E2E tests
npm run test:e2e
```

### Mock Data

For testing, use the provided mock responses:

```typescript
import { mockSessionData, mockChatResponse } from '@/lib/test/mocks';

// Use in tests
const response = await request(app)
  .post('/api/chat')
  .send(mockSessionData);
```

---

## Support

For API questions or issues:

- **Documentation**: Check additional guides in `/docs`
- **Examples**: See `/examples` folder for complete implementations  
- **Issues**: Report bugs via GitHub Issues
- **Contact**: Reach out to the development team

---

**Last Updated**: January 27, 2025  
**API Version**: 2.0.0