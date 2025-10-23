# 🔐 WFED119 데이터베이스 관리자 가이드

## 📍 접근 링크

### 🎯 관리자 대시보드 (바로가기)

**프로덕션**: https://wfed119-1.onrender.com/admin/database
**로컬**: http://localhost:3000/admin/database

> ⚠️ **중요**: SUPER_ADMIN 권한이 필요합니다. 일반 사용자는 접근할 수 없습니다.

### 🔑 사용자 대시보드 (공개)

**프로덕션**: https://wfed119-1.onrender.com/dashboard
**로컬**: http://localhost:3000/dashboard

> ℹ️ Google 로그인 후 개인 분석 결과만 확인 가능

---

## 🗄️ 데이터베이스 구조

### 현재 사용 중인 데이터베이스
- **Production**: SQLite (임시)
- **권장 사항**: PostgreSQL 마이그레이션

### 주요 테이블 구조

```sql
-- 1. 사용자 테이블 (User)
- id: UUID (Primary Key)
- googleId: Google OAuth ID (Unique)
- email: 사용자 이메일
- name: 사용자 이름
- role: USER | ADMIN | SUPER_ADMIN
- createdAt: 가입일

-- 2. 사용자 세션 (UserSession)
- id: UUID
- userId: User 참조
- sessionType: 'strengths' | 'values' | 'enneagram' | 'career'
- sessionId: 고유 세션 ID
- completed: 완료 여부
- startedAt/completedAt: 시작/완료 시간

-- 3. 가치 결과 (ValueResult)
- userId: User 참조
- valueSet: 'terminal' | 'instrumental' | 'work'
- layout: JSON (카테고리별 가치 배치)
- top3: JSON (상위 3개 가치)

-- 4. 강점 (Strength)
- sessionId: Session 참조
- category: 'skill' | 'attitude' | 'value'
- name: 강점 이름
- evidence: 근거
- confidence: 신뢰도 (0-1)

-- 5. 대화 기록 (Conversation)
- sessionId: Session 참조
- role: 'user' | 'assistant'
- content: 대화 내용
- metadata: JSON (분석 데이터)
```

---

## 🛠️ 관리 작업

### 1. 관리자 권한 부여

```bash
# Prisma Studio 실행 (GUI 인터페이스)
npx prisma studio

# 또는 SQL 직접 실행
sqlite3 prisma/dev.db
```

```sql
-- 특정 사용자를 관리자로 설정
UPDATE User
SET role = 'SUPER_ADMIN'
WHERE email = 'your-email@gmail.com';

-- 관리자 목록 조회
SELECT id, email, name, role
FROM User
WHERE role IN ('ADMIN', 'SUPER_ADMIN');
```

### 2. 데이터베이스 백업

```bash
# SQLite 백업
cp prisma/dev.db backup/dev_$(date +%Y%m%d_%H%M%S).db

# 데이터 내보내기 (JSON)
npx prisma db pull
npx prisma generate
node scripts/export-data.js
```

### 3. 데이터 정리 및 유지보수

```sql
-- 오래된 미완료 세션 삭제 (30일 이상)
DELETE FROM Session
WHERE completed = false
AND createdAt < datetime('now', '-30 days');

-- 중복 사용자 계정 병합
-- (주의: 관련 데이터 먼저 이전 필요)
SELECT email, COUNT(*) as count
FROM User
GROUP BY email
HAVING count > 1;

-- 고아 데이터 정리
DELETE FROM Conversation
WHERE sessionId NOT IN (SELECT sessionId FROM Session);

DELETE FROM Strength
WHERE sessionId NOT IN (SELECT sessionId FROM Session);
```

---

## 📊 데이터 분석 쿼리

### 사용자 통계

