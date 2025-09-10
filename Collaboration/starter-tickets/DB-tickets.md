# Database Workstream Starter Tickets

## DB-01: Local Postgres in Docker

**Priority:** P1 (Week 1)  
**Owner:** @jonathan  
**Type:** setup  
**Estimate:** 3 hours

### Definition of Ready
- [ ] Docker Desktop installed
- [ ] Access to project repository
- [ ] `.env.example` available

### Acceptance Criteria
- [ ] PostgreSQL 15+ running in Docker
- [ ] Named volume for data persistence
- [ ] Healthcheck configured
- [ ] `init.sql` creates initial database
- [ ] Local connection verified with psql

### Implementation Steps
1. Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    container_name: wfed119-db
    environment:
      POSTGRES_DB: wfed119
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres-data:
```

2. Create `init.sql` with initial setup
3. Test connection: `psql -h localhost -U admin -d wfed119`
4. Document connection string format

### Definition of Done
- [ ] Code merged to main
- [ ] README updated with setup instructions
- [ ] Screenshot of successful connection
- [ ] Peer review completed

---

## DB-02: ERD v0 and Core Tables

**Priority:** P1 (Week 1)  
**Owner:** @jonathan  
**Type:** feature  
**Estimate:** 4 hours

### Definition of Ready
- [ ] DB-01 completed
- [ ] ERD tool available (dbdiagram.io/draw.io)
- [ ] Requirements document reviewed

### Acceptance Criteria
- [ ] ERD diagram created and exported
- [ ] DDL script for all core tables
- [ ] Tables created successfully
- [ ] Sample data inserted

### Core Tables Required
```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'educator', 'admin')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Courses table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    semester VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enrollments table
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    course_id UUID REFERENCES courses(id),
    enrolled_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id),
    title VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    content_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Vector metadata table
CREATE TABLE vector_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id),
    chunk_id VARCHAR(255) NOT NULL,
    embedding_model VARCHAR(100),
    embedding_version VARCHAR(20),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Interactions table
CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    service_type VARCHAR(50),
    request_data JSONB,
    response_data JSONB,
    latency_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Definition of Done
- [ ] ERD diagram in `/docs/database/`
- [ ] DDL script executable
- [ ] Tables verified with `\dt` in psql
- [ ] Sample data script included

---

## DB-03: Migrations Tool Setup

**Priority:** P1 (Week 1)  
**Owner:** @trivikram  
**Type:** setup  
**Estimate:** 3 hours

### Definition of Ready
- [ ] DB-02 completed
- [ ] Prisma or Alembic chosen
- [ ] Node.js/Python environment ready

### Acceptance Criteria
- [ ] Migration tool installed and configured
- [ ] Initial migration created from existing schema
- [ ] Forward migration tested
- [ ] Rollback tested successfully

### Implementation (Prisma)
```bash
# Install Prisma
npm install prisma --save-dev
npm install @prisma/client

# Initialize Prisma
npx prisma init

# Pull existing schema
npx prisma db pull

# Create migration
npx prisma migrate dev --name init

# Test rollback
npx prisma migrate reset
```

### Implementation (Alembic)
```bash
# Install Alembic
pip install alembic

# Initialize Alembic
alembic init migrations

# Create initial migration
alembic revision --autogenerate -m "Initial schema"

# Run migration
alembic upgrade head

# Test rollback
alembic downgrade -1
```

### Definition of Done
- [ ] Migration tool configured
- [ ] Initial migration in version control
- [ ] Migration commands documented
- [ ] Rollback verified

---

## DB-04: Seed Script

**Priority:** P1 (Week 1)  
**Owner:** @trivikram  
**Type:** feature  
**Estimate:** 2 hours

### Definition of Ready
- [ ] DB-03 completed
- [ ] Test data requirements clear
- [ ] Faker library available

### Acceptance Criteria
- [ ] Script creates 10 users
- [ ] Script creates 2 courses
- [ ] Script creates 50 documents
- [ ] Script creates 100 interactions
- [ ] Idempotent execution

