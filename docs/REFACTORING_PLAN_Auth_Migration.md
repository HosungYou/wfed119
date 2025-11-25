# WFED119 Refactoring Plan: Authentication Migration

## Overview

**Objective:** Migrate from dual authentication (NextAuth + Supabase Auth) to unified Supabase Auth only.

**Priority:** High
**Estimated Duration:** 2-3 weeks
**Risk Level:** Medium (requires user data migration)

---

## Current Architecture Problems

### 1. Dual Authentication Flow
```
User Login → NextAuth (Google OAuth) → JWT Session
                    ↓
            [NOT SYNCHRONIZED]
                    ↓
            Supabase Auth → RLS Policies (BROKEN)
```

### 2. Affected Components

| File | Issue | Impact |
|------|-------|--------|
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth handler | Must be removed |
| `src/middleware.ts` | Uses Supabase but no NextAuth sync | Session mismatch |
| `src/lib/supabase-server.ts` | Correct, but unused by NextAuth routes | Partial usage |
| All API routes | Mix of auth.getSession() and NextAuth session | Inconsistent |

### 3. RLS Policy Failures
Current RLS policies use `auth.uid()` which only works with Supabase Auth sessions, not NextAuth JWT sessions.

```sql
-- This policy DOES NOT work with NextAuth sessions
CREATE POLICY "Users can view own data"
  ON conversation_messages
  FOR SELECT
  USING (auth.uid() = user_id);  -- ❌ auth.uid() returns NULL with NextAuth
```

---

## Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Unified Supabase Auth                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│   User Login (Google OAuth via Supabase)                     │
│   → Supabase Session (httpOnly cookies)                      │
│   → auth.uid() available everywhere                          │
│   → RLS policies work correctly                              │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   ┌─────────┐          ┌─────────┐          ┌─────────┐
   │Frontend │          │  API    │          │ Database│
   │(Client) │          │ Routes  │          │  (RLS)  │
   └─────────┘          └─────────┘          └─────────┘
```

---

## Migration Steps

### Phase 1: Supabase OAuth Setup (Day 1-2)

#### 1.1 Configure Google OAuth in Supabase Dashboard

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add OAuth credentials:
   - Client ID: `[Same as current GOOGLE_CLIENT_ID]`
   - Client Secret: `[Same as current GOOGLE_CLIENT_SECRET]`
4. Set redirect URL: `https://wfed119-1.onrender.com/auth/callback`

#### 1.2 Environment Variables Update

```bash
# Remove these (NextAuth)
- NEXTAUTH_SECRET
- NEXTAUTH_URL

# Keep these (Supabase - already configured)
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key

# Keep these (move to Supabase)
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
```

---

### Phase 2: User Data Migration (Day 3-4)

#### 2.1 Backup Current Users

```sql
-- Run in Supabase SQL Editor
CREATE TABLE users_backup AS
SELECT * FROM auth.users;

-- Check existing users
SELECT id, email, raw_user_meta_data
FROM auth.users
LIMIT 10;
```

#### 2.2 Migration Script

Create `scripts/migrate-users.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function migrateUsers() {
  // Get users from any custom users table if exists
  const { data: customUsers, error } = await supabase
    .from('users')
    .select('*');

  if (error) {
    console.log('No custom users table found, checking auth.users...');
  }

  // Check auth.users
  const { data: authUsers } = await supabase.auth.admin.listUsers();

  console.log(`Found ${authUsers?.users?.length || 0} users in auth.users`);

  // Map existing data to ensure continuity
  for (const user of authUsers?.users || []) {
    // Update user metadata if needed
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        migrated_from_nextauth: true,
        migration_date: new Date().toISOString()
      }
    });
  }

  console.log('Migration complete!');
}

migrateUsers();
```

---

### Phase 3: Auth Callback Route (Day 5-6)

#### 3.1 Update Auth Callback

Replace `src/app/auth/callback/route.ts`:

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // Return to home with error
  return NextResponse.redirect(new URL('/?error=auth', requestUrl.origin));
}
```

---

### Phase 4: Remove NextAuth (Day 7-8)

#### 4.1 Delete NextAuth Files

```bash
# Delete NextAuth route
rm -rf src/app/api/auth/\[...nextauth\]

