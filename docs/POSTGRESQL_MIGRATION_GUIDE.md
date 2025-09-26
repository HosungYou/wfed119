# 🚀 PostgreSQL 마이그레이션 가이드

## 🎯 Prisma를 사용한 마이그레이션을 권장하는 이유

### ✅ Prisma의 장점

1. **타입 안전성**
   - TypeScript와 완벽 통합
   - 컴파일 타임에 쿼리 오류 발견
   - 자동 생성되는 타입 정의

2. **스키마 마이그레이션**
   - 자동 마이그레이션 파일 생성
   - 버전 관리 가능한 스키마 변경
   - 롤백 지원

3. **데이터베이스 추상화**
   - SQLite → PostgreSQL 전환 용이
   - 동일한 코드로 다양한 DB 지원
   - ORM 레이어로 복잡한 쿼리 단순화

4. **개발 생산성**
   - Prisma Studio (GUI 관리 도구)
   - 자동 완성 및 IntelliSense
   - 데이터 시딩 지원

### 🔄 대안 비교

| 방법 | 장점 | 단점 | 권장도 |
|------|------|------|--------|
| **Prisma** | 타입 안전, 마이그레이션 자동화 | 학습 곡선 | ⭐⭐⭐⭐⭐ |
| **직접 SQL** | 완전한 제어, 성능 최적화 | 수동 작업, 오류 위험 | ⭐⭐⭐ |
| **TypeORM** | 데코레이터 기반, 풍부한 기능 | 복잡성, 번들 크기 | ⭐⭐⭐⭐ |
| **Sequelize** | 성숙한 ORM | JavaScript 위주 | ⭐⭐⭐ |

---

## 📋 마이그레이션 단계별 가이드

### Phase 1: 준비 작업 (30분)

#### 1.1 현재 데이터 백업
```bash
# SQLite 데이터베이스 백업
cp prisma/dev.db backup/dev_backup_$(date +%Y%m%d_%H%M%S).db

# 데이터 JSON 내보내기
npx prisma db pull
node scripts/export-current-data.js
```

#### 1.2 PostgreSQL 데이터베이스 준비
```bash
# Render.com PostgreSQL 생성
# 또는 로컬 PostgreSQL 설치

# 연결 테스트
psql "postgresql://user:password@host:5432/dbname"
```

### Phase 2: 스키마 마이그레이션 (20분)

#### 2.1 Prisma 스키마 업데이트
```bash
# 기존 스키마 백업
cp prisma/schema.prisma prisma/schema.sqlite.backup

# PostgreSQL 스키마로 교체
cp prisma/schema.enhanced.prisma prisma/schema.prisma
```

#### 2.2 환경 변수 설정
```env
# .env 파일 업데이트
DATABASE_URL="postgresql://user:password@host:5432/wfed119_db"

# 기존 SQLite URL 백업 주석
# DATABASE_URL="file:./dev.db"
```

#### 2.3 마이그레이션 실행
```bash
# Prisma 클라이언트 재생성
npx prisma generate

# 초기 마이그레이션 생성
npx prisma migrate dev --name init

# 마이그레이션 상태 확인
npx prisma migrate status
```

### Phase 3: 데이터 이전 (15분)

#### 3.1 데이터 이전 스크립트 실행
```bash
# 기존 데이터를 PostgreSQL로 이전
node scripts/migrate-data-to-postgresql.js
```

#### 3.2 데이터 검증
```bash
# 데이터 무결성 검사
node scripts/verify-migration.js

# Prisma Studio로 확인
npx prisma studio
```

### Phase 4: 애플리케이션 테스트 (15분)

#### 4.1 로컬 테스트
```bash
# 개발 서버 시작
npm run dev

# 주요 기능 테스트
# - 사용자 로그인/로그아웃
# - Values Discovery 저장
# - Strengths Discovery 저장
# - 대시보드 데이터 로드
```

#### 4.2 프로덕션 배포
```bash
# 환경 변수 Render.com에 설정
# DATABASE_URL=postgresql://...

# 배포 실행
git add .
git commit -m "Migrate to PostgreSQL"
git push origin main
```

---

## 🛠️ 마이그레이션 스크립트

### 데이터 내보내기 스크립트
```javascript
// scripts/export-current-data.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportData() {
  try {
    const data = {
      users: await prisma.user.findMany(),
      sessions: await prisma.session.findMany(),
      userSessions: await prisma.userSession.findMany(),
      conversations: await prisma.conversation.findMany(),
      strengths: await prisma.strength.findMany(),
      valueResults: await prisma.valueResult.findMany(),
      exportedAt: new Date().toISOString()
    };

    fs.writeFileSync(
      `backup/data_export_${Date.now()}.json`,
      JSON.stringify(data, null, 2)
    );

    console.log('✅ Data exported successfully');
    console.log(`Users: ${data.users.length}`);
    console.log(`Sessions: ${data.sessions.length}`);
    console.log(`Value Results: ${data.valueResults.length}`);
    console.log(`Strengths: ${data.strengths.length}`);

  } catch (error) {
    console.error('❌ Export failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
```

