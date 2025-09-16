# WFED119 Intern Setup Guide

Welcome to the WFED119 LifeCraft AI Platform project! This guide will help you get started with development.

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** (for lifecraft-bot frontend)
- **Python 3.11+** (for RAG backend)
- **Docker Desktop** (for databases)
- **Git** with SSH keys configured
- **VS Code** (recommended) with TypeScript and Python extensions

### 1. Repository Setup
```bash
# Clone the repository
git clone https://github.com/HosungYou/wfed119.git
cd wfed119

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your API keys (request from project lead)
```

### 2. Start Development Services
```bash
# Start database services
docker-compose up -d postgres qdrant redis

# Verify services are running
docker-compose ps

# Initialize database
npx prisma generate
npx prisma db push
```

### 3. Start Development Server
```bash
# Frontend (LifeCraft Bot)
npm run dev

# Open http://localhost:3000
```

### 4. Verify Setup
- ✅ LifeCraft bot loads at localhost:3000
- ✅ Database connection works (check Docker health)
- ✅ Can create a test conversation
- ✅ No console errors

## 🛠️ Development Workflow

### Branch Management
```bash
# Create feature branch
git checkout -b feature/database-your-feature
# or
git checkout -b feature/rag-your-feature

# Work on your changes
git add .
git commit -m "feat: implement feature description"

# Push and create PR
git push origin feature/database-your-feature
```

### Commit Convention
We use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation updates
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

### PR Process
1. Create PR with descriptive title
2. Include screenshots/demo in description
3. Request review from your workstream partner
4. Address feedback and merge

## 📋 Your First Tasks

### Database Team (Jonathan Lead, Trivikram Associate)
1. **DB-01**: Set up Docker PostgreSQL ✨ *Start here*
2. **DB-02**: Create ERD and core tables
3. **DB-03**: Set up Prisma migrations
4. **DB-04**: Create seed script
5. **DB-05**: Build read models for RAG

### RAG Team (Trivikram Lead, Jonathan Associate)  
1. **RAG-01**: Document ingestion system ✨ *Start here*
2. **RAG-02**: Embedding generation
3. **RAG-03**: Vector index setup
4. **RAG-04**: Search API endpoint
5. **RAG-05**: Citation rendering

**📍 Check `docs/issues/` for detailed task descriptions**

## 🔧 Available Scripts

### Frontend (LifeCraft Bot)
```bash
npm run dev         # Development server
npm run build       # Production build
npm run start       # Start production server
npm run lint        # Code linting
```

### Database
```bash
npx prisma studio           # Visual database editor
npx prisma generate         # Update Prisma client
npx prisma db push          # Apply schema changes
npx prisma migrate dev      # Create new migration
```

### Docker Services
```bash
docker-compose up -d               # Start all services
docker-compose up -d postgres      # Start only database
docker-compose ps                  # Check service status
docker-compose logs postgres       # View logs
docker-compose down                # Stop all services
```

## 📚 Key Resources

### Documentation
- `/docs/lifecraft_bot_architecture.md` - Technical architecture
- `/docs/strength_discovery_conversation_flow.md` - Conversation logic
- `/docs/issues/` - Detailed task descriptions
- `/resources/materials/` - LifeCraft course materials

### Code Structure
```
wfed119/
├── src/
│   ├── app/                    # Next.js pages and API routes
│   ├── components/             # React components
│   └── lib/                    # Business logic and services
├── docs/                       # Project documentation
├── resources/                  # Course materials
├── scripts/                    # Database and utility scripts
└── docker-compose.yml          # Development services
```

### Important Files
- `.env.example` - Environment variables template
- `docker-compose.yml` - Development databases
- `prisma/schema.prisma` - Database schema
- `src/lib/prompts/` - AI prompt engineering

## 🤝 Getting Help

### Communication Channels
- **Slack**: #wfed119-database, #wfed119-rag, #wfed119-general
- **GitHub Issues**: For bugs and feature requests  
- **GitHub Discussions**: For questions and ideas

### Project Contacts
- **Project Lead**: Hosung You (@HosungYou)
- **Academic Supervisor**: Dr. Yoon
- **Database Lead**: Jonathan Alavez (@jonathan)
- **RAG Lead**: Trivikram Sunil (@trivikram)

### Office Hours
- **Monday/Wednesday 2:00 PM**: Pairing sessions
- **Wednesday 10:00 AM**: Weekly standup
- **Friday**: Weekly progress reports due

## ⚡ Pro Tips

1. **Use Docker for consistency**: Always run databases in Docker
2. **Test locally first**: Verify changes work before pushing
3. **Document as you go**: Update README/docs with new features
4. **Ask questions early**: Don't stay blocked - reach out!
5. **Pair frequently**: Schedule regular pairing sessions

## 🐛 Troubleshooting

### Common Issues

**"Port 5432 already in use"**
```bash
# Find and stop conflicting service
lsof -i :5432
sudo pkill -f postgres
```

**"Docker connection refused"**
```bash
# Restart Docker Desktop
# Wait for health checks to pass
docker-compose ps
```

**"npm run dev fails"**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**"Prisma client outdated"**
```bash
# Regenerate Prisma client
npx prisma generate
```

## 🎯 Success Metrics

### Week 1 Goals
- [ ] Development environment working
- [ ] First PR merged
- [ ] 3+ starter tasks completed
- [ ] Regular communication in Slack

### Week 2 Goals  
- [ ] Leading a feature implementation
- [ ] Helping review teammate's work
- [ ] Contributing to documentation
- [ ] Demo-ready functionality

---

**Questions?** Drop a message in #wfed119-general or create an issue!

**Happy coding! 🚀**