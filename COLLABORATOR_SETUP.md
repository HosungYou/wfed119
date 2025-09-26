# Collaborator Setup Guide

## Backend/Database Development Environment

### Prerequisites
- Node.js 18+
- Git
- GitHub account with repository access

### 1. Clone and Setup

```bash
git clone https://github.com/HosungYou/wfed119.git
cd wfed119
npm install
```

### 2. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

**Required Environment Variables:**

#### For Database Access (Choose One):

**Option A: Prisma Accelerate (Recommended)**
```env
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"
```
- Request API key from project owner
- Shared production-compatible database
- No local database setup required

**Option B: Local PostgreSQL**
```env
DATABASE_URL="postgresql://admin:password@localhost:5432/wfed119_dev"
```
- Set up local PostgreSQL instance
- Independent development database

**Option C: SQLite (Quick Start)**
```env
DATABASE_URL="file:./dev.db"
```
- No database server required
- Good for schema development and testing

#### For AI Features (Optional):
```env
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-proj-...
```

#### For Google Auth (Optional):
```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000
```

### 3. Database Setup

#### Initialize Database:
```bash
npx prisma db push
npx prisma generate
```

#### View Database (Optional):
```bash
npx prisma studio
```

### 4. Development Commands

```bash
# Start development server
npm run dev

# Database commands
npx prisma db push          # Apply schema changes
npx prisma generate         # Regenerate Prisma client
npx prisma studio          # Database GUI
npx prisma migrate reset    # Reset database (DANGER!)

# Code quality
npm run lint               # Check code style
npm run build             # Test production build
```

### 5. Project Structure

```
src/
├── app/
│   ├── api/              # Backend API routes
│   │   ├── dashboard/    # Dashboard data
│   │   ├── discover/     # Assessment APIs
│   │   ├── session/      # Session management
│   │   └── auth/         # Authentication
│   ├── discover/         # Assessment pages
│   └── dashboard/        # User dashboard
├── lib/
│   ├── prisma.ts        # Database client
│   └── auth.ts          # Authentication config
└── components/          # React components

prisma/
├── schema.prisma        # Database schema (SQLite)
└── schema.postgres.prisma # PostgreSQL schema
```

### 6. Database Schema

Current tables:
- **Session**: User assessment sessions
- **Conversation**: Chat messages
- **Strength**: Identified user strengths
- **ValueResult**: Values assessment results

#### Key Models:
```prisma
model Session {
  id            String   @id @default(uuid())
  sessionId     String   @unique
  currentStage  String
  completed     Boolean
  conversations Conversation[]
  strengths     Strength[]
}

model ValueResult {
  id         String   @id @default(uuid())
  userId     String
  valueSet   String   // 'terminal' | 'instrumental' | 'work'
  layout     Json     // Categorized values
  top3       String[] // Top 3 values
}
```

### 7. Common Tasks

#### Adding New API Endpoint:
```typescript
// src/app/api/your-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const data = await prisma.yourModel.findMany();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

#### Database Schema Changes:
1. Edit `prisma/schema.prisma` (or `schema.postgres.prisma`)
2. Run `npx prisma db push`
3. Update TypeScript types: `npx prisma generate`

#### Testing Database Queries:
```typescript
// Use Prisma Studio or create test scripts
const result = await prisma.session.findMany({
  include: {
    conversations: true,
    strengths: true
  }
});
```

### 8. Permission Levels

#### GitHub Repository Access:
- **Write access**: Can push to main branch
- **Admin access**: Can manage settings, deploy

#### Application Roles (Future):
- **USER**: Basic assessment access
- **ADMIN**: User data management
- **SUPER_ADMIN**: Full system access

### 9. Deployment

#### Production Environment:
- **Platform**: Render.com
- **Database**: PostgreSQL with Prisma Accelerate
- **Auto-deploy**: Pushes to `main` branch

#### Environment Variables in Production:
Contact repository owner for access to:
- Render.com dashboard
- Production database credentials
- API keys for AI services

### 10. Best Practices

#### Database:
- Always use Prisma for database queries
- Test schema changes locally first
- Use transactions for multi-table operations
- Include proper error handling

#### API Development:
- Follow RESTful conventions
- Include proper TypeScript types
- Add authentication where needed
- Return consistent error formats

#### Git Workflow:
```bash
# Feature development
git checkout -b feature/your-feature
# Make changes
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature
# Create pull request
```

### 11. Troubleshooting

#### Database Connection Issues:
```bash
# Check connection
npx prisma db ping

# Reset if needed
npx prisma db push --force-reset
```

#### Build Errors:
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### 12. Getting Help

- **Documentation**: Check `CLAUDE.md` for project overview
- **Issues**: Create GitHub issues for bugs/features
- **Questions**: Contact project owner for access to:
  - Prisma Accelerate API keys
  - Google OAuth credentials
  - Production environment access