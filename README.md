# LifeCraft Bot

An AI-powered career coaching assistant designed for WFED 119 (Career Planning and Life Design) that helps students discover their professional strengths through guided storytelling conversations using advanced prompt engineering techniques.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=flat&logo=Prisma&logoColor=white)](https://www.prisma.io/)

## 📖 Overview

LifeCraft Bot is a conversational AI system built on the principles of **Socratic questioning** and **narrative-based strength discovery**. The system guides students through structured conversations to uncover their natural talents, skills, attitudes, and values through meaningful work experiences.

### 🎯 Educational Context
- **Course**: WFED 119 - Career Planning and Life Design
- **Methodology**: LifeCraft strength-based career development
- **Approach**: Evidence-based strength identification through storytelling

## ✨ Core Features

### 🧠 Conversational AI Engine
- **Multi-stage conversation flow**: 5 distinct phases with intelligent progression
- **Socratic questioning methodology** for self-discovery
- **Context-aware responses** that build on previous interactions
- **Evidence-based analysis** of user narratives

### 📊 Strength Visualization
- **Interactive radar charts** displaying strength profiles
- **Real-time data visualization** with Chart.js integration
- **Categorized strength mapping**: Skills, Attitudes, Values

### 🎯 Values Discovery System
- **Interactive drag-and-drop interface** for values categorization
- **Multiple value sets**: Terminal, Instrumental, and Work values
- **Position-based scoring** and priority ranking
- **Export functionality** for personal use

## 👥 Collaborator Setup

This project welcomes backend and database developers. Current collaborators have write access to contribute to database management and API development.

### Quick Start for Collaborators
```bash
# Clone and setup
git clone https://github.com/HosungYou/wfed119.git
cd wfed119
npm run setup:collaborator

# Start development
npm run dev
```

### Available Collaborator Commands
- `npm run setup:collaborator` - Complete environment setup
- `npm run db:studio` - Open database management GUI
- `npm run admin:setup` - Setup admin roles
- `npm run db:reset` - Reset database (development only)

**📋 See [COLLABORATOR_SETUP.md](COLLABORATOR_SETUP.md) for detailed instructions**

### Current Team
- **HosungYou** (Owner) - Project lead
- **Cloudhoppr** - Backend developer
- **AlrJohn** - Backend developer
- **JohnAR17** - Backend developer

### 🎨 User Experience
- **Responsive design** optimized for various devices
- **Export functionality** for student portfolios  
- **Intuitive conversation interface** with clear progression indicators
- **Session persistence** to resume conversations
- **Accessibility features** for inclusive design

## 🤖 Prompt Engineering Architecture

### Conversation Flow Design
LifeCraft Bot employs a sophisticated **5-stage conversation methodology** based on Socratic questioning principles:

#### Stage 1: Initial (Opening Question)
```
Objective: Establish rapport and elicit a meaningful work story
Technique: Open-ended invitation with specific emotional anchor
Example: "Tell me about a time when you felt really satisfied with work you were doing. What happened?"
```

#### Stage 2: Exploration (First Follow-up)
```
Objective: Dive deeper into the specific experience
Technique: Reflective acknowledgment + targeted inquiry
Example: "What specifically about that [referenced work] felt meaningful to you?"
```

#### Stage 3: Deepening (Deeper Inquiry)
```
Objective: Uncover underlying motivations and patterns
Technique: Emotional exploration + skill identification
Example: "What did you feel in that moment?" or "Can you tell me about another similar experience?"
```

#### Stage 4: Analysis (Pattern Recognition)
```
Objective: Connect experiences to broader career themes
Technique: Pattern identification + application exploration
Example: "How do these skills show up in other areas of your life?"
```

#### Stage 5: Summary (Comprehensive Report)
```
Objective: Synthesize insights into actionable career guidance
Technique: Structured analysis with Skills/Attitudes/Values framework
Output: Comprehensive strength report with career connections
```

### AI System Prompt Structure

The core system prompt (`src/lib/prompts/systemPrompt.ts`) implements:

#### 🎯 Role Definition
- **Identity**: LifeCraft Career Coach specialized in strength discovery
- **Mission**: Guide students through structured conversation for strength identification
- **Approach**: Socratic questioning with evidence-based analysis

#### 📋 Conversation Guidelines
- **Warmth & Curiosity**: Maintain encouraging, genuinely interested tone
- **Specificity**: Use student's exact words in reflections
- **Focus**: One question per response to maintain conversation flow
- **Progression**: Clear stage-based advancement with quality gates

#### 🔍 Response Validation (v2.0 Enhancement)
- **Length Validation**: Minimum 30 characters for meaningful responses
- **Content Filtering**: Detect and redirect questions, off-topic responses
- **Pattern Recognition**: Identify deflection and avoidance behaviors
- **Quality Gates**: Ensure response quality before stage progression

### Prompt Engineering Principles

#### 1. **Contextual Awareness**
```typescript
// Example: Using student's exact language
"I heard you mention [student's exact words]. What specifically about that experience..."
```

#### 2. **Progressive Disclosure**
```typescript
// Gradual depth increase across stages
Stage 1: "What happened?" (broad narrative)
Stage 2: "What felt meaningful?" (emotional connection)  
Stage 3: "What did you feel?" (deeper emotional exploration)
Stage 4: "How does this apply elsewhere?" (pattern recognition)
```

#### 3. **Evidence-Based Analysis**
```typescript
// Strength extraction methodology
Skills: What they can DO (concrete abilities)
Attitudes: HOW they work (behavioral patterns)
Values: WHY they work (motivational drivers)
```

#### 4. **Adaptive Questioning**
```typescript
// Dynamic question generation based on context
if (skillsIdentified.length < 3) {
  askSkillExplorationQuestion();
} else if (valuesNotExplored) {
  askValueIdentificationQuestion();
}
```

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **AI Services**: Claude 3 Haiku (primary), OpenAI GPT-4 (fallback)
- **Database**: Prisma with SQLite
- **Charts**: Chart.js with zoom capabilities
- **State Management**: Zustand with persistence

### Project Structure
```
lifecraft-bot/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── api/               # API endpoints
│   │   │   ├── chat/         # Chat completion endpoints
│   │   │   ├── session/      # Session management
│   │   │   └── health/       # Health checks
│   │   └── page.tsx          # Main application page
│   ├── components/
│   │   ├── ChatInterface.tsx      # Main chat interface
│   │   ├── ui/                    # Reusable UI components
│   │   └── visualization/         # Chart components
│   │       ├── StrengthRadarChart.tsx  # Interactive zoomable chart
│   │       ├── StrengthHexagon.tsx     # Hexagon visualization
│   │       └── StrengthMindMap.tsx     # Mind map visualization
│   └── lib/
│       ├── services/
│       │   ├── aiServiceClaude.ts     # Enhanced Claude API service
│       │   └── aiService.ts           # Legacy OpenAI service
│       ├── prompts/
│       │   ├── enhancedSystemPrompt.ts # Advanced validation prompts
│       │   └── systemPrompt.ts        # Original prompts
│       └── store/
│           └── sessionStore.ts        # Application state management
├── docs/                      # Project documentation
├── backup/openai/            # Original OpenAI implementation backup
├── resources/                # Course materials and references
└── prisma/                   # Database schema and migrations
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm
- Anthropic API key (recommended) or OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lifecraft-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your API keys:
   ```env
   ANTHROPIC_API_KEY=your_claude_api_key_here
   OPENAI_API_KEY=your_openai_key_here  # Optional fallback
   ```

4. **Initialize database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000)

### Production Deployment

```bash
npm run build
npm start
```

## 💰 Cost Optimization

**Claude 3 Haiku vs OpenAI GPT-4 Cost Comparison:**
- **Claude Haiku**: $0.25/1M input, $1.25/1M output tokens
- **OpenAI GPT-4**: $0.50/1M input, $1.50/1M output tokens
- **Savings**: 30-50% cost reduction with intelligent fallback

## 🎯 Usage Guide

### For Students
1. **Start a conversation**: Click "Begin Discovery" to start your strength assessment
2. **Share your stories**: Describe meaningful work experiences when prompted
3. **Engage authentically**: Provide detailed, honest responses for better analysis
4. **Explore your visualization**: Use zoom controls to explore your strength profile
5. **Refine results**: Remove or adjust identified strengths as needed

### For Educators
- Access session analytics through the admin interface
- Export student progress reports
- Customize conversation prompts for specific courses
- Monitor engagement metrics

## 🔧 Configuration

### AI Service Configuration
The system automatically uses Claude 3 Haiku as the primary AI service with OpenAI as fallback:

```typescript
// Automatic service selection
if (anthropic) {
  // Use Claude 3 Haiku (cost-effective)
} else if (openai) {
  // Fallback to OpenAI GPT-4
} else {
  // Error: No AI service available
}
```

### Response Validation
The enhanced prompt system includes multi-layer validation:
- Minimum response length (30+ characters)
- Question pattern detection
- Off-topic response filtering
- Deflection/avoidance pattern recognition

## 📊 Features Deep Dive

### Interactive Charts
- **Zoom Controls**: Mouse wheel + Ctrl or button controls
- **Real-time Updates**: Immediate reflection of strength modifications
- **Export Options**: Save charts as images for portfolios

### Conversation Intelligence
- **Stage Progression**: Smart advancement based on response quality
- **Context Awareness**: References previous responses for deeper exploration
- **Adaptive Questioning**: Unique questions to avoid repetition

### Data Persistence
- **Session Management**: Automatic saving and restoration
- **Export Capabilities**: JSON/PDF export of complete sessions
- **Privacy Controls**: Local data storage with opt-in cloud sync

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Add tests for new features
- Update documentation for API changes
- Ensure accessibility compliance

## 📖 Documentation

- **[Architecture Guide](docs/lifecraft_bot_architecture.md)**: Technical architecture overview
- **[Conversation Flow](docs/strength_discovery_conversation_flow.md)**: Detailed conversation stages
- **[Development Plan](docs/development_plan_message.md)**: Development roadmap
- **[Deployment Guide](docs/DEPLOYMENT_ERROR_LOG.md)**: Production deployment notes
- **[Upgrade Notes](UPGRADE_NOTES.md)**: Version 2.0 upgrade details

## 🐛 Troubleshooting

### Common Issues

**Build Failures**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

**API Connection Issues**
- Verify API keys in `.env.local`
- Check API key permissions and quotas
- Ensure network connectivity

**Database Issues**
```bash
# Reset database
npx prisma db push --force-reset
npx prisma generate
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **WFED 119 Course**: Career Planning and Life Design foundations
- **LifeCraft Methodology**: Strength-based career development approach
- **Anthropic Claude**: Advanced AI conversation capabilities
- **Next.js Team**: Excellent React framework
- **Chart.js Community**: Interactive visualization tools

---

**Version**: 2.0.0  
**Last Updated**: January 27, 2025  
**Maintainer**: WFED 119 Development Team

For questions, issues, or contributions, please visit our [GitHub repository](https://github.com/your-org/lifecraft-bot).# Trigger Render redeploy
