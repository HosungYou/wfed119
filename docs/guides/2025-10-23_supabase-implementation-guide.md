# Supabase 구현 가이드

## 🚀 즉시 시작하기

### 1. Supabase 프로젝트 생성
1. [Supabase](https://supabase.com) 접속 → 계정 생성
2. "New Project" 클릭
3. Organization 생성 (개인용)
4. 프로젝트 설정:
   ```
   Name: WFED119 LifeCraft
   Database Password: [강력한 비밀번호 생성]
   Region: East US (Ohio) - us-east-1
   ```

### 2. 환경변수 수집
프로젝트 생성 후 Settings → API에서 다음 값들을 복사:
```env
# .env.local에 추가
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📦 Step 1: 패키지 설치

```bash
# 기존 패키지 제거
npm uninstall next-auth @prisma/client prisma

# Supabase 패키지 설치
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/auth-ui-react @supabase/auth-ui-shared
```

## 🗃️ Step 2: 데이터베이스 스키마 생성

Supabase Dashboard → SQL Editor에서 실행:

```sql
-- 1. Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create custom types
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

-- 3. Create users table (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  image TEXT,
  role user_role DEFAULT 'USER',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create value_results table
CREATE TABLE public.value_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  value_set TEXT NOT NULL CHECK (value_set IN ('terminal', 'instrumental', 'work')),
  layout JSONB NOT NULL,
  top3 JSONB NOT NULL,
  insights JSONB,
  module_version TEXT DEFAULT 'v1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, value_set)
);

-- 5. Create strength_profiles table
CREATE TABLE public.strength_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT UNIQUE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  user_email TEXT,
  strengths JSONB NOT NULL,
  summary TEXT,
  insights JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create user_sessions table
CREATE TABLE public.user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE,
  session_type TEXT DEFAULT 'general',
  current_stage TEXT DEFAULT 'initial',
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- 7. Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create indexes for performance
CREATE INDEX idx_value_results_user_id ON public.value_results(user_id);
CREATE INDEX idx_value_results_updated_at ON public.value_results(updated_at);
CREATE INDEX idx_strength_profiles_user_id ON public.strength_profiles(user_id);
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

-- 9. Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.value_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strength_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Value results policies
CREATE POLICY "Users can manage own value results" ON public.value_results
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all value results" ON public.value_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Strength profiles policies
CREATE POLICY "Users can manage own strength profiles" ON public.strength_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all strength profiles" ON public.strength_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- User sessions policies
CREATE POLICY "Users can manage own sessions" ON public.user_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Audit logs policies (read-only for users, full access for admins)
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- 11. Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, image)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Set super admin role for specific emails
  IF NEW.email IN ('newhosung@gmail.com', 'tvs5971@psu.edu') THEN
    UPDATE public.users SET role = 'SUPER_ADMIN' WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 13. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 14. Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_value_results_updated_at BEFORE UPDATE ON public.value_results
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_strength_profiles_updated_at BEFORE UPDATE ON public.strength_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
```

## 🔧 Step 3: Supabase 클라이언트 설정

### 파일 생성: `src/lib/supabase.ts`
```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

// Client-side Supabase client
export const createSupabaseClient = () => {
  return createClientComponentClient()
}

// Server-side Supabase client with service role
export const createSupabaseAdmin = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          name: string | null
          image: string | null
          role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          name?: string | null
          image?: string | null
          role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
          is_active?: boolean
        }
        Update: {
          email?: string | null
          name?: string | null
          image?: string | null
          role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
          is_active?: boolean
        }
      }
      value_results: {
        Row: {
          id: string
          user_id: string
          value_set: string
          layout: any
          top3: any
          insights: any
          module_version: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          value_set: string
          layout: any
          top3: any
          insights?: any
          module_version?: string
        }
        Update: {
          layout?: any
          top3?: any
          insights?: any
          module_version?: string
        }
      }
      strength_profiles: {
        Row: {
          id: string
          session_id: string
          user_id: string | null
          user_email: string | null
          strengths: any
          summary: string | null
          insights: any
          created_at: string
          updated_at: string
        }
        Insert: {
          session_id: string
          user_id?: string | null
          user_email?: string | null
          strengths: any
          summary?: string | null
          insights?: any
        }
        Update: {
          strengths?: any
          summary?: string | null
          insights?: any
        }
      }
    }
  }
}
```

### 파일 생성: `src/lib/supabase-server.ts`
```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from './supabase'