### Implementation
```javascript
// seed.js
const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

async function seed() {
  // Clear existing data
  await prisma.interaction.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.vectorMetadata.deleteMany();
  await prisma.document.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const users = [];
  for (let i = 0; i < 10; i++) {
    users.push(await prisma.user.create({
      data: {
        email: faker.internet.email(),
        role: i < 8 ? 'student' : 'educator'
      }
    }));
  }

  // Continue with courses, documents, interactions...
}

seed().then(() => {
  console.log('Seeding completed');
  prisma.$disconnect();
});
```

### Definition of Done
- [ ] Seed script runnable
- [ ] Row counts verified
- [ ] Script in `/scripts/`
- [ ] README updated

---

## DB-05: Read Models for RAG

**Priority:** P2 (Week 1)  
**Owner:** @jonathan  
**Type:** feature  
**Estimate:** 3 hours

### Definition of Ready
- [ ] DB-04 completed
- [ ] RAG service requirements understood
- [ ] View naming convention agreed

### Acceptance Criteria
- [ ] Views created for document search
- [ ] Views expose clean field names
- [ ] No complex joins in views
- [ ] RAG can query without raw SQL

### Required Views
```sql
-- Document search view
CREATE VIEW v_rag_documents AS
SELECT 
    d.id as document_id,
    d.title,
    d.file_path,
    c.code as course_code,
    c.name as course_name,
    d.created_at
FROM documents d
JOIN courses c ON d.course_id = c.id;

-- Chunk metadata view
CREATE VIEW v_rag_chunks AS
SELECT 
    vm.id as metadata_id,
    vm.document_id,
    vm.chunk_id,
    vm.embedding_model,
    vm.metadata,
    d.title as document_title
FROM vector_metadata vm
JOIN documents d ON vm.document_id = d.id;

-- User interactions view
CREATE VIEW v_user_interactions AS
SELECT 
    i.id as interaction_id,
    u.email as user_email,
    u.role as user_role,
    i.service_type,
    i.latency_ms,
    i.created_at
FROM interactions i
JOIN users u ON i.user_id = u.id;
```

### Definition of Done
- [ ] Views created and tested
- [ ] View definitions in migration
- [ ] RAG service can query views
- [ ] Performance acceptable

---

## DB-06: Backup and Restore Runbook

**Priority:** P1 (Week 2)  
**Owner:** @jonathan  
**Type:** quality  
**Estimate:** 3 hours

### Definition of Ready
- [ ] Database has production data
- [ ] Backup location identified
- [ ] Restore test environment ready

### Acceptance Criteria
- [ ] Automated backup script
- [ ] Backup runs nightly
- [ ] Restore tested successfully
- [ ] Recovery time < 5 minutes

### Implementation
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="wfed119"

# Create backup
pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_DIR/backup_$TIMESTAMP.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

# Test restore (separate script)
createdb wfed119_restore
psql -h localhost -U $DB_USER -d wfed119_restore < $BACKUP_DIR/latest.sql
```

### Definition of Done
- [ ] Backup script in `/scripts/`
- [ ] Cron job configured
- [ ] Restore tested and timed
- [ ] Runbook documented

---

## DB-07: Row Level Security Starter

**Priority:** P2 (Week 2)  
**Owner:** @trivikram  
**Type:** security  
**Estimate:** 4 hours

### Definition of Ready
- [ ] User roles defined
- [ ] Security requirements clear
- [ ] RLS examples reviewed

### Acceptance Criteria
- [ ] RLS enabled on interactions table
- [ ] Students see only their data
- [ ] Educators see all student data
- [ ] Policies tested with different roles

### Implementation
```sql
-- Enable RLS
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

-- Policy for students
CREATE POLICY student_interactions ON interactions
    FOR ALL
    TO student_role
    USING (user_id = current_user_id());

-- Policy for educators
CREATE POLICY educator_interactions ON interactions
    FOR ALL
    TO educator_role
    USING (true);

-- Create roles
CREATE ROLE student_role;
CREATE ROLE educator_role;

-- Grant permissions
GRANT SELECT, INSERT ON interactions TO student_role;
GRANT ALL ON interactions TO educator_role;
```

### Definition of Done
- [ ] RLS policies created
- [ ] Test cases pass
- [ ] Documentation updated
- [ ] Security review completed