### 데이터 이전 스크립트
```javascript
// scripts/migrate-data-to-postgresql.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function migrateData() {
  try {
    // 최신 백업 파일 찾기
    const backupFiles = fs.readdirSync('backup')
      .filter(f => f.startsWith('data_export_'))
      .sort()
      .reverse();

    if (backupFiles.length === 0) {
      throw new Error('No backup files found');
    }

    const backupData = JSON.parse(
      fs.readFileSync(`backup/${backupFiles[0]}`, 'utf8')
    );

    console.log('🔄 Starting data migration...');

    // 사용자 데이터 이전
    if (backupData.users.length > 0) {
      await prisma.user.createMany({
        data: backupData.users,
        skipDuplicates: true
      });
      console.log(`✅ Users migrated: ${backupData.users.length}`);
    }

    // UserSession 데이터 이전 (기존 Session과 병합)
    for (const session of backupData.sessions) {
      const user = await prisma.user.findFirst({
        where: { email: session.userId } // 임시 매핑
      });

      if (user) {
        await prisma.userSession.upsert({
          where: { sessionId: session.sessionId },
          update: {},
          create: {
            sessionId: session.sessionId,
            userId: user.id,
            sessionType: 'strengths',
            currentStage: session.currentStage,
            completed: session.completed,
            startedAt: session.createdAt,
            completedAt: session.completed ? session.updatedAt : null
          }
        });
      }
    }
    console.log(`✅ Sessions migrated: ${backupData.sessions.length}`);

    // Value Results 이전
    if (backupData.valueResults.length > 0) {
      await prisma.valueResult.createMany({
        data: backupData.valueResults,
        skipDuplicates: true
      });
      console.log(`✅ Value Results migrated: ${backupData.valueResults.length}`);
    }

    // Strengths 이전
    if (backupData.strengths.length > 0) {
      await prisma.strength.createMany({
        data: backupData.strengths,
        skipDuplicates: true
      });
      console.log(`✅ Strengths migrated: ${backupData.strengths.length}`);
    }

    // Conversations 이전
    if (backupData.conversations.length > 0) {
      await prisma.conversation.createMany({
        data: backupData.conversations,
        skipDuplicates: true
      });
      console.log(`✅ Conversations migrated: ${backupData.conversations.length}`);
    }

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateData();
```

### 데이터 검증 스크립트
```javascript
// scripts/verify-migration.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyMigration() {
  try {
    const counts = {
      users: await prisma.user.count(),
      userSessions: await prisma.userSession.count(),
      valueResults: await prisma.valueResult.count(),
      strengths: await prisma.strength.count(),
      conversations: await prisma.conversation.count()
    };

    console.log('📊 Migration verification:');
    console.log(`Users: ${counts.users}`);
    console.log(`User Sessions: ${counts.userSessions}`);
    console.log(`Value Results: ${counts.valueResults}`);
    console.log(`Strengths: ${counts.strengths}`);
    console.log(`Conversations: ${counts.conversations}`);

    // 데이터 무결성 검사
    const orphanedSessions = await prisma.userSession.count({
      where: {
        user: null
      }
    });

    const orphanedStrengths = await prisma.strength.count({
      where: {
        session: null
      }
    });

    if (orphanedSessions === 0 && orphanedStrengths === 0) {
      console.log('✅ Data integrity check passed');
    } else {
      console.log(`⚠️ Found ${orphanedSessions} orphaned sessions and ${orphanedStrengths} orphaned strengths`);
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyMigration();
```

---

## 🔄 롤백 절차

### 긴급 롤백 (5분)
```bash
# 1. 환경 변수 원복
DATABASE_URL="file:./dev.db"

# 2. 스키마 원복
cp prisma/schema.sqlite.backup prisma/schema.prisma

# 3. Prisma 클라이언트 재생성
npx prisma generate

# 4. 백업 데이터베이스 복구
cp backup/dev_backup_YYYYMMDD_HHMMSS.db prisma/dev.db

# 5. 애플리케이션 재시작
npm run dev
```

---

## 📈 성능 및 이점

### PostgreSQL 도입 후 예상 효과

1. **동시성 향상**
   - SQLite: 단일 쓰기 제한
   - PostgreSQL: 다중 동시 연결 지원

2. **확장성**
   - 수평적 확장 가능
   - 복제 및 분산 지원

3. **고급 기능**
   - JSON 컬럼 최적화
   - 인덱싱 옵션 다양화
   - 트랜잭션 격리 수준 설정

4. **백업 및 복구**
   - 증분 백업 지원
   - 포인트 인 타임 복구
   - 자동 백업 스케줄링

### 비용 대비 효과
- **Render.com PostgreSQL**: $7/월 (Starter)
- **확장성**: 무제한 동시 접속
- **안정성**: 99.9% 가용성 보장

---

## 🚨 주의사항

1. **마이그레이션 전 필수 백업**
2. **서비스 다운타임 최소화** (약 5분)
3. **환경 변수 정확한 설정**
4. **데이터 검증 필수**
5. **롤백 계획 준비**

---

## 🎯 권장 일정

- **준비 시간**: 1-2시간
- **실제 마이그레이션**: 30분
- **검증 및 테스트**: 1시간
- **총 소요 시간**: 2-3시간

PostgreSQL 마이그레이션은 WFED119 프로젝트의 확장성과 안정성을 크게 향상시킬 것입니다.