# Delete NextAuth types if exists
rm -rf src/types/next-auth.d.ts
```

#### 4.2 Update package.json

```bash
npm uninstall next-auth
```

#### 4.3 Remove NextAuth Imports

Search and remove all references:
```bash
grep -r "next-auth" src/
grep -r "getServerSession" src/
grep -r "authOptions" src/
```

---

### Phase 5: Update Middleware (Day 9-10)

#### 5.1 Update `src/middleware.ts`

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll().map(({ name, value }) => ({ name, value }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session if expired
  const { data: { session } } = await supabase.auth.getSession();

  // Protected routes
  const protectedRoutes = ['/dashboard', '/discover', '/results'];
  const isProtectedRoute = protectedRoutes.some(route =>
    req.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/health).*)',
  ],
};
```

---

### Phase 6: Update API Routes (Day 11-14)

#### 6.1 Standard API Route Pattern

Update all API routes to use this pattern:

```typescript
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Now RLS works! auth.uid() = user.id
  const { data, error } = await supabase
    .from('table_name')
    .select('*');  // RLS automatically filters by user

  if (error) {
    console.error('[API_NAME] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

#### 6.2 Files to Update

| File | Priority | Notes |
|------|----------|-------|
| `src/app/api/chat/route.ts` | High | Main chat API |
| `src/app/api/session/save/route.ts` | High | Session persistence |
| `src/app/api/discover/values/results/route.ts` | High | Values assessment |
| `src/app/api/swot/session/route.ts` | High | SWOT module |
| `src/app/api/conversations/route.ts` | Medium | Conversation history |
| `src/app/api/dashboard/user-data/route.ts` | Medium | Dashboard data |
| `src/app/api/admin/*` | Low | Admin routes |

---

### Phase 7: Update Frontend Auth (Day 15-17)

#### 7.1 Create Auth Context

Create `src/contexts/AuthContext.tsx`:

```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createSupabaseClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

#### 7.2 Update Login Component

```typescript
'use client';

import { useAuth } from '@/contexts/AuthContext';

export function LoginButton() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (user) {
    return (
      <button onClick={signOut} className="btn-secondary">
        Sign Out
      </button>
    );
  }

  return (
    <button onClick={signInWithGoogle} className="btn-primary">
      Sign in with Google
    </button>
  );
}
```

---

### Phase 8: Testing & Verification (Day 18-21)

#### 8.1 Test Checklist

- [ ] Google OAuth login works
- [ ] Session persists across page refreshes
- [ ] Protected routes redirect to login
- [ ] API routes return 401 for unauthenticated requests
- [ ] RLS policies filter data correctly
- [ ] Existing user data is accessible
- [ ] Logout clears session properly
- [ ] Auth callback handles errors gracefully

#### 8.2 RLS Verification Script

```sql
-- Test RLS as authenticated user
-- Run in Supabase SQL Editor with "Run as authenticated user" option

-- Should return only current user's conversations
SELECT * FROM conversation_messages LIMIT 5;

-- Should return only current user's SWOT analysis
SELECT * FROM swot_analyses LIMIT 5;

-- Verify auth.uid() returns correct value
SELECT auth.uid();
```

---

## Rollback Plan

If migration fails:

1. **Restore NextAuth files** from git
2. **Restore package.json** from git
3. **Keep Supabase OAuth disabled** in dashboard
4. **Document failure reason** for next attempt

---

## Timeline Summary

| Week | Phase | Tasks |
|------|-------|-------|
| Week 1 | Phases 1-3 | Supabase setup, user migration, callback |
| Week 2 | Phases 4-6 | Remove NextAuth, update middleware, API routes |
| Week 3 | Phases 7-8 | Frontend auth, testing, deployment |

---

## Post-Migration Benefits

1. **Simplified codebase**: One auth system instead of two
2. **Working RLS**: All database policies function correctly
3. **Better security**: Server-side session management
4. **Easier maintenance**: Single source of truth
5. **RAG-ready**: Proper auth.uid() for user context retrieval

---

**Document Version:** 1.0
**Created:** November 25, 2025
**Status:** Ready for Implementation
