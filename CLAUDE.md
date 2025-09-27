# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is WFED119 - LifeCraft Bot, an AI-powered career coaching assistant for career planning and life design education. The project uses modern web technologies with a focus on conversational AI and strength-based career development.

## Project Structure

### Major Components

- **Frontend**: Next.js 15 with TypeScript for interactive career assessments
- **Backend**: Next.js API routes with comprehensive session management
- **Database**: Supabase PostgreSQL with real-time capabilities
- **Authentication**: Supabase Auth with Google OAuth integration
- **AI Integration**: Anthropic Claude and OpenAI for conversational AI

### Key Directories

```
src/
├── app/
│   ├── api/              # Backend API routes
│   │   ├── discover/     # Assessment APIs (values, strengths)
│   │   ├── session/      # Session management
│   │   └── dashboard/    # User data APIs
│   ├── discover/         # Assessment UI pages
│   │   ├── values/       # Values discovery interface
│   │   └── enneagram/    # Enneagram assessment
│   └── dashboard/        # User dashboard
├── lib/
│   ├── supabase.ts      # Supabase client configuration
│   ├── supabase-server.ts # Server-side Supabase client
│   └── services/        # Business logic services
└── components/          # Reusable React components

database/migrations/     # SQL migration files
docs/                   # Documentation
├── collaboration/      # Team setup guides
└── deployment/        # Production deployment guides
release-notes/          # Version history and release notes
```

## Development Commands

### Primary Commands

```bash
# Development
npm run dev                 # Start development server
npm run build              # Production build
npm run typecheck          # TypeScript validation
npm run lint               # Code linting

# Database (Supabase)
# Use Supabase Dashboard for database operations
# SQL Editor for schema changes
# Table Editor for data management
```

## Architecture Patterns

### Database Operations (Supabase)

```typescript
// API route pattern with authentication
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session }, error: authError } = await supabase.auth.getSession();

  if (!session || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('user_id', session.user.id);

  if (error) {
    console.error('[API_NAME] Database error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

### Error Handling Pattern

```typescript
// Structured logging for debugging
console.log('[API_NAME] Request received:', { params });

if (error) {
  console.error('[API_NAME] Error details:', {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint
  });
}
```

### Frontend Data Fetching

```typescript
// Client-side data fetching with authentication
const supabase = createSupabaseClient();
const { data: { session } } = await supabase.auth.getSession();

if (session) {
  const response = await fetch('/api/endpoint');
  const data = await response.json();
}
```

## Environment Variables

Required environment variables for development:

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services (Optional)
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-proj-...
```

## Working with This Project

### When Starting Development
1. Check `docs/collaboration/COLLABORATOR_SETUP.md` for complete setup
2. Ensure Supabase credentials are configured
3. Start with `npm run dev` and verify authentication works
4. Check browser console for any connection errors

### When Adding Features
1. Follow existing API route patterns in `src/app/api/`
2. Use session-based authentication for all protected routes
3. Implement proper error handling with structured logging
4. Test with both authenticated and unauthenticated states

### When Working with Database
1. Use Supabase Dashboard for schema changes
2. Test queries in SQL Editor before implementing
3. Follow Row Level Security (RLS) patterns
4. Document schema changes in `database/migrations/`

### When Debugging Issues
1. Check Supabase Dashboard → Logs for real-time errors
2. Use browser DevTools Network tab for API debugging
3. Verify environment variables are loaded correctly
4. Check authentication state in browser console

## Testing and Quality

### Development Testing
- Test authentication flow with Google OAuth
- Verify API endpoints with both valid and invalid sessions
- Test database operations in Supabase Dashboard
- Monitor real-time logs during development

### Production Deployment
- Platform: Render.com with automatic deployment
- Database: Supabase PostgreSQL with RLS enabled
- Monitoring: Supabase Dashboard + Render logs
- Health check: Available at `/api/health`

## Common Tasks

### Adding New Assessment Module
1. Create API routes in `src/app/api/discover/[module]/`
2. Implement frontend UI in `src/app/discover/[module]/`
3. Add database tables via Supabase SQL Editor
4. Update TypeScript types in `src/lib/supabase.d.ts`

### Database Schema Changes
1. Access Supabase Dashboard → SQL Editor
2. Run schema modifications
3. Test in development environment
4. Document changes in `database/migrations/`
5. Update application code to match schema

### Troubleshooting Authentication
1. Verify Supabase URL and keys in environment
2. Check OAuth configuration in Supabase Dashboard
3. Test authentication flow in incognito browser
4. Monitor authentication logs in Supabase

## Important Notes

- **Security**: Always validate user sessions in API routes
- **Database**: Use Supabase client, never direct SQL connections
- **Logging**: Use structured logging pattern for debugging
- **Environment**: Keep production credentials secure
- **Documentation**: Update docs when adding significant features

## Related Documentation

- **Team Setup**: `docs/collaboration/COLLABORATOR_SETUP.md`
- **Deployment**: `docs/deployment/`
- **Release Notes**: `release-notes/`
- **Project Overview**: `README.md`