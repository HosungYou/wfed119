# 🚀 Intern Quick Start Guide - Get Coding in 15 Minutes!

**Last Updated:** September 9, 2025  
**Purpose:** Get your development environment running ASAP

---

## ⚡ Super Quick Start (For the Impatient)

### 1️⃣ Clone & Setup (2 minutes)
```bash
# Clone the repo
git clone https://github.com/HosungYou/wfed119.git
cd wfed119/lifecraft-bot

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### 2️⃣ Start the App (1 minute)
```bash
# Start development server
npm run dev

# Open browser to http://localhost:3000
# You should see the LifeCraft interface! 🎉
```

### 3️⃣ Find Your Task (2 minutes)

**Jonathan (Database Lead):**
```bash
# Open your first task
open ../Collaboration/starter-tickets/issues/DB-01-Local-Postgres-Docker.md
```

**Trivikram (RAG Lead):**
```bash
# Open your first task  
open ../Collaboration/starter-tickets/issues/RAG-01-Ingestion-v0.md
```

---

## 📋 Your First Day Action Items

### For Jonathan (Database Lead)

#### ✅ Immediate Tasks (30 minutes):
1. **Read your task**: `Collaboration/starter-tickets/issues/DB-01-Local-Postgres-Docker.md`
2. **Study the schema**: `lifecraft-bot/prisma/schema.postgres.prisma`  
3. **Check Docker setup**: `lifecraft-bot/docker-compose.yml`
4. **Install Docker Desktop**: [Download here](https://www.docker.com/products/docker-desktop)

#### 🎯 Your Starting Files:
```
lifecraft-bot/
├── docker-compose.yml          ← Your main deliverable
├── prisma/
│   └── schema.postgres.prisma  ← Database structure to understand
├── .env.development           ← Environment variables
└── README.md                  ← Update with your setup instructions
```

#### 📝 Today's Goal:
Get PostgreSQL running in Docker and connect to it with psql.

---

### For Trivikram (RAG Lead)

#### ✅ Immediate Tasks (30 minutes):
1. **Read your task**: `Collaboration/starter-tickets/issues/RAG-01-Ingestion-v0.md`
2. **Set up Python**: `python -m venv rag_env && source rag_env/bin/activate`
3. **Install dependencies**: `pip install -r requirements.txt`
4. **Check test data**: `lifecraft-bot/test_data/sample.md`

#### 🎯 Your Starting Files:
```
lifecraft-bot/
├── requirements.txt           ← Python dependencies (created for you!)
├── src/ingestion/            ← Your working directory
├── test_data/sample.md       ← Test document (created for you!)
├── .env.python              ← Environment template
└── README.md                ← Update with your pipeline docs
```

#### 📝 Today's Goal:
Build a script that reads PDF/Markdown files and splits them into chunks.

---

## 🗺️ Project Navigation (Know Your Way Around)

### 📁 Key Directories:
```
WFED119/
├── 📁 Collaboration/          ← ALL YOUR DOCUMENTATION 📚
│   ├── PROJECT_NAVIGATION_GUIDE.md  ← Detailed navigation
│   ├── STARTER_BACKLOG_GUIDE.md     ← Task explanations
│   └── starter-tickets/issues/      ← Your specific tasks
├── 📁 lifecraft-bot/          ← THE ACTUAL CODE 💻
│   ├── src/                   ← Source code
│   ├── prisma/               ← Database schemas (Jonathan)
│   ├── docker-compose.yml    ← Docker setup (Jonathan) 
│   └── requirements.txt      ← Python deps (Trivikram)
└── 📄 Various project docs   ← Background reading
```

### 🔍 When You Need Help:

#### **"I don't understand my task"**
→ Read `Collaboration/STARTER_BACKLOG_GUIDE.md`

#### **"I don't know where files are"**
→ Read `Collaboration/PROJECT_NAVIGATION_GUIDE.md` (detailed map)

#### **"I'm stuck on technical stuff"**
→ Post in #wfed119-dev Slack channel

#### **"I broke something"**
→ `git status` and `git checkout -- filename` to undo changes

---

## ⚙️ Development Environment Setup

### Required Tools:

#### Everyone Needs:
- **Git**: `git --version` (should show version)
- **Node.js 18+**: `node --version` 
- **VS Code**: [Download](https://code.visualstudio.com/) (recommended)

#### Jonathan (Database) Needs:
- **Docker Desktop**: [Download](https://www.docker.com/products/docker-desktop)
- **PostgreSQL Client**: `brew install postgresql` (Mac) or [pgAdmin](https://www.pgadmin.org/)

#### Trivikram (RAG) Needs:
- **Python 3.11+**: `python --version`
- **pip**: `pip --version`

### VS Code Extensions (Recommended):
- **TypeScript/JavaScript**: Built-in
- **Python** (if working on RAG)
- **PostgreSQL** (if working on database)
- **GitLens**: Git integration
- **Prettier**: Code formatting

---

## 🎯 Your Week 1 Success Criteria

### Jonathan (Database Lead):
- [ ] PostgreSQL running in Docker ✅
- [ ] Can connect with psql command ✅  
- [ ] Docker compose setup documented ✅
- [ ] First PR submitted ✅
- [ ] Schema understanding demonstrated ✅

### Trivikram (RAG Lead):
- [ ] Python environment working ✅
- [ ] Can process PDF and Markdown files ✅
- [ ] Chunks saved as JSON files ✅
- [ ] First PR submitted ✅
- [ ] Ingestion pipeline documented ✅

---

## 📞 Communication Protocol

### Daily Check-ins:
- **Morning**: "Starting work on [task], plan to [specific goal]"
- **Afternoon**: "Progress update: [what worked], [what's blocked]" 
- **Evening**: "Day wrap: [completed], [tomorrow's plan]"

### When You're Blocked:
1. **Try for 30 minutes** - Google, read docs, experiment
2. **Ask your teammate** - They might know the answer
3. **Post in Slack** - Include:
   - What task you're working on
   - What you tried
   - Error messages or screenshots
   - What you think the issue might be

### Weekly Rhythm:
- **Monday**: New task planning
- **Wednesday**: Standup meeting + mid-week sync
- **Friday**: PR submission and demo
- **Sunday**: Week reflection and next week prep

---

## 🛟 Emergency Commands (When Things Go Wrong)

### Git Problems:
```bash
git status                    # See what changed
git checkout -- filename     # Undo changes to a file
git reset --hard HEAD        # Nuclear option: undo everything
git clean -fd                # Remove untracked files
```

### Node.js Problems:
```bash
rm -rf node_modules package-lock.json  # Nuclear option
npm install                            # Reinstall everything
npm run dev                           # Try again
```

### Python Problems:
```bash
deactivate                    # Exit Python environment
rm -rf rag_env                # Nuclear option
python -m venv rag_env        # Create new environment
source rag_env/bin/activate   # Activate it
pip install -r requirements.txt  # Reinstall everything
```

### Docker Problems:
```bash
docker-compose down           # Stop everything
docker-compose up --build    # Rebuild and start
docker system prune          # Clean up (nuclear option)
```

---

## 🎉 You're Ready to Rock!

### Final Checklist:
- [ ] Repository cloned ✅
- [ ] Development server running ✅
- [ ] Your first task file open ✅  
- [ ] Slack channel joined ✅
- [ ] Tools installed ✅
- [ ] Navigation guide bookmarked ✅

### Remember:
1. **Start with your task file** - Everything else builds from there
2. **Ask questions early and often** - We're here to help
3. **Document as you go** - Future you will thank current you
4. **Focus on deliverables** - What specific files need to be created?
5. **Test frequently** - Don't wait until the end

---

## 🌟 Welcome to the Team!

You're not just building software - you're creating a platform that could help millions of people discover their career potential. Every line of code you write matters.

**Let's build something amazing together!** 🚀

---

**Still confused?** Read the detailed navigation guide: `PROJECT_NAVIGATION_GUIDE.md`  
**Need task details?** Check the backlog guide: `STARTER_BACKLOG_GUIDE.md`  
**Questions?** Drop them in #wfed119-dev Slack!