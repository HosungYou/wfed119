# Authentication Patterns Quick Reference

## ✅ Correct Patterns

### Server-Side (API Routes, Server Components)

```typescript
import { getVerifiedUser } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  // ✅ CORRECT: Use getVerifiedUser() helper
  const user = await getVerifiedUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Access user properties directly
  const userId = user.id
  const userEmail = user.email
  const userName = user.user_metadata?.name

  // Get Supabase client for database operations
  const supabase = await createServerSupabaseClient()

  // Use userId for queries
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  return NextResponse.json({ data })
}
```

### Client-Side (React Components)

```typescript
'use client'

import { createSupabaseClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function MyComponent() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const supabase = createSupabaseClient()

    // ✅ CORRECT: Use getUser() on client
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
      }
    }

    checkAuth()

    // ✅ CORRECT: onAuthStateChange session is safe
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {  // This is OK in onAuthStateChange
          setUser(session.user)
        } else {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return <div>{user?.email}</div>
}
```

## ❌ Incorrect Patterns (Avoid)

### DON'T: Use session.user in API routes

```typescript
// ❌ WRONG: This triggers Supabase warnings
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session?.user) {
    const userId = session.user.id  // ❌ Don't do this!
  }
}
```

### DON'T: Call getSession() unnecessarily

```typescript
// ❌ WRONG: getSession() should only be used for tokens
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: { session } } = await supabase.auth.getSession()  // ❌ Unnecessary!

  const userId = session.user.id  // ❌ Use user.id instead!
}
```

## 🔧 Helper Functions Reference

### `getVerifiedUser()` - Primary Auth Helper
**Use for**: 99% of authentication needs

```typescript
const user = await getVerifiedUser()
// Returns: User object or null
// Properties: id, email, user_metadata, etc.
```

### `getCurrentUser()` - Get Database Profile
**Use for**: When you need the full user record from database

```typescript
const userData = await getCurrentUser()
// Returns: User record from 'users' table or null
// Includes: role, created_at, custom fields, etc.
```

### `getSession()` - Get Session Tokens
**Use for**: ONLY when you need access/refresh tokens

```typescript
const session = await getSession()
const accessToken = session?.access_token
const refreshToken = session?.refresh_token
// ⚠️ Rarely needed - most cases should use getVerifiedUser()
```

## 🎯 Decision Tree

```
Need authentication?
├─ Server-side (API/Server Component)?
│  ├─ Need user ID/email? → getVerifiedUser()
│  ├─ Need full DB profile? → getCurrentUser()
│  └─ Need access token? → getSession()
│
└─ Client-side (React Component)?
   └─ Use createSupabaseClient() + getUser()
```

## 📦 Common Use Cases

### 1. Protected API Route
```typescript
import { getVerifiedUser } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const user = await getVerifiedUser()
  if (!user) return unauthorized()

  // Your logic here
}
```

### 2. Admin-Only Route
```typescript
import { getCurrentUser } from '@/lib/supabase-server'

export async function DELETE(req: NextRequest) {
  const userData = await getCurrentUser()

  if (!userData || userData.role !== 'ADMIN') {
    return forbidden()
  }

  // Admin logic here
}
```

### 3. User-Specific Data
```typescript
import { getVerifiedUser } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const user = await getVerifiedUser()
  if (!user) return unauthorized()

  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user.id)

  return NextResponse.json({ data })
}
```

### 4. External API Call with Token
```typescript
import { getSession } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()

  // Use access_token for external API
  const response = await fetch('https://external-api.com/data', {
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  })

  return NextResponse.json(await response.json())
}
```

## 🚫 Migration from Old Pattern

### Before (❌)
```typescript
const supabase = await createServerSupabaseClient()
const { data: { user } } = await supabase.auth.getUser()
const { data: { session } } = await supabase.auth.getSession()
const userId = session?.user?.id
```

### After (✅)
```typescript
const user = await getVerifiedUser()
const userId = user?.id
const supabase = await createServerSupabaseClient()
```

## 📚 Additional Resources

- Supabase Docs: https://supabase.com/docs/guides/auth/server-side/nextjs
- Project: `/src/lib/supabase-server.ts` (helper implementations)
- Refactoring Summary: `/REFACTORING_SUMMARY.md`
