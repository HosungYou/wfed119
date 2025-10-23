# Supabase 마이그레이션 계획

## 📋 마이그레이션 개요

### 현재 문제점
- 복잡한 Auth 설정으로 인한 지속적인 FK 제약조건 오류
- Prisma Accelerate와 PostgreSQL 간 권한 문제
- NextAuth와 데이터베이스 스키마 간 불일치

### Supabase 장점
- 내장 Authentication (Google OAuth 포함)
- Real-time 기능
- 자동 API 생성
- Row Level Security (RLS)
- 무료 티어 관대함

## 🎯 마이그레이션 단계

### Phase 1: Supabase 설정 (Day 1)
1. **Supabase 프로젝트 생성**
2. **환경변수 설정**
3. **기본 테이블 구조 마이그레이션**

### Phase 2: Auth 시스템 전환 (Day 2)
1. **NextAuth → Supabase Auth 전환**
2. **Google OAuth 재설정**
3. **세션 관리 업데이트**

### Phase 3: 데이터 마이그레이션 (Day 3)
1. **기존 데이터 백업**
2. **Supabase로 데이터 이전**
3. **API 엔드포인트 업데이트**

### Phase 4: 테스트 및 배포 (Day 4)
1. **전체 기능 테스트**
2. **성능 최적화**
3. **프로덕션 배포**

## 📦 필요한 준비물

### 1. Supabase 계정 및 설정
```bash
# 필요한 정보
- Supabase 계정 (https://supabase.com)
- Google OAuth 클라이언트 ID/Secret (기존 것 재사용 가능)
- 도메인 설정 (https://wfed119-1.onrender.com)
```

### 2. 환경변수 준비
```env
# 새로 추가될 환경변수
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 제거될 환경변수
DATABASE_URL (기존 PostgreSQL)
NEXTAUTH_SECRET
NEXTAUTH_URL
```

## 🛠️ 코드 변경 계획

### 1. 패키지 설치
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm uninstall next-auth @prisma/client prisma
```

### 2. Supabase 클라이언트 설정
```typescript
// src/lib/supabase.ts (새로 생성)
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'

export const supabase = createClientComponentClient()
```

### 3. Auth 시스템 전환
```typescript
// Before (NextAuth)
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// After (Supabase)
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const supabase = createServerComponentClient({ cookies })
const { data: { session } } = await supabase.auth.getSession()
```

## 📊 데이터베이스 스키마 마이그레이션

### 1. Supabase SQL 스키마
```sql
-- Users table (Supabase Auth가 자동 생성하는 auth.users와 연동)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  image TEXT,
  role USER_ROLE DEFAULT 'USER',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ValueResult table
CREATE TABLE public.value_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  value_set TEXT NOT NULL,
  layout JSONB NOT NULL,
  top3 JSONB NOT NULL,
  insights JSONB,
  module_version TEXT DEFAULT 'v1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, value_set)
);

-- StrengthProfile table
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

-- RLS (Row Level Security) 정책
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.value_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strength_profiles ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 데이터만 접근 가능
CREATE POLICY "Users can view own data" ON public.users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can view own value results" ON public.value_results
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own strength profiles" ON public.strength_profiles
  FOR ALL USING (auth.uid() = user_id);
```

## 🔄 API 엔드포인트 변경

### Values API 예시
```typescript
// Before (Prisma)
const saved = await prisma.valueResult.create({
  data: { userId: uid, valueSet, layout, top3 }
});

// After (Supabase)
const { data, error } = await supabase
  .from('value_results')
  .insert({ user_id: session.user.id, value_set: valueSet, layout, top3 });
```

## 📁 파일 구조 변경

### 삭제할 파일
```
prisma/
├── schema.prisma
├── schema.postgres.prisma
src/lib/prisma.ts
src/app/api/auth/[...nextauth]/
```

### 새로 생성할 파일
```
src/lib/
├── supabase.ts
├── supabase-server.ts
src/middleware.ts (Supabase Auth 미들웨어)
supabase/
├── config.toml
├── migrations/
└── seed.sql
```

## 🔐 보안 및 권한 설정

### 1. RLS (Row Level Security)
- 사용자는 자신의 데이터만 접근 가능
- 관리자는 모든 데이터 접근 가능

### 2. API 키 관리
```typescript
// Public 키: 클라이언트에서 사용
NEXT_PUBLIC_SUPABASE_ANON_KEY

// Service Role 키: 서버에서만 사용 (관리자 작업)
SUPABASE_SERVICE_ROLE_KEY
```

## 📈 성능 최적화

### 1. 인덱스 추가
```sql
CREATE INDEX idx_value_results_user_id ON public.value_results(user_id);
CREATE INDEX idx_value_results_updated_at ON public.value_results(updated_at);
CREATE INDEX idx_strength_profiles_user_id ON public.strength_profiles(user_id);
```

### 2. Real-time 구독 (선택사항)
```typescript
// 실시간 데이터 업데이트
const subscription = supabase
  .channel('value_results')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'value_results' },
    (payload) => console.log('Change received!', payload)
  )
  .subscribe();
```

## 🧪 테스트 계획

### 1. 단위 테스트
- [ ] Google OAuth 로그인
- [ ] Values 저장 및 조회
- [ ] Strengths 저장 및 조회
- [ ] Admin 권한 확인

### 2. 통합 테스트
- [ ] 전체 사용자 플로우
- [ ] 데이터 일관성 확인
- [ ] 성능 테스트

## 🚀 배포 전략

### 1. 환경별 배포
```
Development → Staging → Production
```

### 2. 롤백 계획
- 기존 PostgreSQL 백업 유지
- Supabase 마이그레이션 실패 시 즉시 롤백

## 📋 체크리스트

### 사전 준비
- [ ] Supabase 프로젝트 생성
- [ ] Google OAuth 앱 설정 업데이트
- [ ] 기존 데이터 백업

### 개발 단계
- [ ] Supabase 클라이언트 설정
- [ ] Auth 시스템 전환
- [ ] API 엔드포인트 업데이트
- [ ] 테이블 스키마 마이그레이션

### 테스트 단계
- [ ] 로컬 환경 테스트
- [ ] 스테이징 환경 테스트
- [ ] 성능 테스트

### 배포 단계
- [ ] 프로덕션 환경변수 설정
- [ ] 데이터 마이그레이션
- [ ] DNS/도메인 설정 확인
- [ ] 모니터링 설정

## 💡 추가 혜택

### 1. 새로운 기능 가능
- Real-time notifications
- File storage (프로필 이미지 등)
- Edge functions (서버리스 함수)

### 2. 개발 생산성 향상
- 자동 API 생성
- 타입 안전성 (TypeScript 지원)
- 내장 대시보드

## 📞 지원 및 문서

- [Supabase 공식 문서](https://supabase.com/docs)
- [Next.js 통합 가이드](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Auth 헬퍼 문서](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)