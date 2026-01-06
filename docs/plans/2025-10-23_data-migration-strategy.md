# 데이터 마이그레이션 전략

## 📊 현재 데이터 현황

### 기존 PostgreSQL 데이터
```sql
-- 현재 데이터 확인 쿼리
SELECT 'users' as table_name, COUNT(*) as count FROM "User"
UNION ALL
SELECT 'value_results' as table_name, COUNT(*) as count FROM "ValueResult"
UNION ALL
SELECT 'strength_profiles' as table_name, COUNT(*) as count FROM "StrengthProfile"
UNION ALL
SELECT 'user_sessions' as table_name, COUNT(*) as count FROM "UserSession";
```

## 🔄 마이그레이션 단계별 전략

### Phase 1: 데이터 백업 및 내보내기

#### 1.1 현재 데이터 백업
```bash
# Render Shell에서 실행
cd /opt/render/project/src

# 모든 데이터를 JSON으로 내보내기
node -e "
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function exportData() {
  try {
    console.log('📦 Exporting data...');

    const users = await prisma.user.findMany();
    const valueResults = await prisma.valueResult.findMany();
    const strengthProfiles = await prisma.strengthProfile.findMany();
    const userSessions = await prisma.userSession.findMany().catch(() => []);
    const auditLogs = await prisma.auditLog.findMany().catch(() => []);

    const exportData = {
      timestamp: new Date().toISOString(),
      users,
      valueResults,
      strengthProfiles,
      userSessions,
      auditLogs
    };

    fs.writeFileSync('./data-backup.json', JSON.stringify(exportData, null, 2));

    console.log('✅ Data exported to data-backup.json');
    console.log(\`📊 Stats:
    - Users: \${users.length}
    - Value Results: \${valueResults.length}
    - Strength Profiles: \${strengthProfiles.length}
    - User Sessions: \${userSessions.length}
    - Audit Logs: \${auditLogs.length}\`);

  } catch (error) {
    console.error('❌ Export failed:', error);
  } finally {
    await prisma.\$disconnect();
  }
}

exportData();
"
```

#### 1.2 데이터 다운로드
```bash
# 로컬에서 백업 파일 다운로드
scp render-server:/opt/render/project/src/data-backup.json ./backup/
```

### Phase 2: Supabase로 데이터 가져오기

#### 2.1 사용자 데이터 마이그레이션
```typescript
// scripts/migrate-to-supabase.ts
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface OldUser {
  id: string
  googleId: string
  email: string
  name: string
  image: string
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

async function migrateUsers(users: OldUser[]) {
  console.log('👥 Migrating users...')

  for (const user of users) {
    try {
      // 1. Create auth user first (if they don't exist)
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          avatar_url: user.image
        }
      })

      if (authError && !authError.message.includes('already been registered')) {
        console.error(`Auth user creation failed for ${user.email}:`, authError)
        continue
      }

      const userId = authUser?.user?.id || user.googleId

      // 2. Create/update profile in public.users
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          is_active: user.isActive
        })

      if (profileError) {
        console.error(`Profile creation failed for ${user.email}:`, profileError)
      } else {
        console.log(`✅ Migrated user: ${user.email}`)
      }

    } catch (error) {
      console.error(`Migration failed for user ${user.email}:`, error)
    }
  }
}

async function migrateValueResults(valueResults: any[], userIdMap: Map<string, string>) {
  console.log('💎 Migrating value results...')

  for (const result of valueResults) {
    try {
      const newUserId = userIdMap.get(result.userId)
      if (!newUserId) {
        console.log(`⏭️ Skipping value result - user not found: ${result.userId}`)
        continue
      }

      const { error } = await supabase
        .from('value_results')
        .upsert({
          user_id: newUserId,
          value_set: result.valueSet,
          layout: result.layout,
          top3: result.top3,
          insights: result.insights,
          module_version: result.moduleVersion || 'v1'
        })

      if (error) {
        console.error(`Value result migration failed:`, error)
      } else {
        console.log(`✅ Migrated value result: ${result.valueSet} for user ${newUserId}`)
      }

    } catch (error) {
      console.error(`Migration failed for value result:`, error)
    }
  }
}

async function migrateStrengthProfiles(strengthProfiles: any[], userIdMap: Map<string, string>) {
  console.log('💪 Migrating strength profiles...')

  for (const profile of strengthProfiles) {
    try {
      const newUserId = profile.userId ? userIdMap.get(profile.userId) : null

      const { error } = await supabase
        .from('strength_profiles')
        .insert({
          session_id: profile.sessionId,
          user_id: newUserId,
          user_email: profile.userEmail,
          strengths: profile.strengths,
          summary: profile.summary,
          insights: profile.insights
        })

      if (error) {
        console.error(`Strength profile migration failed:`, error)
      } else {
        console.log(`✅ Migrated strength profile: ${profile.sessionId}`)
      }

    } catch (error) {
      console.error(`Migration failed for strength profile:`, error)
    }
  }
}

async function main() {
  try {
    // Load backup data
    const backupData = JSON.parse(fs.readFileSync('./data-backup.json', 'utf8'))

    console.log('🚀 Starting migration...')

    // 1. Migrate users first
    await migrateUsers(backupData.users)

    // 2. Create user ID mapping (old googleId -> new UUID)
    const userIdMap = new Map<string, string>()
    const { data: newUsers } = await supabase.from('users').select('id, email')

    for (const oldUser of backupData.users) {
      const newUser = newUsers?.find(u => u.email === oldUser.email)
      if (newUser) {
        userIdMap.set(oldUser.googleId, newUser.id)
      }
    }

    // 3. Migrate value results
    await migrateValueResults(backupData.valueResults, userIdMap)

    // 4. Migrate strength profiles
    await migrateStrengthProfiles(backupData.strengthProfiles, userIdMap)

    console.log('🎉 Migration completed!')

  } catch (error) {
    console.error('💥 Migration failed:', error)
  }
}

main()
```

