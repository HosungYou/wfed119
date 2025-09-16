# LifeCraft Technical Architecture

**Version:** 1.0  
**Last Updated:** September 9, 2025  
**Current Status:** 65% Complete

---

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Next.js 15.5  │  React 19  │  TypeScript  │  Tailwind CSS  │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                         API Layer                            │
├─────────────────────────────────────────────────────────────┤
│     Next.js API Routes    │    FastAPI (Python)             │
│  /api/chat   │  /api/session  │  /api/rag  │  /api/embed   │
└─────────────────────────────────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                      ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│     Database Layer      │    │      AI Services        │
├─────────────────────────┤    ├─────────────────────────┤
│  PostgreSQL  │  Prisma  │    │ Claude │ GPT-4 │ Local │
│   Sessions   │  Schema  │    │  API   │  API  │ Models│
└─────────────────────────┘    └─────────────────────────┘
                    ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│                      RAG Pipeline                            │
├─────────────────────────────────────────────────────────────┤
│  Document Ingestion → Embeddings → Vector DB → Retrieval    │
│    PDF/DOCX/TXT    →  OpenAI/Local → Qdrant  → Semantic    │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
lifecraft-bot/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API endpoints
│   │   │   ├── chat/           # Chat functionality
│   │   │   ├── enneagram/      # Assessment APIs
│   │   │   ├── session/        # Session management
│   │   │   └── results/        # Results retrieval
│   │   ├── discover/           # Discovery page
│   │   └── results/            # Results visualization
│   ├── components/             # React components
│   │   ├── ChatInterface.tsx   # Main chat UI
│   │   ├── ui/                 # Reusable UI components
│   │   └── visualization/      # Charts & graphs
│   └── lib/                    # Utilities & helpers
│       ├── ai/                 # AI service integrations
│       ├── db/                 # Database utilities
│       └── rag/                # RAG pipeline (pending)
├── prisma/
│   ├── schema.prisma           # SQLite schema
│   └── schema.postgres.prisma  # PostgreSQL schema
├── public/                     # Static assets
├── docs/                       # Documentation
└── scripts/                    # Deployment scripts
```

## 🔧 Technology Stack Details

### Frontend Technologies

| Component | Technology | Version | Status | Purpose |
|-----------|------------|---------|--------|---------|
| Framework | Next.js | 15.5.0 | ✅ Active | React framework with SSR/SSG |
| UI Library | React | 19.1.0 | ✅ Active | Component library |
| Language | TypeScript | 5.x | ✅ Active | Type safety |
| Styling | Tailwind CSS | 4.0 | ✅ Active | Utility-first CSS |
| Animation | Framer Motion | 12.23 | ✅ Active | Smooth animations |
| Charts | Chart.js, D3, Recharts | Latest | ✅ Active | Data visualization |
| Icons | Lucide React | 0.541 | ✅ Active | Icon library |
| Markdown | React Markdown | 10.1 | ✅ Active | Render markdown |

### Backend Technologies

| Component | Technology | Version | Status | Purpose |
|-----------|------------|---------|--------|---------|
| Runtime | Node.js | 18+ | ✅ Active | JavaScript runtime |
| API Routes | Next.js API | 15.5.0 | ✅ Active | Built-in API routes |
| ORM | Prisma | 6.14.0 | ✅ Active | Database ORM |
| Database | PostgreSQL | 15 | ✅ Ready | Production database |
| Database (Dev) | SQLite | 3 | ✅ Active | Development database |
| Session | Custom | - | ✅ Active | Session management |
| Validation | Zod | - | 🚧 Planned | Schema validation |

### AI & ML Stack

| Component | Technology | Status | Purpose |
|-----------|------------|--------|---------|
| LLM Primary | Claude (Anthropic) | ✅ Integrated | Main conversational AI |
| LLM Fallback | GPT-4 (OpenAI) | ✅ Integrated | Backup AI provider |
| Embeddings | OpenAI Ada-002 | 🚧 Pending | Document embeddings |
| Vector DB | Qdrant | ❌ Not Started | Semantic search |
| RAG Framework | LangChain | 🚧 Planned | RAG orchestration |
| Local Models | Ollama | 🚧 Planned | Privacy-first option |

## 🗄️ Database Schema

### Core Tables

```sql
-- Sessions: User interaction sessions
Session {
  id            String   @id
  sessionId     String   @unique
  currentStage  String
  conversations Conversation[]
  strengths     Strength[]
  completed     Boolean
}

-- Conversations: Chat history
Conversation {
  id        String
  sessionId String
  role      String    -- 'user' | 'assistant'
  content   String
  timestamp DateTime
  metadata  String?   -- JSON metadata
}

