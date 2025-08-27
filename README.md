# LifeCraft Bot v2.0 🚀

A sophisticated AI-powered career coaching assistant that helps students discover their professional strengths through storytelling and Socratic questioning.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Claude AI](https://img.shields.io/badge/Claude-3.0-FF6B35)](https://www.anthropic.com/)

## ✨ Key Features

### 🧠 Advanced AI Conversation Engine
- **Multi-stage conversation flow**: Initial → Exploration → Deepening → Analysis → Summary
- **Intelligent response validation**: Filters out irrelevant responses and questions
- **Claude 3 Haiku integration** with OpenAI GPT-4 fallback for optimal cost and reliability

### 📊 Interactive Strength Visualization
- **Zoomable radar charts** with Chart.js integration
- **Real-time strength deletion** with instant chart updates  
- **Comprehensive strength categorization**: Skills, Attitudes, Values

### 💡 Smart Analysis System
- **Pattern recognition** across conversation stages
- **Evidence-based strength extraction** from user stories
- **Career pathway recommendations** based on discovered strengths

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

For questions, issues, or contributions, please visit our [GitHub repository](https://github.com/your-org/lifecraft-bot).