# Collaborator Setup Guide

## Backend/Database Development Environment

### Prerequisites
- Node.js 18+
- Git
- GitHub account with repository access

### 1. Clone and Setup

```bash
git clone https://github.com/HosungYou/wfed119.git
cd wfed119
npm install
```

### 2. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env.local
```

**Required Environment Variables:**

#### For Supabase Database (Primary):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```
- **Contact project owner for Supabase credentials**
- Production-ready PostgreSQL database
- Real-time subscriptions and authentication included
- Row Level Security (RLS) enabled

#### For AI Features (Optional):
```env
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-proj-...
```

#### For Google OAuth (Included in Supabase):
```env
# OAuth is configured in Supabase Dashboard
# No additional environment variables needed
# Contact owner for access to Supabase OAuth settings
```

### 3. Database Setup

#### Supabase Connection Test:
```bash
# Start development server to test connection
npm run dev

# Check browser console for Supabase connection logs
# Visit http://localhost:3000 and open DevTools
```

#### Database Management:
- **Supabase Dashboard**: Access via project owner
- **SQL Editor**: Run queries directly in Supabase
- **Table Editor**: Visual database management
- **Real-time logs**: Monitor API calls and errors

### 4. Development Commands

```bash
# Start development server
npm run dev

# Code quality
npm run lint               # Check code style
npm run build             # Test production build
npm run typecheck         # TypeScript validation

# Database operations (via Supabase Dashboard)
# - View tables in Table Editor
# - Run SQL queries in SQL Editor
# - Monitor real-time activity in Logs
# - Manage authentication in Auth section
```

### 5. Project Structure

```
src/
├── app/
│   ├── api/              # Backend API routes (Next.js App Router)
│   │   ├── dashboard/    # Dashboard data APIs
│   │   ├── discover/     # Assessment APIs
│   │   │   └── values/   # Values discovery endpoints
│   │   └── session/      # Session management
│   ├── discover/         # Assessment pages
│   │   ├── values/       # Values discovery UI
│   │   └── enneagram/    # Enneagram assessment
│   └── dashboard/        # User dashboard
├── lib/
│   ├── supabase.ts      # Supabase client (browser)
│   ├── supabase-server.ts # Supabase client (server)
│   └── supabase.d.ts    # TypeScript definitions
└── components/          # React components

database/
└── migrations/          # SQL migration files
    ├── fix-foreign-key-issue.sql
    └── fix-unique-constraint.sql

docs/
├── collaboration/       # Team collaboration docs
├── deployment/         # Deployment guides
└── value-results-error-root-cause-analysis.md

release-notes/
└── RELEASE_NOTES_v2.6.0.md
```

### 6. Database Schema (Supabase PostgreSQL)

Current tables:
- **users**: User profiles and authentication
- **user_sessions**: Assessment session tracking
- **value_results**: Values discovery results
- **strength_profiles**: Strength assessment data

#### Key Tables Structure:
```sql
-- Users table (auto-created by Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'USER',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Values assessment results
CREATE TABLE value_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  value_set TEXT NOT NULL, -- 'terminal' | 'instrumental' | 'work'
  layout JSONB NOT NULL,   -- Categorized values
  top3 TEXT[] NOT NULL,    -- Top 3 values array
  insights JSONB,          -- Optional insights
  module_version TEXT DEFAULT 'v1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, value_set) -- Prevent duplicates
);
```

### 7. Common Tasks

#### Adding New API Endpoint:
```typescript
// src/app/api/your-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('your_table')
      .select('*')
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

#### Database Schema Changes:
1. Access **Supabase Dashboard** → **SQL Editor**
2. Run SQL commands to create/modify tables
3. Update TypeScript types in `src/lib/supabase.d.ts`
4. Test changes in development environment

#### Testing Database Queries:
```typescript
// Test in browser console or API routes
const supabase = createSupabaseClient();

// Simple query
const { data, error } = await supabase
  .from('value_results')
  .select('*')
  .eq('user_id', 'some-user-id');

// Complex query with joins
const { data, error } = await supabase
  .from('user_sessions')
  .select(`
    *,
    value_results (*)
  `)
  .eq('user_id', session.user.id);
