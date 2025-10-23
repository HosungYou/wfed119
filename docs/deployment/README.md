# Deployment Documentation

This directory contains deployment and administration guides for production environments.

## 📋 Documentation Index

### Production Setup
- **[ADMIN_SETUP_GUIDE.md](./ADMIN_SETUP_GUIDE.md)** - Administrative setup and configuration
  - Production environment configuration
  - Admin access management
  - System monitoring setup

### Platform-Specific Guides
- **[RENDER_DEPLOYMENT_INSTRUCTIONS.md](./RENDER_DEPLOYMENT_INSTRUCTIONS.md)** - Render.com deployment
  - Automated deployment setup
  - Environment variable configuration
  - Domain and SSL configuration

## 🏗️ Deployment Architecture

```
Production Environment (Render.com)
├── Web Service: Next.js application
├── Database: Supabase PostgreSQL
├── Authentication: Supabase Auth
├── Storage: Supabase Storage (if needed)
└── Monitoring: Render.com logs + Supabase dashboard
```

## 🔄 Deployment Process

### Automatic Deployment
1. **Push to main branch** → Triggers auto-deployment
2. **Render.com builds** → Next.js production build
3. **Environment variables** → Loaded from Render settings
4. **Health checks** → Automatic validation
5. **Live deployment** → Available at production URL

### Manual Deployment
```bash
# Verify build locally
npm run build
npm run start

# Push to main branch
git push origin main

# Monitor deployment in Render dashboard
```

## 🔒 Security & Environment

### Environment Variables (Production)
```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiI...

# AI Services (Optional)
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-proj-...
```

### Access Control
- **Render.com**: Admin access for deployment management
- **Supabase**: Database and auth management
- **GitHub**: Repository and deployment triggers

## 🏃 Quick Deployment Checklist

### Pre-Deployment
- [ ] Test locally with production build (`npm run build`)
- [ ] Verify environment variables are set
- [ ] Check database migrations are applied
- [ ] Review recent changes and potential breaking changes

### During Deployment
- [ ] Monitor Render build logs
- [ ] Check Supabase logs for any errors
- [ ] Verify authentication flow works
- [ ] Test core functionality (values discovery, etc.)

### Post-Deployment
- [ ] Smoke test critical user paths
- [ ] Monitor error rates in Supabase dashboard
- [ ] Update release notes if applicable
- [ ] Notify team of successful deployment

## 🚨 Emergency Procedures

### Rollback Process
1. **Immediate**: Revert to previous Git commit
2. **Database**: Apply rollback migrations if needed
3. **Monitoring**: Check system health
4. **Communication**: Notify stakeholders

### Common Issues
- **Build failures**: Check Node.js version compatibility
- **Database errors**: Verify Supabase connection and credentials
- **Authentication issues**: Check OAuth configuration in Supabase
- **Environment variables**: Ensure all required vars are set

## 📊 Monitoring & Logs

### Available Monitoring
- **Render.com Logs**: Application logs and build information
- **Supabase Dashboard**: Database logs and real-time activity
- **GitHub Actions**: CI/CD pipeline status
- **Browser Console**: Client-side error tracking

### Key Metrics to Monitor
- **Response times**: API endpoint performance
- **Error rates**: 4xx and 5xx responses
- **Database performance**: Query times and connection health
- **Authentication success**: Login/logout rates

## 🔗 Related Documentation

- **Development Setup**: `../collaboration/COLLABORATOR_SETUP.md`
- **Database Migrations**: `../../database/migrations/`
- **Release Process**: `../../release-notes/`