```sql
-- 전체 사용자 수 및 역할별 분포
SELECT
  role,
  COUNT(*) as user_count,
  COUNT(DISTINCT email) as unique_emails
FROM User
GROUP BY role;

-- 최근 7일간 신규 가입자
SELECT
  DATE(createdAt) as signup_date,
  COUNT(*) as new_users
FROM User
WHERE createdAt >= datetime('now', '-7 days')
GROUP BY DATE(createdAt)
ORDER BY signup_date DESC;
```

### 모듈별 완료율

```sql
-- 각 모듈별 완료율
SELECT
  sessionType,
  COUNT(*) as total_sessions,
  SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_sessions,
  ROUND(100.0 * SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) / COUNT(*), 2) as completion_rate
FROM UserSession
GROUP BY sessionType;

-- 가치 평가 완료 현황
SELECT
  valueSet,
  COUNT(DISTINCT userId) as users_completed
FROM ValueResult
GROUP BY valueSet;
```

### 강점 분석

```sql
-- 가장 많이 발견된 강점 Top 10
SELECT
  name,
  category,
  COUNT(*) as frequency,
  ROUND(AVG(confidence), 2) as avg_confidence
FROM Strength
GROUP BY name, category
ORDER BY frequency DESC
LIMIT 10;

-- 카테고리별 강점 분포
SELECT
  category,
  COUNT(DISTINCT name) as unique_strengths,
  COUNT(*) as total_occurrences,
  ROUND(AVG(confidence), 2) as avg_confidence
FROM Strength
GROUP BY category;
```

---

## 🔄 PostgreSQL 마이그레이션

### 1. PostgreSQL 설치 및 설정

```bash
# Render.com PostgreSQL 연결 정보
DATABASE_URL="postgresql://user:password@dpg-xxxxx.oregon-postgres.render.com/wfed119_db"

# 로컬 PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/wfed119"
```

### 2. 스키마 마이그레이션

```bash
# 1. 기존 데이터 백업
npx prisma db pull
node scripts/backup-to-json.js

# 2. PostgreSQL 스키마로 변경
cp prisma/schema.enhanced.prisma prisma/schema.prisma

# 3. .env 파일 업데이트
echo 'DATABASE_URL="postgresql://..."' > .env

# 4. 마이그레이션 실행
npx prisma migrate dev --name init
npx prisma generate

# 5. 데이터 복원
node scripts/restore-from-json.js
```

### 3. 연결 테스트

```javascript
// test-connection.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
  try {
    const userCount = await prisma.user.count();
    console.log(`✅ 연결 성공! 사용자 수: ${userCount}`);
  } catch (error) {
    console.error('❌ 연결 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
```

---

## 🚨 비상 대응

### 데이터베이스 접근 불가

```bash
# 1. 프로세스 확인
ps aux | grep node
lsof -i :5432  # PostgreSQL
lsof -i :3000  # Next.js

# 2. 데이터베이스 재시작
# Render.com: 대시보드에서 수동 재시작
# 로컬:
sudo systemctl restart postgresql

# 3. 연결 문자열 확인
npx prisma db push --force-reset  # 주의: 데이터 삭제됨
```

### 데이터 복구

```bash
# SQLite 복구
cp backup/latest.db prisma/dev.db
npx prisma generate

# PostgreSQL 복구
psql $DATABASE_URL < backup/dump.sql
```

---

## 🔒 보안 체크리스트

- [ ] 관리자 계정은 2FA 활성화
- [ ] 데이터베이스 접근 IP 화이트리스트
- [ ] 정기 백업 스케줄 설정 (일일)
- [ ] 민감 정보 암호화 확인
- [ ] 감사 로그 활성화
- [ ] SSL 연결 필수

---

## 📞 지원 연락처

- **기술 지원**: tech-support@wfed119.edu
- **긴급 연락**: +1-XXX-XXX-XXXX
- **Render 대시보드**: https://dashboard.render.com
- **모니터링**: https://wfed119-1.onrender.com/admin/monitoring

---

## 📝 변경 이력

- 2024-09-26: 초기 문서 작성
- PostgreSQL 마이그레이션 가이드 추가
- 관리자 권한 시스템 구현