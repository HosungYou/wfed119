# 🚀 WFED119 Quick Start Guide

**Last Updated:** September 11, 2025  
**Purpose:** Complete onboarding and setup guide for the WFED119 project

---

## 📋 Quick Navigation

- **New to the project?** → Start with [Project Overview](#project-overview)
- **Need to set up your environment?** → Jump to [Setup Steps](#setup-steps)
- **Looking for your tasks?** → See [Your First Tasks](#your-first-tasks)
- **Stuck or confused?** → Check [Getting Help](#getting-help)

---

## 🎯 Project Overview

### What is WFED119?
WFED119 is the LifeCraft platform - an AI-powered career development system that helps users discover their strengths, understand their personality, and plan their career paths. This is a commercial project with patent potential.

### LifeCraft Methodology
The LifeCraft methodology integrates multiple assessment tools:
- **Strength Discovery**: Identify and develop core strengths
- **Enneagram Assessment**: Understand personality types and motivations
- **Career Planning**: AI-powered career path recommendations
- **Life Design**: Holistic life and career integration

For detailed methodology, see: `01-Getting-Started/LIFECRAFT_METHODOLOGY_OVERVIEW.md`

---

## ⚙️ Setup Steps

### Prerequisites
```bash
# Check your tools
node --version    # Need 18+
python --version  # Need 3.11+
git --version     # Need 2.0+
docker --version  # For database team
```

### 1. Clone & Setup (5 minutes)
```bash
# Clone the repository
git clone https://github.com/HosungYou/wfed119.git
cd wfed119

# For the main application
cd lifecraft-bot
npm install
cp .env.example .env.local

# Start development server
npm run dev
# Open http://localhost:3000
```

### 2. Database Setup (Jonathan)
```bash
# Install Docker Desktop first
# Then run PostgreSQL
docker-compose up -d

# Verify connection
docker exec -it wfed119-postgres psql -U admin -d wfed119
```

### 3. RAG Setup (Trivikram)
```bash
# Create Python environment
python -m venv rag_env
source rag_env/bin/activate  # On Windows: rag_env\Scripts\activate

# Install dependencies
pip install langchain openai chromadb pypdf
```

---

## 📁 Project Structure

```
WFED119/
├── 📁 Collaboration/           ← Documentation & guides
│   ├── 01-Getting-Started/    ← Start here
│   ├── 02-Technical-Docs/     ← Architecture & code maps
│   ├── 03-Tasks/              ← Your tickets & assignments
│   └── 04-Meetings/           ← Meeting notes & agendas
├── 📁 Modules/                ← Feature modules
│   ├── StrengthDiscovery/    ← Strength assessment module
│   └── Enneagram/             ← Personality type module
├── 📁 lifecraft-bot/          ← Main application code
│   ├── src/                  ← Source code
│   ├── prisma/               ← Database schemas
│   └── docker-compose.yml    ← Docker configuration
└── 📁 resources/              ← LifeCraft PDFs & materials
```

---

## 🎯 Your First Tasks

### Jonathan (Database Lead)
**Primary Research Task:**
- Research database technologies (PostgreSQL vs alternatives)
- Review Strength Discovery module: `/Modules/StrengthDiscovery/`
- Propose data storage patterns for user assessments
- **Deliverable:** Database recommendation memo by Sept 17

**Technical Task (DB-01):**
- Set up PostgreSQL with Docker
- Create initial schema draft
- **Files:** `03-Tasks/issues/DB-01-Local-Postgres-Docker.md`

### Trivikram (RAG Lead)
**Primary Research Task:**
- Research PDF translation tools (Korean → English)
- Review LifeCraft PDFs: `/resources/materials/split_LifeCraft_4parts/`
- Design translation pipeline preserving layout
- **Deliverable:** Translation approach document by Sept 17

**Technical Task (RAG-01):**
- Build document ingestion pipeline
- Process PDFs and create embeddings
- **Files:** `03-Tasks/issues/RAG-01-Ingestion-v0.md`

### Hosung (Project Lead)
**Security Implementation:**
- GitHub Secrets setup for API keys
- Environment variable management
- CI/CD security configuration
- **Deliverable:** Security implementation by Sept 17

---

## 📞 Communication

### Daily Updates
Post in Slack/Discord with:
- Morning: Today's goals
- Evening: Progress & blockers

### Weekly Schedule
- **Wednesday 12pm ET**: Standup meeting
- **Friday**: Submit PRs
- **Sunday**: Week planning

### Getting Help
1. **Try for 30 minutes** - Research and experiment
2. **Check documentation** - Most answers are there
3. **Ask in Slack** - Include error messages & context

---

## 🛠️ Troubleshooting

### Common Issues

**Can't find files?**
- All docs: `/Collaboration/`
- Code: `/lifecraft-bot/`
- Tasks: `/Collaboration/03-Tasks/`

**Environment issues?**
```bash
# Node.js reset
rm -rf node_modules package-lock.json
npm install

# Python reset
deactivate
rm -rf rag_env
python -m venv rag_env
source rag_env/bin/activate

# Docker reset
docker-compose down
docker-compose up --build
```

**Git problems?**
```bash
git status                  # Check changes
git checkout -- filename    # Undo file changes
git pull origin main       # Get latest code
```

---

## 📚 Additional Resources

### Essential Docs
- **Technical Architecture:** `02-Technical-Docs/TECHNICAL_ARCHITECTURE.md`
- **Code Map:** `02-Technical-Docs/CODE_MAP.md`
- **Task Details:** `03-Tasks/`
- **Meeting Notes:** `04-Meetings/`

### External Links
- **Repository:** https://github.com/HosungYou/wfed119
- **Live Demo:** https://wfed119-1.onrender.com (when deployed)

---

## ✅ Week 1 Success Criteria

### Everyone
- [ ] Development environment working
- [ ] First PR submitted
- [ ] Research findings documented
- [ ] Daily updates posted

### Jonathan
- [ ] PostgreSQL running in Docker
- [ ] Database recommendation complete
- [ ] Strength Discovery schema proposed

### Trivikram
- [ ] RAG pipeline functional
- [ ] Translation approach documented
- [ ] Sample PDF processed

---

## 🎉 Welcome to WFED119!

You're building technology that will help millions discover their potential. Every contribution matters.

**Questions?** Post in Slack or check the documentation.  
**Ready?** Let's build something amazing! 🚀