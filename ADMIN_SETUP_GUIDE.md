# WFED119 관리자 설정 및 운영 가이드

## 목차
1. [시스템 개요](#시스템-개요)
2. [관리자 권한 설정](#관리자-권한-설정)
3. [관리자 대시보드 접근](#관리자-대시보드-접근)
4. [환경변수 공유 방법](#환경변수-공유-방법)
5. [협업자 설정](#협업자-설정)
6. [데이터베이스 관리](#데이터베이스-관리)
7. [문제 해결](#문제-해결)

---

## 시스템 개요

### 기술 스택
- **Frontend**: Next.js 15 with App Router
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth
- **Deployment**: Render.com

### 사용자 권한 시스템
```
USER         - 일반 사용자 (기본값)
ADMIN        - 관리자 권한
SUPER_ADMIN  - 최고 관리자 권한 (모든 기능 접근 가능)
```

---

## 관리자 권한 설정

### 방법 1: 코드 수정 (권장)

**파일**: `src/app/api/auth/[...nextauth]/route.ts`

```javascript
const superAdminEmails = [
  'newhosung@gmail.com',
  'tvs5971@psu.edu',
  // 추가 SUPER_ADMIN 이메일을 여기에 추가
  'collaborator@example.com',
];
```

**장점**:
- 즉시 적용
- Git을 통한 변경 이력 관리
- 배포 시 자동 반영

### 방법 2: 기존 사용자 승격

```bash
# 특정 사용자를 SUPER_ADMIN으로 승격
npm run admin:promote user@example.com

# 또는 직접 스크립트 실행
node scripts/promote-user-to-admin.js user@example.com
```

**조건**: 사용자가 최소 한 번은 Google 로그인을 통해 계정이 생성되어 있어야 함

### 방법 3: 환경변수 사용

```bash
# .env 파일에 추가
SUPER_ADMIN_EMAILS="newhosung@gmail.com,tvs5971@psu.edu,collaborator@example.com"

# 스크립트 실행
npm run admin:env-setup
```

**장점**:
- 코드 변경 없이 관리
- 환경별 다른 관리자 설정 가능

---

## 관리자 대시보드 접근

### 접근 방법

1. **메인 사이트 방문**
   ```
   https://wfed119-1.onrender.com
   ```

2. **Google 계정으로 로그인**
   - SUPER_ADMIN으로 등록된 이메일 사용
   - 현재 등록된 계정:
     - `newhosung@gmail.com`
     - `tvs5971@psu.edu`

3. **관리자 대시보드 접근**
   ```
   https://wfed119-1.onrender.com/admin/database
   ```

### 대시보드 기능

- **사용자 관리**: 전체 사용자 목록 및 권한 관리
- **세션 데이터**: 사용자 세션 및 진행 상황 모니터링
- **값 분석 결과**: Values Discovery 결과 조회
- **강점 분석 데이터**: Strengths Discovery 데이터 관리
- **감사 로그**: 관리자 작업 이력 추적

---

## 환경변수 공유 방법

### 암호화 기반 공유 (권장)

1. **환경변수 암호화**
   ```bash
   # 암호화 (예: 비밀번호 36639685 사용)
   npm run env:encrypt
   # 또는
   node scripts/simple-encrypt-env.js encrypt
   ```

2. **암호화된 파일 공유**
   - `env.encrypted` 파일을 안전한 방법으로 공유
   - Slack, Discord, 이메일 등 사용

3. **복호화**
   ```bash
   # 복호화
   npm run env:decrypt
   # 또는
   node scripts/simple-encrypt-env.js decrypt
   ```

### 기타 공유 방법

#### GitHub Secrets 사용
```bash
# Repository Settings > Secrets and variables > Actions
# 각 환경변수를 개별적으로 추가
DATABASE_URL=...
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

#### 1Password 사용
```bash
# 1Password에 .env 파일 저장
# 팀원들과 공유 vault 설정
```

---

## 협업자 설정

### GitHub 협업자 추가

현재 등록된 협업자:
- **Cloudhoppr**: Backend 전문가
- **AlrJohn**: Database 관리자
- **JohnAR17**: API 개발자

### 협업자 개발 환경 설정

1. **저장소 클론**
   ```bash
   git clone https://github.com/your-username/WFED119.git
   cd WFED119
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **환경변수 설정**
   ```bash
   # 암호화된 환경변수 복호화
   npm run env:decrypt

   # 또는 직접 .env.local 생성
   cp .env.example .env.local
   ```

4. **데이터베이스 연결 확인**
   ```bash
   npx prisma generate --schema=prisma/schema.postgres.prisma
   npx prisma db push --schema=prisma/schema.postgres.prisma
   ```

5. **개발 서버 실행**
   ```bash
   npm run dev
   ```

### 협업자 권한 부여

```bash
# 협업자를 SUPER_ADMIN으로 승격
npm run admin:promote collaborator@email.com

# 또는 코드에서 직접 추가 (방법 1 참조)
```

---

## 데이터베이스 관리

### 스키마 구조

```sql
-- 사용자 테이블
User {
  id: String (UUID)
  googleId: String (고유)
  email: String (고유)
  name: String
  image: String
  role: UserRole (USER/ADMIN/SUPER_ADMIN)
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
}

-- 사용자 세션
UserSession {
  id: String (UUID)
  userId: String
  sessionId: String (고유)
  sessionType: String
  currentStage: String
  completed: Boolean
  completedAt: DateTime
  startedAt: DateTime
  updatedAt: DateTime
}

-- 감사 로그
AuditLog {
  id: String (UUID)
  userId: String
  action: String
  tableName: String
  recordId: String
  oldValues: Json
  newValues: Json
  ipAddress: String
  userAgent: String
  createdAt: DateTime
}
```

### 유용한 명령어

```bash
# Prisma Studio (GUI 데이터베이스 관리)
npm run db:studio

# 데이터베이스 스키마 푸시
npx prisma db push --schema=prisma/schema.postgres.prisma

# 데이터베이스 마이그레이션
npm run migrate:enhanced

# 마이그레이션 검증
npm run migrate:verify
```

---

## 문제 해결

### 일반적인 문제

#### 1. "Access denied. SUPER_ADMIN role required" 오류

**해결 방법**:
```bash
# 1. 사용자가 데이터베이스에 생성되었는지 확인
npm run db:studio

# 2. 사용자 권한 수동 승격
npm run admin:promote your-email@example.com

# 3. 코드에서 이메일 추가 확인
# src/app/api/auth/[...nextauth]/route.ts의 superAdminEmails 배열
```

#### 2. 데이터베이스 연결 오류

**해결 방법**:
```bash
# 1. DATABASE_URL 환경변수 확인
echo $DATABASE_URL

# 2. Prisma 클라이언트 재생성
npx prisma generate --schema=prisma/schema.postgres.prisma

# 3. 데이터베이스 스키마 동기화
npx prisma db push --schema=prisma/schema.postgres.prisma
```

#### 3. OAuth 인증 실패

**확인 사항**:
- `GOOGLE_CLIENT_ID` 및 `GOOGLE_CLIENT_SECRET` 환경변수
- Google Cloud Console에서 OAuth 설정
- Authorized redirect URIs 설정

### 로그 확인

```bash
# 개발 환경 로그
npm run dev

# 프로덕션 로그 (Render 대시보드에서 확인)
# https://dashboard.render.com
```

---

## 보안 고려사항

### 환경변수 보안
- `.env` 파일을 Git에 커밋하지 않음
- 암호화된 환경변수만 공유
- 정기적인 API 키 로테이션

### 접근 권한 관리
- SUPER_ADMIN 권한은 최소한의 인원에게만 부여
- 정기적인 사용자 권한 검토
- 감사 로그를 통한 관리자 작업 추적

### 데이터베이스 보안
- 프로덕션 데이터베이스 백업
- 민감한 데이터 암호화
- 정기적인 보안 업데이트

---

## 연락처

기술적 문제나 권한 관련 문의:
- **주 관리자**: newhosung@gmail.com
- **부 관리자**: tvs5971@psu.edu

---

*최종 업데이트: 2025-09-26*