-- Strengths: Discovered user strengths
Strength {
  id         String
  sessionId  String
  category   String
  name       String
  evidence   String
  confidence Float    -- 0.0 to 1.0
}

-- EnneagramSession: Assessment data
EnneagramSession {
  id            String
  sessionId     String   @unique
  stage         String
  responses     Json     -- User answers
  typeScores    Json     -- Calculated scores
  primaryType   String?  -- 1-9
  wingEstimate  String?  -- e.g., "3w4"
  confidence    String?  -- 'low' | 'medium' | 'high'
}
```

## 🔄 API Endpoints

### Current Endpoints (✅ Implemented)

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/health` | GET | Health check | ✅ Working |
| `/api/chat` | POST | Send message | ✅ Working |
| `/api/chat/stream` | POST | Streaming chat | ✅ Working |
| `/api/session/[id]` | GET | Get session | ✅ Working |
| `/api/session/save` | POST | Save session | ✅ Working |
| `/api/enneagram/items` | GET | Get questions | ✅ Working |
| `/api/enneagram/answer` | POST | Submit answer | ✅ Working |
| `/api/enneagram/score` | POST | Calculate type | ✅ Working |
| `/api/results/[id]` | GET | Get results | ✅ Working |

### Pending Endpoints (🚧 To Build)

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/api/rag/ingest` | POST | Ingest documents | 🔴 High |
| `/api/rag/search` | POST | Semantic search | 🔴 High |
| `/api/auth/login` | POST | User login | 🟡 Medium |
| `/api/auth/register` | POST | User registration | 🟡 Medium |
| `/api/export/pdf` | GET | Export to PDF | 🟢 Low |

## 🚀 Deployment Architecture

### Development Environment
```yaml
Platform: Local
Database: SQLite
API Keys: Development tier
URL: http://localhost:3000
```

### Staging Environment
```yaml
Platform: Render/Vercel Preview
Database: PostgreSQL (Render)
API Keys: Development tier
URL: https://lifecraft-staging.onrender.com
```

### Production Environment
```yaml
Platform: Render/Vercel
Database: PostgreSQL (Render/Supabase)
API Keys: Production tier
CDN: Cloudflare
URL: https://lifecraft.ai (planned)
```

## 📊 Current Implementation Status

### Component Completion

| Component | Progress | Notes |
|-----------|----------|-------|
| Frontend UI | 85% | Missing mobile optimization |
| API Endpoints | 70% | Core features complete |
| Database | 80% | Schema ready, migrations pending |
| Authentication | 20% | Basic session only |
| RAG Pipeline | 0% | Not started - CRITICAL |
| Testing | 10% | Minimal coverage |
| Documentation | 40% | Basic docs available |
| Deployment | 50% | Scripts ready, build issues |

## 🔐 Security Considerations

### Implemented
- Environment variable management
- Session-based access control
- Input sanitization (basic)
- HTTPS in production

### Pending
- JWT authentication
- Rate limiting
- API key rotation
- Data encryption at rest
- GDPR compliance
- SOC2 preparation

## 🎯 Performance Targets

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Page Load | < 2s | ~1.5s | ✅ Met |
| API Response | < 500ms | ~300ms | ✅ Met |
| Chat Response | < 3s | ~2s | ✅ Met |
| Build Time | < 5min | Timeout | ❌ Issue |
| Bundle Size | < 500KB | ~400KB | ✅ Met |
| Lighthouse Score | > 90 | 85 | 🟡 Close |

## 🛠️ Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run database migrations
npm run migrate:deploy:pg

# Build for production
npm run build:prod
```

### Git Workflow
```
main ──► staging ──► feature/xxx
         │            │
         ▼            ▼
     Production    Development
```

### Code Review Process
1. Create feature branch
2. Implement changes
3. Run tests locally
4. Create pull request
5. Code review by lead
6. Merge to staging
7. Test in staging
8. Merge to main
9. Auto-deploy to production

## 📈 Monitoring & Analytics

### Planned Integration
- **Error Tracking:** Sentry
- **Analytics:** Google Analytics 4
- **Performance:** New Relic
- **Uptime:** Pingdom
- **Logs:** LogRocket

## 🔄 CI/CD Pipeline

### GitHub Actions (Planned)
```yaml
- Lint code
- Run tests
- Build application
- Deploy to staging
- Run E2E tests
- Deploy to production
```

## 📚 Related Documents

- [Deployment Guide](../lifecraft-bot/DEPLOYMENT_GUIDE.md)
- [Deployment Status](../lifecraft-bot/DEPLOYMENT_STATUS.md)
- [API Documentation](./docs/api-reference.md)
- [Database Migrations](./prisma/migrations/)

---

**Questions?** This architecture is designed for scalability, maintainability, and rapid iteration.