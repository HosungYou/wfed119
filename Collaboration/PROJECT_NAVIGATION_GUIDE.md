# WFED119 Project Navigation Guide for Interns

**Version:** 1.0  
**Last Updated:** September 9, 2025  
**Purpose:** Help interns navigate the project structure and identify key files for their tasks

---

## 🗂️ Project Structure Overview

```
WFED119/
├── 📁 Collaboration/              ← YOUR STARTING POINT 🎯
│   ├── README.md                  ← Project overview and quick start
│   ├── LIFECRAFT_METHODOLOGY_OVERVIEW.md  ← Business context
│   ├── TECHNICAL_ARCHITECTURE.md  ← System design and tech stack
│   ├── STARTER_BACKLOG_GUIDE.md   ← Task explanations
│   ├── WORKSTREAM_RESPONSIBILITIES.md  ← Your roles and duties
│   ├── PROJECT_NAVIGATION_GUIDE.md ← This file
│   ├── INTERN_TASK_CHECKLIST.md   ← Daily workflow guide
│   ├── 📁 Meeting Notes/
│   │   └── 2025-09-10-Kickoff-Meeting.md  ← Kickoff agenda
│   ├── 📁 starter-tickets/        ← Your specific tasks 📋
│   │   ├── DB-tickets.md          ← Database tasks overview
│   │   ├── RAG-tickets.md         ← RAG tasks overview
│   │   └── 📁 issues/
│   │       ├── DB-01-Local-Postgres-Docker.md   ← Jonathan START HERE
│   │       └── RAG-01-Ingestion-v0.md          ← Trivikram START HERE
│   └── 📁 onboarding-materials/   ← Setup guides
├── 📁 lifecraft-bot/              ← Main application code 💻
│   ├── package.json               ← Dependencies and scripts
│   ├── README.md                  ← App-specific documentation
│   ├── docker-compose.yml         ← Database setup (Jonathan needs this)
│   ├── DEPLOYMENT_STATUS.md       ← Current implementation status
│   ├── DEPLOYMENT_GUIDE.md        ← How to deploy the app
│   ├── 📁 src/                    ← Source code
│   │   ├── 📁 app/                ← Next.js app router
│   │   │   ├── 📁 api/            ← Backend API endpoints
│   │   │   ├── page.tsx           ← Main landing page
│   │   │   └── layout.tsx         ← App layout
│   │   ├── 📁 components/         ← React components
│   │   └── 📁 lib/                ← Utilities and helpers
│   ├── 📁 prisma/                 ← Database schemas (Jonathan focus)
│   │   ├── schema.prisma          ← SQLite schema
│   │   └── schema.postgres.prisma ← PostgreSQL schema
│   ├── 📁 docs/                   ← Technical documentation
│   └── 📁 scripts/                ← Deployment and utility scripts
├── 📄 LifeCraft_APP_Implementation_Plan_v1.md  ← High-level roadmap
├── 📄 WFED119_Integrated_Services_Workflow.md ← Detailed workflow
└── 📄 PROJECT_STRUCTURE.md       ← Legacy project structure
```

---

## 🎯 Where to Start: Your Mission Briefing

### For Jonathan (Database Lead) 🗄️

#### 📍 Your Starting Location:
```
/WFED119/Collaboration/starter-tickets/issues/DB-01-Local-Postgres-Docker.md
```

#### 📋 Read These Files First:
1. **[DB-01 Task](./starter-tickets/issues/DB-01-Local-Postgres-Docker.md)** 
   - Your first assignment
   - Clear deliverables and acceptance criteria

2. **[Database Tasks Overview](./starter-tickets/DB-tickets.md)**
   - All 7 database tasks explained
   - Dependencies and progression