### Phase 3: 점진적 마이그레이션 전략

#### 3.1 Blue-Green 배포 방식
```yaml
# 배포 단계
stages:
  1. Preparation:
    - Supabase 프로젝트 설정
    - 스키마 생성
    - 테스트 데이터 마이그레이션

  2. Parallel Run:
    - 기존 시스템 유지
    - Supabase 환경 준비
    - 데이터 동기화 스크립트 실행

  3. Cut-over:
    - DNS 전환 또는 환경변수 전환
    - 최종 데이터 동기화
    - 기존 시스템 백업 유지

  4. Verification:
    - 전체 기능 테스트
    - 데이터 무결성 확인
    - 성능 모니터링
```

### Phase 4: 데이터 무결성 검증

#### 4.1 데이터 비교 스크립트
```typescript
// scripts/verify-migration.ts
async function verifyMigration() {
  const backupData = JSON.parse(fs.readFileSync('./data-backup.json', 'utf8'))

  // 1. Users count verification
  const { count: usersCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  console.log(`Users: ${backupData.users.length} → ${usersCount}`)

  // 2. Value results count verification
  const { count: valueResultsCount } = await supabase
    .from('value_results')
    .select('*', { count: 'exact', head: true })

  console.log(`Value Results: ${backupData.valueResults.length} → ${valueResultsCount}`)

  // 3. Strength profiles count verification
  const { count: strengthProfilesCount } = await supabase
    .from('strength_profiles')
    .select('*', { count: 'exact', head: true })

  console.log(`Strength Profiles: ${backupData.strengthProfiles.length} → ${strengthProfilesCount}`)

  // 4. Spot check individual records
  for (const oldUser of backupData.users.slice(0, 5)) {
    const { data: newUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', oldUser.email)
      .single()

    if (newUser) {
      console.log(`✅ User verified: ${oldUser.email}`)
    } else {
      console.log(`❌ User missing: ${oldUser.email}`)
    }
  }
}
```

## 🔧 롤백 계획

### 긴급 롤백 절차
```bash
# 1. Render 환경변수를 기존 설정으로 복원
export DATABASE_URL="postgresql://..."
export NEXTAUTH_SECRET="..."

# 2. 기존 코드 브랜치로 복원
git checkout backup-before-supabase-migration

# 3. 긴급 배포
git push origin main --force
```

### 부분 롤백 (특정 기능만)
```typescript
// Feature flag를 사용한 점진적 전환
const USE_SUPABASE = process.env.USE_SUPABASE === 'true'

if (USE_SUPABASE) {
  // Supabase 로직
} else {
  // 기존 Prisma 로직
}
```

## 📋 마이그레이션 체크리스트

### 사전 준비
- [ ] Supabase 프로젝트 생성 및 설정
- [ ] 스키마 생성 및 테스트
- [ ] 기존 데이터 백업
- [ ] 마이그레이션 스크립트 테스트

### 마이그레이션 실행
- [ ] 사용자 데이터 마이그레이션
- [ ] 애플리케이션 데이터 마이그레이션
- [ ] 권한 및 RLS 정책 확인
- [ ] Google OAuth 재설정

### 검증
- [ ] 데이터 무결성 확인
- [ ] 전체 기능 테스트
- [ ] 성능 테스트
- [ ] 보안 테스트

### 마무리
- [ ] 기존 시스템 아카이브
- [ ] 모니터링 설정
- [ ] 문서 업데이트
- [ ] 팀 교육

## 🚨 위험 요소 및 대응

### 주요 위험 요소
1. **데이터 손실**: 철저한 백업 및 검증
2. **서비스 중단**: Blue-Green 배포로 최소화
3. **인증 실패**: Google OAuth 설정 사전 테스트
4. **성능 저하**: 인덱스 및 쿼리 최적화

### 대응 방안
- 단계별 마이그레이션으로 위험 분산
- 각 단계마다 롤백 포인트 설정
- 충분한 테스트 환경에서 사전 검증
- 24시간 모니터링 체계 구축

이 전략을 따라하면 안전하고 체계적인 Supabase 마이그레이션을 수행할 수 있습니다!