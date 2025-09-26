# WFED119 Admin Setup and Operations Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Admin Permission Setup](#admin-permission-setup)
3. [Admin Dashboard Access](#admin-dashboard-access)
4. [Environment Variable Sharing](#environment-variable-sharing)
5. [Collaborator Setup](#collaborator-setup)
6. [Database Management](#database-management)
7. [Troubleshooting](#troubleshooting)

---

## System Overview

### Technology Stack
- **Frontend**: Next.js 15 with App Router
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth
- **Deployment**: Render.com

### User Permission System
```
USER         - Regular user (default)
ADMIN        - Admin privileges
SUPER_ADMIN  - Super admin privileges (access to all features)
```

---

## Admin Permission Setup

### Method 1: Code Modification (Recommended)

**File**: `src/app/api/auth/[...nextauth]/route.ts`

```javascript
const superAdminEmails = [
  'newhosung@gmail.com',
  'tvs5971@psu.edu',
  // Add additional SUPER_ADMIN emails here
  'collaborator@example.com',
];
```

**Advantages**:
- Immediate application
- Change history management through Git
- Automatic deployment reflection

### Method 2: Promote Existing Users

```bash
# Promote specific user to SUPER_ADMIN
npm run admin:promote user@example.com

# Or run script directly
node scripts/promote-user-to-admin.js user@example.com
```

**Requirement**: User must have signed in with Google at least once to create their account

### Method 3: Environment Variables

```bash
# Add to .env file
SUPER_ADMIN_EMAILS="newhosung@gmail.com,tvs5971@psu.edu,collaborator@example.com"

# Run setup script
npm run admin:env-setup
```

**Advantages**:
- Manage without code changes
- Different admin settings per environment

---

## Admin Dashboard Access

### Access Method

1. **Visit Main Site**
   ```
   https://wfed119-1.onrender.com
   ```

2. **Sign In with Google Account**
   - Use email registered as SUPER_ADMIN
   - Currently registered accounts:
     - `newhosung@gmail.com`
     - `tvs5971@psu.edu`

3. **Access Admin Dashboard**
   ```
   https://wfed119-1.onrender.com/admin/database
   ```

### Dashboard Features

- **User Management**: Complete user list and permission management
- **Session Data**: User session and progress monitoring
- **Value Analysis Results**: Values Discovery results viewing
- **Strength Analysis Data**: Strengths Discovery data management
- **Audit Logs**: Admin action history tracking

---

## Environment Variable Sharing

### Encryption-Based Sharing (Recommended)

1. **Encrypt Environment Variables**
   ```bash
   # Encrypt (example: using password 36639685)
   npm run env:encrypt
   # Or
   node scripts/simple-encrypt-env.js encrypt
   ```

2. **Share Encrypted File**
   - Share `env.encrypted` file securely
   - Use Slack, Discord, email, etc.

3. **Decrypt**
   ```bash
   # Decrypt
   npm run env:decrypt
   # Or
   node scripts/simple-encrypt-env.js decrypt
   ```

### Other Sharing Methods

#### Using GitHub Secrets
```bash
# Repository Settings > Secrets and variables > Actions
# Add each environment variable individually
DATABASE_URL=...
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

#### Using 1Password
```bash
# Store .env file in 1Password
# Set up shared vault with team members
```

---

## Collaborator Setup

### Adding GitHub Collaborators

Currently registered collaborators:
- **Cloudhoppr**: Backend specialist
- **AlrJohn**: Database administrator
- **JohnAR17**: API developer

### Collaborator Development Environment Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-username/WFED119.git
   cd WFED119
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Variable Setup**
   ```bash
   # Decrypt encrypted environment variables
   npm run env:decrypt

   # Or create .env.local directly
   cp .env.example .env.local
   ```

4. **Verify Database Connection**
   ```bash
   npx prisma generate --schema=prisma/schema.postgres.prisma
   npx prisma db push --schema=prisma/schema.postgres.prisma
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```

### Grant Collaborator Permissions

```bash
# Promote collaborator to SUPER_ADMIN
npm run admin:promote collaborator@email.com

# Or add directly in code (see Method 1)
```

---

## Database Management

### Schema Structure

```sql
-- User Table
User {
  id: String (UUID)
  googleId: String (unique)
  email: String (unique)
  name: String
  image: String
  role: UserRole (USER/ADMIN/SUPER_ADMIN)
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
}

-- User Session
UserSession {
  id: String (UUID)
  userId: String
  sessionId: String (unique)
  sessionType: String
  currentStage: String
  completed: Boolean
  completedAt: DateTime
  startedAt: DateTime
  updatedAt: DateTime
}

-- Audit Log
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

### Useful Commands

```bash
# Prisma Studio (GUI database management)
npm run db:studio

# Push database schema
npx prisma db push --schema=prisma/schema.postgres.prisma

# Database migration
npm run migrate:enhanced

# Migration verification
npm run migrate:verify
```

---

## Troubleshooting

### Common Issues

#### 1. "Access denied. SUPER_ADMIN role required" Error

**Solutions**:
```bash
# 1. Check if user exists in database
npm run db:studio

# 2. Manually promote user permissions
npm run admin:promote your-email@example.com

# 3. Verify email addition in code
# Check superAdminEmails array in src/app/api/auth/[...nextauth]/route.ts
```

#### 2. Database Connection Error

**Solutions**:
```bash
# 1. Check DATABASE_URL environment variable
echo $DATABASE_URL

# 2. Regenerate Prisma client
npx prisma generate --schema=prisma/schema.postgres.prisma

# 3. Synchronize database schema
npx prisma db push --schema=prisma/schema.postgres.prisma
```

#### 3. OAuth Authentication Failure

**Check Items**:
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables
- OAuth configuration in Google Cloud Console
- Authorized redirect URIs setup

### Log Checking

```bash
# Development environment logs
npm run dev

# Production logs (check in Render dashboard)
# https://dashboard.render.com
```

---

## Security Considerations

### Environment Variable Security
- Do not commit `.env` files to Git
- Share only encrypted environment variables
- Regular API key rotation

### Access Permission Management
- Grant SUPER_ADMIN permissions to minimal personnel only
- Regular user permission reviews
- Track admin actions through audit logs

### Database Security
- Production database backups
- Sensitive data encryption
- Regular security updates

---

## Contact

For technical issues or permission-related inquiries:
- **Primary Admin**: newhosung@gmail.com
- **Secondary Admin**: tvs5971@psu.edu

---

*Last Updated: 2025-09-26*