export const createServerSupabaseClient = () => {
  return createServerComponentClient<Database>({ cookies })
}

export const getSession = async () => {
  const supabase = createServerSupabaseClient()
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}

export const getCurrentUser = async () => {
  const session = await getSession()
  if (!session?.user) return null

  const supabase = createServerSupabaseClient()
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  return user
}
```

## 🔐 Step 4: Google OAuth 설정

Supabase Dashboard → Authentication → Providers에서:

1. **Google 활성화**
2. **Client ID & Secret 입력** (기존 Google OAuth 앱 사용)
3. **Redirect URL 설정**:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
4. **Google Cloud Console에서 Redirect URI 추가**:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```

## 🔄 Step 5: API 경로 업데이트

### Values API 업데이트: `src/app/api/discover/values/results/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()

  // Get current session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const set = searchParams.get('set')

  if (!set || !['terminal', 'instrumental', 'work'].includes(set)) {
    return NextResponse.json({ error: 'Invalid set parameter' }, { status: 400 })
  }

  const { data: result, error } = await supabase
    .from('value_results')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('value_set', set)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Supabase error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (!result) {
    return NextResponse.json({ exists: false })
  }

  return NextResponse.json({
    exists: true,
    userId: result.user_id,
    set: result.value_set,
    layout: result.layout,
    top3: result.top3,
    insights: result.insights,
    moduleVersion: result.module_version,
    updatedAt: result.updated_at,
  })
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()

  // Get current session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { set: valueSet, layout, top3, insights, moduleVersion } = body

  if (!valueSet || !layout || !top3) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Upsert value result
  const { data, error } = await supabase
    .from('value_results')
    .upsert({
      user_id: session.user.id,
      value_set: valueSet,
      layout,
      top3,
      insights: insights || null,
      module_version: moduleVersion || 'v1'
    }, {
      onConflict: 'user_id,value_set'
    })
    .select()
    .single()

  if (error) {
    console.error('Supabase error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ success: true, id: data.id })
}
```

## 🎨 Step 6: 로그인 컴포넌트 업데이트

### 파일 생성: `src/components/auth/LoginButton.tsx`
```typescript
'use client'

import { createSupabaseClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginButton() {
  const supabase = createSupabaseClient()
  const router = useRouter()

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      console.error('Login error:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <div>
      <button onClick={handleLogin}>Login with Google</button>
      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}
```

### Auth Callback 페이지: `src/app/auth/callback/route.ts`
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin)
}
```

## 🚀 Step 7: 배포 준비

### Render 환경변수 설정
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 기존 환경변수 제거
```env
# 제거할 변수들
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
GOOGLE_CLIENT_ID  # Supabase에서 관리
GOOGLE_CLIENT_SECRET  # Supabase에서 관리
```

## ✅ 마이그레이션 체크리스트

### 사전 준비
- [ ] Supabase 프로젝트 생성
- [ ] 환경변수 설정
- [ ] Google OAuth 재설정

### 코드 변경
- [ ] 패키지 설치/제거
- [ ] Supabase 클라이언트 설정
- [ ] 데이터베이스 스키마 생성
- [ ] API 경로 업데이트
- [ ] Auth 컴포넌트 업데이트

### 테스트
- [ ] 로컬 환경 테스트
- [ ] Google 로그인 테스트
- [ ] Values/Strengths 저장 테스트
- [ ] 관리자 권한 테스트

### 배포
- [ ] Render 환경변수 업데이트
- [ ] 프로덕션 배포
- [ ] 전체 기능 검증

이 가이드를 따라하면 Auth 문제가 완전히 해결되고, 더 강력하고 안정적인 시스템을 구축할 수 있습니다!