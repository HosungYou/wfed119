# 완전한 데이터베이스 및 FK 오류 해결 가이드

## 문제 분석

**핵심 문제**: 데이터베이스의 실제 스키마가 코드의 Prisma 스키마와 일치하지 않음

1. **ValueResult FK 오류**: `ValueResult_userId_fkey` 제약조건이 `User.id`를 참조하지만, 코드는 `User.googleId`를 사용
2. **UserSession undefined**: 런타임에서 `prisma.userSession`이 정의되지 않음
3. **User 테이블 비어있음**: NextAuth가 제대로 작동하지만 기존 DB에 User 레코드가 없음

## 해결 단계

### 1단계: 데이터베이스 스키마 수정

Render Web Shell에서 다음 명령을 실행:

```sql
-- 기존 FK 제약조건 제거
ALTER TABLE "public"."ValueResult" DROP CONSTRAINT IF EXISTS "ValueResult_userId_fkey";

-- 새로운 FK 제약조건 추가 (googleId 참조)
ALTER TABLE "public"."ValueResult"
ADD CONSTRAINT "ValueResult_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "public"."User"("googleId") ON DELETE CASCADE;
```

### 2단계: Prisma 클라이언트 재생성

```bash
cd /opt/render/project/src
npx prisma generate --schema=prisma/schema.postgres.prisma
cd lifecraft-bot
npx prisma generate --schema=prisma/schema.postgres.prisma
```

### 3단계: 서비스 재시작

Render에서 재배포하거나 서비스 재시작

### 4단계: User 레코드 생성

1. 사이트에 슈퍼 관리자 이메일(`newhosung@gmail.com` 또는 `tvs5971@psu.edu`)로 Google 로그인
2. NextAuth의 `signIn` 이벤트가 자동으로 User 레코드 생성
3. `/admin/database`에서 User 테이블 확인

### 5단계: 테스트

1. Values 모듈에서 Save 버튼 클릭 → 200 응답 확인
2. Strengths 모듈에서 Save 버튼 클릭 → 200 응답 확인

## 디버깅용 SQL 스크립트

문제가 지속되면 다음 스크립트로 현재 상태 확인:

```sql
-- User 테이블 확인
SELECT id, "googleId", email, role FROM "public"."User";

-- FK 제약조건 확인
SELECT tc.constraint_name, kcu.column_name, ccu.table_name, ccu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='ValueResult';

-- UserSession 테이블 존재 확인
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name = 'UserSession'
);
```

## Codex를 위한 프롬프트

```
핵심 문제는 데이터베이스의 실제 스키마가 Prisma 코드와 일치하지 않는 것입니다.
ValueResult 테이블의 FK 제약조건이 User.id를 참조하지만, 코드는 User.googleId를 사용합니다.

다음 단계로 해결하세요:
1. ALTER TABLE로 FK 제약조건을 User.googleId 참조로 변경
2. Prisma 클라이언트 재생성 (루트와 lifecraft-bot 모두)
3. 관리자 이메일로 재로그인하여 User 레코드 생성
4. Values/Strengths 저장 테스트

schema.postgres.prisma가 올바른 스키마이므로 이것을 기준으로 모든 작업을 진행하세요.
```

## 예방책

1. **스키마 일관성**: 루트 스키마와 하위 프로젝트 스키마를 항상 동기화
2. **마이그레이션 스크립트**: 스키마 변경 시 마이그레이션 스크립트 작성
3. **CI/CD 체크**: 배포 전 스키마 검증 단계 추가
4. **모니터링**: FK 오류 및 Prisma 클라이언트 오류 모니터링

## 성공 지표

- [ ] ValueResult 저장 시 200 응답
- [ ] StrengthProfile 저장 시 200 응답
- [ ] Admin 콘솔 접근 가능
- [ ] User 테이블에 로그인한 계정 존재
- [ ] prisma.userSession 런타임에서 사용 가능