3. **[Starter Backlog Guide](./STARTER_BACKLOG_GUIDE.md#database-workstream-jonathan---lead)**
   - Detailed explanation of each task
   - Learning objectives and resources

#### 🛠️ Key Files You'll Work With:
```
📁 lifecraft-bot/
├── docker-compose.yml           ← You'll create/modify this
├── 📁 prisma/
│   ├── schema.prisma           ← Current SQLite schema
│   └── schema.postgres.prisma  ← Your PostgreSQL schema
└── 📁 scripts/
    └── deploy.sh               ← May need database setup
```

#### ✅ Your Week 1 Checklist:
- [ ] Read DB-01 task requirements
- [ ] Study the existing PostgreSQL schema at `lifecraft-bot/prisma/schema.postgres.prisma`
- [ ] Review the current docker-compose.yml template
- [ ] Install Docker Desktop on your machine
- [ ] Create your feature branch: `git checkout -b feature/DB-01-postgres-docker`
- [ ] Start building your PostgreSQL Docker setup

---

### For Trivikram (RAG Lead) 🤖

#### 📍 Your Starting Location:
```
/WFED119/Collaboration/starter-tickets/issues/RAG-01-Ingestion-v0.md
```

#### 📋 Read These Files First:
1. **[RAG-01 Task](./starter-tickets/issues/RAG-01-Ingestion-v0.md)**
   - Your first assignment
   - Document processing requirements

2. **[RAG Tasks Overview](./starter-tickets/RAG-tickets.md)**
   - All 7 RAG tasks explained  
   - Building towards complete pipeline

3. **[Starter Backlog Guide](./STARTER_BACKLOG_GUIDE.md#rag-workstream-trivikram---lead)**
   - Detailed RAG concepts explanation
   - Learning path and resources

#### 🛠️ Key Files You'll Work With:
```
📁 lifecraft-bot/
├── 📁 src/lib/                 ← Create RAG utilities here
│   └── 📁 rag/                ← Your new folder
├── requirements.txt           ← May need Python dependencies
└── 📁 docs/                   ← Document your RAG pipeline
```

#### ✅ Your Week 1 Checklist:
- [ ] Read RAG-01 task requirements
- [ ] Study document processing concepts in the backlog guide
- [ ] Set up Python 3.11+ environment
- [ ] Install necessary libraries (PyPDF2, python-docx, etc.)
- [ ] Create your feature branch: `git checkout -b feature/RAG-01-ingestion`
- [ ] Start building document ingestion pipeline

---

## 📚 Essential Reading Order

### Day 1: Project Understanding
1. **[Project Overview](./README.md)** - Big picture
2. **[LifeCraft Methodology](./LIFECRAFT_METHODOLOGY_OVERVIEW.md)** - Why we're building this
3. **[Technical Architecture](./TECHNICAL_ARCHITECTURE.md)** - How it's built
4. **[Your specific task](./starter-tickets/issues/)** - What you're building first

### Day 2: Deep Dive
1. **[Starter Backlog Guide](./STARTER_BACKLOG_GUIDE.md)** - Task explanations
2. **[Workstream Responsibilities](./WORKSTREAM_RESPONSIBILITIES.md)** - Your role
3. **[Task Checklist](./INTERN_TASK_CHECKLIST.md)** - Daily workflow

### Day 3+: Implementation
1. **[Deployment Status](../lifecraft-bot/DEPLOYMENT_STATUS.md)** - Current state
2. **[API Reference](../lifecraft-bot/docs/API_REFERENCE.md)** - Backend endpoints
3. **Your task-specific documentation**

---

## 🔍 Quick File Finder

### Need to understand...

#### **The Business?**
- `Collaboration/LIFECRAFT_METHODOLOGY_OVERVIEW.md` - Market, revenue, patents

#### **The Technology?**
- `Collaboration/TECHNICAL_ARCHITECTURE.md` - System design
- `lifecraft-bot/README.md` - App overview
- `lifecraft-bot/package.json` - Dependencies and scripts

#### **Your Tasks?**
- `Collaboration/starter-tickets/issues/DB-01-*.md` (Jonathan)
- `Collaboration/starter-tickets/issues/RAG-01-*.md` (Trivikram)
- `Collaboration/STARTER_BACKLOG_GUIDE.md` - Detailed explanations

#### **How to Deploy?**
- `lifecraft-bot/DEPLOYMENT_GUIDE.md` - Step-by-step deployment
- `lifecraft-bot/DEPLOYMENT_STATUS.md` - What works and what doesn't

#### **The Database?** (Jonathan's domain)
- `lifecraft-bot/prisma/schema.postgres.prisma` - Your target schema
- `lifecraft-bot/docker-compose.yml` - Your Docker setup

#### **The AI/RAG System?** (Trivikram's domain)
- `lifecraft-bot/src/app/api/chat/` - Existing chat API
- `lifecraft-bot/docs/strength_discovery_conversation_flow.md` - Chat flow

#### **Project Status?**
- `lifecraft-bot/DEPLOYMENT_STATUS.md` - What's done (65%)
- `Collaboration/PROJECT_STATUS.md` - Overall progress

---

## 🚀 Getting Started Workflow

### Step 1: Environment Setup (Both)
```bash
# 1. Clone the repository
git clone https://github.com/HosungYou/wfed119.git
cd wfed119

# 2. Install Node.js dependencies  
cd lifecraft-bot
npm install

# 3. Copy environment template
cp .env.example .env.local
# Edit .env.local with your API keys

# 4. Test the current app
npm run dev
# Should open http://localhost:3000
```

### Step 2: Database Setup (Jonathan)
```bash
# 1. Install Docker Desktop
# Download from https://www.docker.com/products/docker-desktop

# 2. Review existing schema
cat prisma/schema.postgres.prisma

# 3. Study the Docker template
cat docker-compose.yml

# 4. Create your task branch
git checkout -b feature/DB-01-postgres-docker

# 5. Start working on DB-01 deliverables
```

### Step 3: RAG Setup (Trivikram)
```bash
# 1. Set up Python environment
python -m venv rag_env
source rag_env/bin/activate  # Mac/Linux
# OR: rag_env\Scripts\activate  # Windows

# 2. Install Python libraries (you'll determine which ones)
pip install PyPDF2 python-docx langchain openai

# 3. Create your working directory
mkdir -p src/lib/rag

# 4. Create your task branch  
git checkout -b feature/RAG-01-ingestion

# 5. Start working on RAG-01 deliverables
```

### Step 4: Daily Workflow (Both)
1. **Morning**: Check your task checklist
2. **Work**: Focus on deliverables
3. **Test**: Verify against acceptance criteria
4. **Commit**: Save progress frequently
5. **Evening**: Update team on Slack

---

## 📞 Communication Channels

### When you need help with...

#### **Your specific task:**
- Read the detailed explanation in `STARTER_BACKLOG_GUIDE.md`
- Check the acceptance criteria in your task file
- Ask your teammate (they might have faced similar issues)

#### **Technical questions:**
- Post in #wfed119-dev Slack channel
- Create a GitHub issue
- Tag @HosungYou for urgent matters

#### **Project understanding:**
- Review the methodology and architecture docs
- Check the meeting notes from kickoff
- Ask during weekly standup

#### **Environment/setup issues:**
- Follow the deployment guide
- Check troubleshooting in `DEPLOYMENT_STATUS.md`
- Ask for help after trying for 30 minutes

---

## 📋 Task Progress Tracking

### Your Task Files:
```
Database (Jonathan):
├── DB-01: /Collaboration/starter-tickets/issues/DB-01-Local-Postgres-Docker.md
├── DB-02: Coming after DB-01 completion
└── ... (7 total tasks)

RAG (Trivikram):  
├── RAG-01: /Collaboration/starter-tickets/issues/RAG-01-Ingestion-v0.md
├── RAG-02: Coming after RAG-01 completion  
└── ... (7 total tasks)
```

### Status Updates:
- **Daily**: Post progress in Slack
- **Weekly**: Submit PR for completed tasks
- **Blocked**: Immediately ask for help

---

## 🎯 Success Indicators

### Week 1 Goals:
- [ ] Understand the project vision and your role
- [ ] Complete your first task (DB-01 or RAG-01)
- [ ] Submit your first pull request
- [ ] Establish communication rhythm with team

### Week 2 Goals:
- [ ] Complete 2-3 more tasks
- [ ] Help review teammate's code
- [ ] Contribute to project documentation
- [ ] Identify areas for improvement

---

## 🔄 File Update Process

### When you create new files:
1. Put them in the appropriate directory
2. Update this navigation guide
3. Add them to .gitignore if needed (like logs, keys)
4. Document them in your PR description

### When you modify existing files:
1. Read the file fully before changing
2. Follow existing patterns and style
3. Add comments explaining your changes
4. Test thoroughly before committing

---

## ⚡ Quick Commands Reference

### Daily Commands:
```bash
# Check project status
npm run dev              # Start development server
git status              # Check your changes
git add .               # Stage changes
git commit -m "message" # Save changes
git push origin branch  # Upload to GitHub

# Database (Jonathan)
docker-compose up -d    # Start database
psql -h localhost       # Connect to database

# Python/RAG (Trivikram)  
source rag_env/bin/activate  # Activate Python environment
python your_script.py       # Run your code
```

---

## 🎉 Remember

You're not just completing tasks - you're building the future of AI-powered career coaching! 

Each file you touch, each line of code you write, contributes to something that could help millions of people find their career paths.

**Start with your specific task file, and let the learning journey begin!** 🚀

---

**Questions?** This guide should be your compass. When in doubt, start with your task file and work outward!