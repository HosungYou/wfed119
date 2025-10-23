# Database Architecture & Access Guide for WFED119

## Table of Contents
- [Overview](#overview)
- [Database Architecture](#database-architecture)
- [Data Models](#data-models)
- [Service Integration](#service-integration)
- [Data Flow](#data-flow)
- [Access Methods](#access-methods)
- [Security & Access Control](#security--access-control)
- [Best Practices](#best-practices)

## Overview

WFED119 employs a dual-database strategy to optimize for both development flexibility and production reliability. The system uses Prisma ORM as the data access layer, providing type-safe database queries and automatic migration management.

### Key Features
- **Dual Database Support**: SQLite for development, PostgreSQL for production
- **Type-Safe ORM**: Prisma with TypeScript integration
- **Microservices Ready**: Support for Redis caching and Qdrant vector database
- **Privacy-First Design**: Local-first data storage with optional cloud sync

## Database Architecture

### Environment-Specific Configuration

```mermaid
graph TD
    A[Application Layer] --> B{Environment}
    B -->|Development| C[SQLite]
    B -->|Production| D[PostgreSQL]

    A --> E[Prisma ORM]
    E --> C
    E --> D

    F[Redis Cache] --> A
    G[Qdrant Vector DB] --> A
```

#### Development Environment
- **Database**: SQLite
- **Location**: `prisma/dev.db`
- **Benefits**: Zero-configuration, file-based, portable

#### Production Environment
- **Database**: PostgreSQL 15
- **Hosting**: Render.com (automated provisioning)
- **Connection**: Environment variable injection via `DATABASE_URL`

## Data Models

### Core Schema Structure

#### 1. Session Model
Manages user interaction sessions and tracks progress through the discovery process.

```prisma
model Session {
  id            String   @id @default(uuid())
  sessionId     String   @unique
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  currentStage  String   @default("initial")
  conversations Conversation[]
  strengths     Strength[]
  completed     Boolean  @default(false)
}
```

**Purpose**: Track user journey through strength discovery process
**Key Relations**: One-to-many with Conversations and Strengths

#### 2. Conversation Model
Stores all chat interactions between users and the AI assistant.

```prisma
model Conversation {
  id        String   @id @default(uuid())
  sessionId String
  session   Session  @relation(fields: [sessionId], references: [sessionId])
  role      String   // "user" or "assistant"
  content   String
  timestamp DateTime @default(now())
  metadata  String?  // JSON string for additional analysis data
}
```

**Purpose**: Maintain conversation history for analysis and continuity
**Metadata Usage**: Stores AI analysis results, confidence scores, and extracted insights

#### 3. Strength Model
Records identified strengths with evidence and categorization.

```prisma
model Strength {
  id         String   @id @default(uuid())
  sessionId  String
  session    Session  @relation(fields: [sessionId], references: [sessionId])
  category   String   // "skill", "attitude", "value"
  name       String
  evidence   String
  confidence Float    // 0-1 confidence score
  createdAt  DateTime @default(now())
}
```

**Categories**:
- `skill`: Technical or practical abilities
- `attitude`: Behavioral traits and mindsets
- `value`: Core beliefs and principles

#### 4. ValueResult Model
Stores value discovery card sorting results.

```prisma
model ValueResult {
  id         String   @id @default(uuid())
  userId     String
  valueSet   String   // 'terminal' | 'instrumental' | 'work'
  layout     Json     // Categorized values by importance
  top3       Json     // Top 3 selected values
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([userId, valueSet])
}
```

**Value Sets**:
- `terminal`: End-state values (life goals)
- `instrumental`: Means values (behavioral modes)
- `work`: Professional values

#### 5. User Model
Manages authenticated users via Google OAuth.

```prisma
model User {
  id        String   @id @default(uuid())
  googleId  String   @unique
  email     String?  @unique
  name      String?
  image     String?
  createdAt DateTime @default(now())
}
```

## Service Integration

### Docker Compose Stack

The application uses Docker Compose for local development with the following services:

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL | 5432 | Primary database |
| Qdrant | 6333 | Vector search for semantic matching |
| Redis | 6379 | Session caching and job queues |
| pgAdmin | 8080 | Database administration UI |

### Render Production Deployment

```yaml
databases:
  - name: lifecraft-db
    databaseName: lifecraft_prod
    user: lifecraft_user
    plan: starter

services:
  - type: web
    name: lifecraft-bot
    runtime: node
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: lifecraft-db
          property: connectionString
```

## Data Flow

### 1. Strength Discovery Flow

```
User Input → Chat API → AI Analysis → Strength Extraction → Database Storage
                ↓                           ↓
          Conversation Table          Strength Table
```

### 2. Value Discovery Flow

```
Card Selection → Categorization → Ranking → Top 3 Selection → ValueResult Storage
```

### 3. Session Management

```
Session Creation → Progress Tracking → Data Persistence → Export Generation
```

## Access Methods

### Development Access

#### 1. Direct SQLite Access
```bash
# Using SQLite CLI
sqlite3 prisma/dev.db

# Common queries
.tables
SELECT * FROM Session;
SELECT * FROM Strength WHERE sessionId = 'xxx';
```

#### 2. Prisma Studio (Recommended)
```bash
# Launch GUI database browser
npx prisma studio
# Opens at http://localhost:5555
```

#### 3. pgAdmin (for PostgreSQL)
```bash
# Start Docker services
docker-compose --profile admin up -d
# Access at http://localhost:8080
# Credentials: admin@wfed119.dev / admin
```

### Production Access

#### 1. Render Dashboard
- Navigate to Database section in Render dashboard
- Use built-in query runner
- Connection details available in settings

#### 2. Remote PostgreSQL Connection
```bash
# Using psql
psql "postgresql://user:password@host:5432/database"

# Using connection string from Render
psql $DATABASE_URL
```

#### 3. Programmatic Access
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});
```

## Security & Access Control

### Current Access Control Mechanisms

1. **Environment-Based Isolation**
   - Development uses local SQLite (file permissions)
   - Production uses PostgreSQL with connection string authentication

2. **API-Level Protection**
   - Session-based access control
   - Google OAuth for authenticated features
   - Rate limiting on API endpoints

3. **Database Credentials**
   - Stored in environment variables
   - Never committed to version control
   - Render auto-injects production credentials

### Granting Database Access to Team Members

#### For Development Environment

1. **Repository Access**
   ```bash
   # Team member clones repository
   git clone https://github.com/HosungYou/wfed119.git

   # Initialize local database
   npx prisma generate
   npx prisma db push
   ```

2. **Shared Development Database (PostgreSQL)**
   ```bash
   # Start shared PostgreSQL
   docker-compose up -d postgres

   # Share connection string securely
   DATABASE_URL="postgresql://admin:wfed119_dev_password@localhost:5432/wfed119"
   ```

#### For Production Environment

1. **Read-Only Access**
   - Create read-only database user in Render
   - Share connection string with limited permissions
   ```sql
   CREATE USER readonly_user WITH PASSWORD 'secure_password';
   GRANT CONNECT ON DATABASE lifecraft_prod TO readonly_user;
   GRANT USAGE ON SCHEMA public TO readonly_user;
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
   ```

2. **Full Access (Administrators Only)**
   - Add team members as collaborators in Render dashboard
   - Enable two-factor authentication
   - Use environment-specific access tokens

3. **Audit and Monitoring**
   - Enable query logging in production
   - Set up alerts for unusual access patterns
   - Regular review of access logs

### Best Practices for Access Management

1. **Principle of Least Privilege**
   - Grant minimum necessary permissions
   - Use read-only accounts for analytics
   - Separate development and production access

2. **Secure Credential Sharing**
   - Use password managers for team credentials
   - Rotate passwords regularly
   - Never share credentials via unencrypted channels

3. **Access Auditing**
   ```sql
   -- Track who accessed what
   CREATE TABLE audit_log (
     id SERIAL PRIMARY KEY,
     user_name VARCHAR(255),
     action VARCHAR(50),
     table_name VARCHAR(255),
     timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

4. **VPN/SSH Tunneling for Remote Access**
   ```bash
   # SSH tunnel to production database
   ssh -L 5432:localhost:5432 user@production-server

   # Connect through tunnel
   psql -h localhost -p 5432 -U dbuser -d lifecraft_prod
   ```

## Best Practices

### 1. Migration Management
```bash
# Create migration after schema changes
npx prisma migrate dev --name descriptive_name

# Apply migrations in production
npx prisma migrate deploy
```

### 2. Data Backup Strategy
```bash
# Development backup
cp prisma/dev.db prisma/dev.db.backup

# Production backup (automated via Render)
# Manual backup via pg_dump
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### 3. Performance Optimization
- Index frequently queried fields
- Use connection pooling in production
- Implement Redis caching for session data
- Batch database operations where possible

### 4. Data Privacy Compliance
- Implement data retention policies
- Provide data export functionality
- Support user data deletion requests
- Encrypt sensitive data at rest

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if database service is running
   - Verify connection string format
   - Ensure network connectivity

2. **Migration Conflicts**
   - Reset development database: `npx prisma migrate reset`
   - Force push schema: `npx prisma db push --force-reset`

3. **Performance Issues**
   - Check query performance: `EXPLAIN ANALYZE <query>`
   - Review database indexes
   - Monitor connection pool usage

## Support and Documentation

- **Prisma Documentation**: https://www.prisma.io/docs
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **Render Documentation**: https://render.com/docs
- **Project Issues**: https://github.com/HosungYou/wfed119/issues

---

*Last Updated: September 2024*
*Version: 1.0.0*