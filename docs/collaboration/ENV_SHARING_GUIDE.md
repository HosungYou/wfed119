# Environment Variables Sharing Guide

## 🔐 Safe .env Sharing Methods

### **Method 1: Interactive Setup (Recommended)**

```bash
npm run setup:env
```

- Step-by-step input for required environment variables
- Automatically generates .env file
- Request sensitive information from project owner

### **Method 2: Encrypted File Sharing**

**Encryption (Project Owner)**:
```bash
npm run env:encrypt [password]
# Creates .env.encrypted.json
```

**Decryption (Collaborators)**:
```bash
npm run env:decrypt [password]
# Creates .env from encrypted file
```

### **Method 3: 1Password/Bitwarden (Most Secure)**

1. Create team vault
2. Add "WFED119 Environment Variables" entry
3. Grant vault access to collaborators

### **Method 4: Partial Sharing (.env.shared)**

Copy **non-sensitive settings** from `.env.shared`:
```bash
cp .env.shared .env
# Then add secrets manually
```

## 🏗️ Collaborator Setup Process

### **1. Repository Clone**
```bash
git clone https://github.com/HosungYou/wfed119.git
cd wfed119
```

### **2. Environment Variables Setup**
```bash
# Option A: Interactive setup
npm run setup:env

# Option B: From encrypted file (if provided)
npm run env:decrypt [password]

# Option C: Manual setup
cp .env.example .env
# Edit .env with your values
```

### **3. Required Configuration**

#### **Database (Required)**
```env
# Option 1: Prisma Accelerate (Recommended - Request API key from project owner)
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"

# Option 2: Local PostgreSQL
DATABASE_URL="postgresql://admin:password@localhost:5432/wfed119_dev"

# Option 3: SQLite (Simple development)
DATABASE_URL="file:./dev.db"
```

#### **AI APIs (Optional)**
```env
ANTHROPIC_API_KEY=sk-ant-api03-...  # Claude API
OPENAI_API_KEY=sk-proj-...          # OpenAI API
```

#### **Google OAuth (Optional)**
```env
GOOGLE_CLIENT_ID=604113547744-...
GOOGLE_CLIENT_SECRET=GOCSPX-...
NEXTAUTH_SECRET=random-secret-string
```

### **4. Start Development**
```bash
npm install
npx prisma generate
npx prisma db push  # If using local database
npm run dev
```

## 🔑 API Key Request Checklist

Items to request from project owner:

### **Required (Database Access)**
- [ ] **Prisma Accelerate API Key** - Shared production database

### **Optional (Full Feature Development)**
- [ ] **Google OAuth Credentials** - User login functionality
- [ ] **Anthropic API Key** - Claude AI features
- [ ] **OpenAI API Key** - GPT AI features

## 🛡️ Security Guidelines

### **Never Do**
❌ Commit .env files to git
❌ Share API keys in plain text via Slack/Discord
❌ Expose API keys in screenshots
❌ Include keys in public GitHub issues/PRs

### **Safe Sharing Methods**
✅ 1Password/Bitwarden team vaults
✅ Encrypted files + password via separate channel
✅ GitHub Secrets (repository secrets)
✅ Environment variable management services (Doppler, Infisical, etc.)

## 📞 Getting Help

### **For Immediate Assistance**
1. Open an issue on GitHub Issues
2. Contact project owner directly
3. Refer to `COLLABORATOR_SETUP.md` documentation

### **Frequently Asked Questions**

**Q: How do I get the Prisma Accelerate API key?**
A: Request it from the project owner (HosungYou). This key provides access to the shared production database.

**Q: Local database setup is too complex**
A: Use SQLite: `DATABASE_URL="file:./dev.db"`

**Q: AI features aren't working**
A: AI API keys are optional. They are not required for backend/database work.

**Q: Google login isn't working**
A: Google OAuth configuration is required. Request the client ID/Secret from the project owner.

## 🔄 Environment Variable Updates

When new environment variables are added:

1. Check `.env.example` file
2. Re-run `npm run setup:env`
3. Or manually add to .env

## 🚀 Production Deployment

Collaborators typically work on development only, but here's production information:

- **Platform**: Render.com
- **Database**: PostgreSQL with Prisma Accelerate
- **Environment Variables**: Managed in Render dashboard
- **Deployment**: Automatic deployment on main branch push