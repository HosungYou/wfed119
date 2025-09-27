# Environment Variables Sharing Guide

## 🔐 안전한 .env 공유 방법들

### **방법 1: 대화형 설정 (추천)**

```bash
npm run setup:env
```

- 단계별로 필요한 환경 변수를 입력
- 자동으로 .env 파일 생성
- 민감한 정보는 프로젝트 소유자에게 요청

### **방법 2: 암호화된 파일 공유**

**암호화 (Project Owner)**:
```bash
npm run env:encrypt [password]
# Creates .env.encrypted.json
```

**복호화 (Collaborators)**:
```bash
npm run env:decrypt [password]
# Creates .env from encrypted file
```

### **방법 3: 1Password/Bitwarden (가장 안전)**

1. 팀 볼트 생성
2. "WFED119 Environment Variables" 항목 추가
3. collaborators에게 볼트 접근 권한 부여

### **방법 4: 부분 공유 (.env.shared)**

**민감하지 않은 설정**은 `.env.shared`에서 복사:
```bash
cp .env.shared .env
# Then add secrets manually
```

## 🏗️ Collaborator 설정 과정

### **1. Repository Clone**
```bash
git clone https://github.com/HosungYou/wfed119.git
cd wfed119
```

### **2. 환경 변수 설정**
```bash
# Option A: Interactive setup
npm run setup:env

# Option B: From encrypted file (if provided)
npm run env:decrypt [password]

# Option C: Manual setup
cp .env.example .env
# Edit .env with your values
```

### **3. 필수 설정들**

#### **Database (필수)**
```env
# Option 1: Prisma Accelerate (권장 - 프로젝트 소유자에게 API key 요청)
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"

# Option 2: Local PostgreSQL
DATABASE_URL="postgresql://admin:password@localhost:5432/wfed119_dev"

# Option 3: SQLite (간단한 개발용)
DATABASE_URL="file:./dev.db"
```

#### **AI APIs (선택사항)**
```env
ANTHROPIC_API_KEY=sk-ant-api03-...  # Claude API
OPENAI_API_KEY=sk-proj-...          # OpenAI API
```

#### **Google OAuth (선택사항)**
```env
GOOGLE_CLIENT_ID=604113547744-...
GOOGLE_CLIENT_SECRET=GOCSPX-...
NEXTAUTH_SECRET=random-secret-string
```

### **4. 개발 시작**
```bash
npm install
npx prisma generate
npx prisma db push  # If using local database
npm run dev
```

## 🔑 API 키 요청 목록

프로젝트 소유자에게 요청해야 할 것들:

### **필수 (Database 접근용)**
- [ ] **Prisma Accelerate API Key** - 공유 프로덕션 데이터베이스

### **선택사항 (Full feature 개발용)**
- [ ] **Google OAuth Credentials** - 사용자 로그인 기능
- [ ] **Anthropic API Key** - Claude AI 기능
- [ ] **OpenAI API Key** - GPT AI 기능

## 🛡️ 보안 가이드라인

### **절대 하지 말 것**
❌ .env 파일을 git에 커밋
❌ API 키를 Slack/Discord에 평문으로 공유
❌ 스크린샷에 API 키 노출
❌ 퍼블릭 GitHub issue/PR에 키 포함

### **안전한 공유 방법**
✅ 1Password/Bitwarden 팀 볼트
✅ 암호화된 파일 + 별도 채널로 비밀번호
✅ GitHub Secrets (repository secrets)
✅ 환경 변수 관리 서비스 (Doppler, Infisical 등)

## 📞 도움 요청

### **즉시 도움이 필요한 경우**
1. GitHub Issues에 문제 등록
2. 프로젝트 소유자에게 직접 연락
3. `COLLABORATOR_SETUP.md` 문서 참조

### **자주 묻는 질문**

**Q: Prisma Accelerate API 키는 어떻게 받나요?**
A: 프로젝트 소유자(HosungYou)에게 요청하세요. 이 키로 공유 프로덕션 데이터베이스에 접근할 수 있습니다.

**Q: 로컬 데이터베이스 설정이 너무 복잡해요**
A: SQLite를 사용하세요: `DATABASE_URL="file:./dev.db"`

**Q: AI 기능이 작동하지 않아요**
A: AI API 키가 선택사항입니다. 백엔드/데이터베이스 작업에는 필요하지 않습니다.

**Q: Google 로그인이 작동하지 않아요**
A: Google OAuth 설정이 필요합니다. 프로젝트 소유자에게 클라이언트 ID/Secret을 요청하세요.

## 🔄 환경 변수 업데이트

새로운 환경 변수가 추가되면:

1. `.env.example` 파일 확인
2. `npm run setup:env` 다시 실행
3. 또는 수동으로 .env에 추가

## 🚀 Production 배포

Collaborators는 일반적으로 development만 담당하지만, production 관련 정보:

- **Platform**: Render.com
- **Database**: PostgreSQL with Prisma Accelerate
- **환경 변수**: Render dashboard에서 관리
- **배포**: main 브랜치 push 시 자동 배포