```

#### Error Debugging:
```typescript
// Enhanced error logging pattern
console.log('[API_NAME] Request received:', { params });

if (error) {
  console.error('[API_NAME] Database error:', {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint
  });
}
```

### 8. Permission Levels

#### GitHub Repository Access:
- **Write access**: Can push to main branch
- **Admin access**: Can manage settings, deploy, release tags

#### Supabase Access Levels:
- **Member**: Read-only dashboard access
- **Developer**: Can modify tables, run SQL queries
- **Owner**: Full project access including billing

#### Application Roles (RLS Policies):
- **USER**: Basic assessment access, own data only
- **ADMIN**: User data management (future feature)
- **SUPER_ADMIN**: Full system access (future feature)

### 9. Deployment

#### Production Environment:
- **Platform**: Render.com
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth with Google OAuth
- **Auto-deploy**: Pushes to `main` branch

#### Environment Variables in Production:
Contact repository owner for access to:
- **Render.com dashboard**: Deployment management
- **Supabase project**: Database and auth settings
- **API keys**: AI services (Anthropic, OpenAI)

#### Security & Environment Setup:
```bash
# Environment file structure (.env.local)
# NEVER commit actual values to Git

# Database (Required)
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AI Services (Optional)
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-proj-...
```

### 10. Best Practices

#### Database (Supabase):
- Always use Supabase client for database queries
- Test queries in Supabase SQL Editor first
- Use Row Level Security (RLS) for data protection
- Include comprehensive error handling with error codes
- Use transactions for multi-table operations
- Log all database errors with context

#### API Development:
- Follow RESTful conventions
- Include proper TypeScript types
- **Always** validate user sessions in API routes
- Return consistent error formats with error codes
- Use structured logging: `[API_NAME] Action: data`
- Handle both authentication and database errors

#### Security:
```typescript
// Always validate sessions in API routes
const { data: { session }, error: authError } = await supabase.auth.getSession();
if (!session || authError) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Use user ID from session, never trust client input
const userId = session.user.id;
```

#### Git Workflow:
```bash
# Feature development workflow
git checkout -b feature/your-feature
# Make changes with proper commit messages
git add .
git commit -m "feat: add your feature

- Add specific functionality
- Include tests if applicable
- Update documentation

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin feature/your-feature
# Create pull request with detailed description
```

### 11. Troubleshooting

#### Supabase Connection Issues:
```bash
# Test environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Check browser console for Supabase errors
# Look for authentication or network errors
```

#### Common Error Codes:
- **401 Unauthorized**: Session expired or invalid
- **409 Conflict**: Database constraint violation
- **500 Internal Server Error**: Check server logs
- **23505 PostgreSQL**: Unique constraint violation

#### Build Errors:
```bash
# Clear Next.js cache
rm -rf .next node_modules/.cache
npm install
npm run build

# TypeScript errors
npm run typecheck
```

#### Database Debugging:
```typescript
// Add to API routes for debugging
console.log('[DEBUG] Session:', session?.user?.id);
console.log('[DEBUG] Query params:', req.url);

// Check Supabase logs in dashboard for real-time errors
```

### 12. Getting Help

#### Resources:
- **Documentation**: Check `CLAUDE.md` for project overview
- **Release Notes**: See `release-notes/` for recent changes
- **Error Analysis**: Review `docs/value-results-error-root-cause-analysis.md`

#### Contact Information:
- **GitHub Issues**: Create issues for bugs/features
- **Project Owner**: Contact for access to:
  - Supabase project dashboard
  - Render.com deployment settings
  - AI service API keys
  - Production environment variables

#### Emergency Debugging:
1. Check **Supabase Dashboard** → **Logs** for real-time errors
2. Review **GitHub Actions** for deployment failures
3. Check **Render.com logs** for production issues
4. Use browser DevTools Network tab for API debugging

#### Database Recovery:
If database issues occur:
1. Check `database/migrations/` for SQL fixes
2. Run fixes in Supabase SQL Editor
3. Test in development environment first
4. Document solutions in release notes