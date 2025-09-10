# WFED119 Project Structure

## 📁 Organized Repository Structure

```
/Volumes/External SSD/Projects/Research/WFED119/
└── lifecraft-bot/                    # Main application directory
    ├── 📄 README.md                  # Comprehensive project overview
    ├── 📄 RELEASE_NOTES.md           # v2.0.0 release documentation
    ├── 📄 UPGRADE_NOTES.md           # Upgrade instructions and changes
    ├── 📄 LICENSE                    # MIT license
    ├── 📄 package.json               # Dependencies and scripts
    ├── 📄 tsconfig.json              # TypeScript configuration
    ├── 📄 next.config.js             # Next.js configuration
    ├── 📄 Dockerfile                 # Container deployment
    ├── 
    ├── 📁 src/                       # Source code
    │   ├── 📁 app/                   # Next.js App Router
    │   │   ├── 📄 page.tsx           # Main application page
    │   │   ├── 📄 layout.tsx         # Application layout
    │   │   ├── 📄 globals.css        # Global styles
    │   │   └── 📁 api/               # API endpoints
    │   │       ├── 📁 chat/          # Chat completion endpoints
    │   │       │   ├── 📄 route.ts   # Synchronous chat API
    │   │       │   └── 📁 stream/    
    │   │       │       └── 📄 route.ts # Streaming chat API
    │   │       ├── 📁 session/       # Session management
    │   │       │   ├── 📁 [sessionId]/
    │   │       │   │   └── 📄 route.ts # Get session data
    │   │       │   └── 📁 save/
    │   │       │       └── 📄 route.ts # Save session data
    │   │       └── 📁 health/
    │   │           └── 📄 route.ts   # Health check endpoint
    │   │
    │   ├── 📁 components/            # React components
    │   │   ├── 📄 ChatInterface.tsx  # Main chat interface
    │   │   ├── 📁 ui/                # Reusable UI components
    │   │   │   └── 📄 ProgressIndicator.tsx
    │   │   └── 📁 visualization/     # Chart components
    │   │       ├── 📄 StrengthRadarChart.tsx  # 🆕 Interactive zoomable chart
    │   │       ├── 📄 StrengthHexagon.tsx     # Hexagon visualization
    │   │       └── 📄 StrengthMindMap.tsx     # Mind map visualization
    │   │
    │   └── 📁 lib/                   # Core business logic
    │       ├── 📄 prisma.ts          # Database client
    │       ├── 📁 services/          # AI and business services
    │       │   ├── 📄 aiServiceClaude.ts     # 🆕 Enhanced Claude API service
    │       │   └── 📄 aiService.ts           # Legacy OpenAI service
    │       ├── 📁 prompts/           # AI prompt engineering
    │       │   ├── 📄 enhancedSystemPrompt.ts # 🆕 Advanced validation prompts
    │       │   ├── 📄 systemPrompt.ts        # Original prompts
    │       │   └── 📄 questionBank.ts        # Question templates
    │       └── 📁 store/             # State management
    │           └── 📄 sessionStore.ts # Application state
    │
    ├── 📁 docs/                      # 📚 Project documentation
    │   ├── 📄 API_REFERENCE.md       # 🆕 Complete API documentation
    │   ├── 📄 CHANGELOG.md           # 🆕 Version history and changes
    │   ├── 📄 lifecraft_bot_architecture.md # Technical architecture
    │   ├── 📄 strength_discovery_conversation_flow.md # Conversation logic
    │   ├── 📄 development_plan_message.md # Development roadmap
    │   └── 📄 DEPLOYMENT_ERROR_LOG.md # Production deployment notes
    │
    ├── 📁 backup/                    # 🔒 Original implementation backup
    │   └── 📁 openai/               # OpenAI-based implementation
    │       ├── 📄 aiService.ts       # Original AI service
    │       └── 📄 systemPrompt.ts    # Original prompts
    │
    ├── 📁 resources/                 # 📚 Course materials and references
    │   ├── 📁 materials/            # LifeCraft methodology materials
    │   │   └── 📁 split_LifeCraft_4parts/
    │   │       ├── 📄 LifeCraft_part01a_p1-50.pdf
    │   │       ├── 📄 LifeCraft_part01b_p51-100.pdf
    │   │       ├── 📄 LifeCraft_part02a_p101-113.pdf
    │   │       └── 📄 LifeCraft_part02b_p114-125.pdf
    │   └── 📁 references/           # Academic references
    │       └── 📄 Syllabus_WFED_119_Career Planning and Life Design_Fall 2025.pdf
    │
    ├── 📁 prisma/                    # Database schema and migrations
    │   └── 📄 schema.prisma          # Database schema definition
    │
    ├── 📁 public/                    # Static assets
    │   ├── 📄 next.svg               # Next.js logo
    │   ├── 📄 vercel.svg             # Vercel logo
    │   └── 📄 *.svg                  # Other static assets
    │
    └── 📁 node_modules/              # Dependencies (not in version control)
```

## 🏗️ Architecture Overview

