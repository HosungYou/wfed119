const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function rollbackToSQLite() {
  try {
    console.log('🔄 Starting rollback to SQLite...');

    const projectRoot = process.cwd();
    const backupDir = path.join(projectRoot, 'backup');

    // Step 1: Restore schema
    console.log('📄 Restoring SQLite schema...');
    const sqliteSchemaBackup = path.join(projectRoot, 'prisma', 'schema.sqlite.backup');
    const currentSchema = path.join(projectRoot, 'prisma', 'schema.prisma');

    if (fs.existsSync(sqliteSchemaBackup)) {
      fs.copyFileSync(sqliteSchemaBackup, currentSchema);
      console.log('✅ Schema restored from backup');
    } else {
      console.log('⚠️ No schema backup found, creating default SQLite schema...');
      // Create basic SQLite schema if backup doesn't exist
      const defaultSchema = `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  googleId  String   @unique
  email     String?  @unique
  name      String?
  image     String?
  createdAt DateTime @default(now())
}

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

model Conversation {
  id        String   @id @default(uuid())
  sessionId String
  session   Session  @relation(fields: [sessionId], references: [sessionId])
  role      String
  content   String
  timestamp DateTime @default(now())
  metadata  String?
}

model Strength {
  id         String   @id @default(uuid())
  sessionId  String
  session    Session  @relation(fields: [sessionId], references: [sessionId])
  category   String
  name       String
  evidence   String
  confidence Float
  createdAt  DateTime @default(now())
}

model ValueResult {
  id         String   @id @default(uuid())
  userId     String
  valueSet   String
  layout     Json
  top3       Json
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([userId, valueSet])
}
`;
      fs.writeFileSync(currentSchema, defaultSchema);
      console.log('✅ Default SQLite schema created');
    }

    // Step 2: Update environment variables
    console.log('🔧 Updating environment variables...');
    const envPath = path.join(projectRoot, '.env');
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Comment out PostgreSQL URL and restore SQLite URL
    envContent = envContent.replace(
      /^DATABASE_URL="postgresql:\/\/.*$/gm,
      '# DATABASE_URL="postgresql://..." # Commented out during rollback'
    );

    if (!envContent.includes('DATABASE_URL="file:./dev.db"')) {
      envContent += '\nDATABASE_URL="file:./dev.db"\n';
    }

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Environment variables updated');

    // Step 3: Restore database file
    console.log('🗄️ Restoring SQLite database...');
    const currentDb = path.join(projectRoot, 'prisma', 'dev.db');

    // Find most recent backup
    if (fs.existsSync(backupDir)) {
      const backupFiles = fs.readdirSync(backupDir)
        .filter(f => f.endsWith('.db'))
        .sort()
        .reverse();

      if (backupFiles.length > 0) {
        const latestBackup = path.join(backupDir, backupFiles[0]);
        fs.copyFileSync(latestBackup, currentDb);
        console.log(`✅ Database restored from ${backupFiles[0]}`);
      } else {
        console.log('⚠️ No database backup found, will create new database');
      }
    }

    // Step 4: Regenerate Prisma client
    console.log('🔄 Regenerating Prisma client...');
    try {
      execSync('npx prisma generate', { stdio: 'pipe' });
      console.log('✅ Prisma client regenerated');
    } catch (error) {
      console.error('❌ Failed to regenerate Prisma client:', error.message);
      throw error;
    }

    // Step 5: Run database migrations (if needed)
    console.log('🔄 Applying database migrations...');
    try {
      execSync('npx prisma db push', { stdio: 'pipe' });
      console.log('✅ Database migrations applied');
    } catch (error) {
      console.log('⚠️ Database push failed, this is normal for rollback');
    }

    // Step 6: Verify rollback
    console.log('🔍 Verifying rollback...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Database connection verified - ${userCount} users found`);
      await prisma.$disconnect();
    } catch (error) {
      console.error('❌ Database verification failed:', error.message);
      throw error;
    }

    console.log('🎉 Rollback to SQLite completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Restart your development server: npm run dev');
    console.log('2. Test application functionality');
    console.log('3. Check data integrity');

    return {
      success: true,
      message: 'Rollback completed successfully'
    };

  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  rollbackToSQLite()
    .then(result => {
      console.log('✨ Rollback completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Rollback failed:', error);
      process.exit(1);
    });
}

module.exports = rollbackToSQLite;