# Intern Onboarding - Quick Reference

## 🎯 First Tasks Ready

### Database Team (Jonathan Lead, Trivikram Associate)
**Start Here**: [`docs/issues/DB-01-Local-Postgres-Docker.md`](./issues/DB-01-Local-Postgres-Docker.md)

### RAG Team (Trivikram Lead, Jonathan Associate)  
**Start Here**: [`docs/issues/RAG-01-Ingestion-v0.md`](./issues/RAG-01-Ingestion-v0.md)

## 🚀 Quick Setup

```bash
# 1. Clone and setup
git clone https://github.com/HosungYou/wfed119.git
cd wfed119

# 2. Auto setup (recommended)
./setup-dev-environment.sh

# 3. Manual setup
cp .env.example .env.local
# Edit .env.local with API keys
npm install
docker-compose up -d postgres qdrant redis
npx prisma generate
npx prisma db push
npm run dev
```

## 📚 Key Documents

- [`INTERN_SETUP.md`](../INTERN_SETUP.md) - Detailed setup guide
- [`PROJECT_STATUS.md`](../PROJECT_STATUS.md) - Current status
- [`docs/issues/`](./issues/) - Detailed task specifications
- [`resources/materials/`](../resources/materials/) - Course materials

## 🤝 Communication

- **GitHub**: Issues, PRs, code reviews
- **Slack**: Daily communication, questions
- **Weekly Standup**: Wednesday 10 AM ET

## ❓ Need Help?

1. Check [`INTERN_SETUP.md`](../INTERN_SETUP.md) troubleshooting section
2. Review task specifications in [`docs/issues/`](./issues/)
3. Ask in Slack #wfed119-general
4. Create GitHub issue for bugs

---

**Ready to start?** Pick your first task above and begin coding! 🚀