### 🎯 Core Application
- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Styling**: Tailwind CSS 4 with responsive design
- **State Management**: Zustand with persistent storage
- **Database**: Prisma ORM with SQLite

### 🤖 AI Services Layer
```
Primary:   Claude 3 Haiku (Cost-optimized)
           ↓ (on failure)
Fallback:  OpenAI GPT-4 (High reliability)
           ↓ (on failure)  
Error:     Graceful degradation with user notification
```

### 📊 Visualization Stack
- **Chart.js 4.5**: Interactive radar charts with zoom
- **Recharts**: Hexagon and mind map visualizations
- **D3.js**: Advanced data transformations
- **Framer Motion**: Smooth animations and transitions

## 🆕 Version 2.0 Key Additions

### 🔧 Enhanced AI Integration
- **aiServiceClaude.ts**: Advanced Claude API integration
- **enhancedSystemPrompt.ts**: Multi-layer response validation
- **Smart Fallback**: Automatic OpenAI backup system

### 📊 Interactive Components  
- **StrengthRadarChart.tsx**: Zoomable charts with Chart.js
- **Real-time Updates**: Instant chart synchronization
- **User Controls**: Zoom, pan, reset, and deletion features

### 📚 Comprehensive Documentation
- **API_REFERENCE.md**: Complete endpoint documentation
- **CHANGELOG.md**: Detailed version history
- **RELEASE_NOTES.md**: Feature demonstrations and guides

## 📋 File Categories

### 🔑 Core Application Files
| File | Purpose | Status |
|------|---------|---------|
| `src/app/page.tsx` | Main application entry point | ✅ Updated |
| `src/components/ChatInterface.tsx` | Primary user interface | ✅ Enhanced |
| `src/lib/services/aiServiceClaude.ts` | AI service integration | 🆕 New |
| `src/lib/store/sessionStore.ts` | State management | ✅ Updated |

### 📊 Visualization Components
| File | Purpose | Status |
|------|---------|---------|
| `StrengthRadarChart.tsx` | Interactive zoomable chart | 🆕 New |
| `StrengthHexagon.tsx` | Hexagon strength visualization | ✅ Existing |
| `StrengthMindMap.tsx` | Mind map visualization | ✅ Existing |

### 🔧 Configuration Files
| File | Purpose | Status |
|------|---------|---------|
| `package.json` | Dependencies and scripts | ✅ Updated |
| `tsconfig.json` | TypeScript configuration | ✅ Current |
| `next.config.js` | Next.js configuration | ✅ Current |
| `prisma/schema.prisma` | Database schema | ✅ Current |

### 📚 Documentation Files
| File | Purpose | Status |
|------|---------|---------|
| `README.md` | Project overview | ✅ Rewritten |
| `RELEASE_NOTES.md` | v2.0 release information | 🆕 New |
| `docs/API_REFERENCE.md` | API documentation | 🆕 New |
| `docs/CHANGELOG.md` | Version history | 🆕 New |

## 🔄 Development Workflow

### 🚀 Quick Start Commands
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production  
npm run start        # Start production server

# Database
npx prisma generate  # Generate database client
npx prisma db push   # Apply schema changes

# Quality
npm run lint         # Run linting
npm run typecheck    # TypeScript validation
```

### 🧪 Testing Structure
```
tests/ (planned)
├── unit/            # Component unit tests
├── integration/     # API integration tests  
├── e2e/            # End-to-end scenarios
└── mocks/          # Mock data and services
```

## 🎯 Deployment Structure

### 🌐 Production Environment
- **Primary**: Vercel/Render deployment
- **Database**: Hosted SQLite/PostgreSQL
- **CDN**: Static asset optimization
- **Monitoring**: Health checks and error tracking

### 🔒 Security Considerations
- **API Keys**: Environment variable management
- **CORS**: Proper cross-origin configuration
- **Input Validation**: Server-side request validation
- **Rate Limiting**: API endpoint protection

## 📈 Scalability Design

### 🔧 Modular Architecture
- **Component Isolation**: Independent, reusable components  
- **Service Separation**: AI, database, and business logic layers
- **API Versioning**: Future-ready endpoint design
- **State Management**: Scalable Zustand patterns

### 📊 Performance Optimization
- **Code Splitting**: Dynamic imports and lazy loading
- **Bundle Analysis**: Optimized dependency management
- **Caching Strategy**: Intelligent data and response caching
- **CDN Integration**: Static asset delivery optimization

---

## 🎉 Summary

This reorganized structure provides:

✅ **Clean Architecture**: Logical separation of concerns  
✅ **Comprehensive Documentation**: Complete guides and references  
✅ **Version Control**: Proper Git history with detailed commits  
✅ **Production Ready**: Optimized build and deployment configuration  
✅ **Future Scalable**: Extensible design for continued development  

The WFED119 LifeCraft Bot v2.0 is now a professional, well-documented, and production-ready educational technology platform suitable for academic and commercial deployment.

---

*Structure documented by: WFED 119 Development Team*  
*Date: January 27, 2025*  
*Version: 2.0.0*