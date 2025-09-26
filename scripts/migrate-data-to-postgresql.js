const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function migrateData() {
  try {
    console.log('🚀 Starting PostgreSQL migration...');

    // Find latest backup file
    const backupDir = path.join(process.cwd(), 'backup');
    const latestExportPath = path.join(backupDir, 'latest_export.json');

    if (!fs.existsSync(latestExportPath)) {
      throw new Error('No export file found. Please run export-current-data.js first.');
    }

    console.log('📁 Loading data from latest export...');
    const backupData = JSON.parse(fs.readFileSync(latestExportPath, 'utf8'));

    console.log('📊 Data to migrate:');
    console.log(`👤 Users: ${backupData.users.length}`);
    console.log(`🔐 Sessions: ${backupData.sessions.length}`);
    console.log(`🔗 User Sessions: ${backupData.userSessions.length}`);
    console.log(`💬 Conversations: ${backupData.conversations.length}`);
    console.log(`💪 Strengths: ${backupData.strengths.length}`);
    console.log(`❤️ Value Results: ${backupData.valueResults.length}`);

    // Test database connection
    console.log('🔍 Testing PostgreSQL connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ PostgreSQL connection successful');

    // Clear existing data (if any)
    console.log('🧹 Clearing existing data...');
    await prisma.conversation.deleteMany({});
    await prisma.strength.deleteMany({});
    await prisma.userSession.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.valueResult.deleteMany({});
    await prisma.user.deleteMany({});

    // Migrate Users first (required for foreign keys)
    if (backupData.users.length > 0) {
      console.log('👤 Migrating users...');
      const users = backupData.users.map(user => ({
        ...user,
        createdAt: new Date(user.createdAt)
      }));

      await prisma.user.createMany({
        data: users,
        skipDuplicates: true
      });
      console.log(`✅ Users migrated: ${users.length}`);
    }

    // Migrate Sessions (legacy)
    if (backupData.sessions.length > 0) {
      console.log('🔐 Migrating legacy sessions...');
      const sessions = backupData.sessions.map(session => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt)
      }));

      await prisma.session.createMany({
        data: sessions,
        skipDuplicates: true
      });
      console.log(`✅ Legacy sessions migrated: ${sessions.length}`);
    }

    // Migrate UserSessions
    if (backupData.userSessions.length > 0) {
      console.log('🔗 Migrating user sessions...');
      const userSessions = backupData.userSessions.map(session => ({
        ...session,
        startedAt: new Date(session.startedAt),
        completedAt: session.completedAt ? new Date(session.completedAt) : null,
        updatedAt: new Date(session.updatedAt)
      }));

      await prisma.userSession.createMany({
        data: userSessions,
        skipDuplicates: true
      });
      console.log(`✅ User sessions migrated: ${userSessions.length}`);
    }

    // Migrate Value Results
    if (backupData.valueResults.length > 0) {
      console.log('❤️ Migrating value results...');
      const valueResults = backupData.valueResults.map(result => ({
        ...result,
        createdAt: new Date(result.createdAt),
        updatedAt: new Date(result.updatedAt)
      }));

      await prisma.valueResult.createMany({
        data: valueResults,
        skipDuplicates: true
      });
      console.log(`✅ Value results migrated: ${valueResults.length}`);
    }

    // Migrate Strengths
    if (backupData.strengths.length > 0) {
      console.log('💪 Migrating strengths...');
      const strengths = backupData.strengths.map(strength => ({
        ...strength,
        createdAt: new Date(strength.createdAt)
      }));

      await prisma.strength.createMany({
        data: strengths,
        skipDuplicates: true
      });
      console.log(`✅ Strengths migrated: ${strengths.length}`);
    }

    // Migrate Conversations
    if (backupData.conversations.length > 0) {
      console.log('💬 Migrating conversations...');
      const conversations = backupData.conversations.map(conv => ({
        ...conv,
        timestamp: new Date(conv.timestamp)
      }));

      await prisma.conversation.createMany({
        data: conversations,
        skipDuplicates: true
      });
      console.log(`✅ Conversations migrated: ${conversations.length}`);
    }

    // Verify migration
    console.log('🔍 Verifying migration...');
    const finalCounts = {
      users: await prisma.user.count(),
      sessions: await prisma.session.count(),
      userSessions: await prisma.userSession.count(),
      valueResults: await prisma.valueResult.count(),
      strengths: await prisma.strength.count(),
      conversations: await prisma.conversation.count()
    };

    console.log('📊 Final counts:');
    console.log(`👤 Users: ${finalCounts.users}`);
    console.log(`🔐 Sessions: ${finalCounts.sessions}`);
    console.log(`🔗 User Sessions: ${finalCounts.userSessions}`);
    console.log(`❤️ Value Results: ${finalCounts.valueResults}`);
    console.log(`💪 Strengths: ${finalCounts.strengths}`);
    console.log(`💬 Conversations: ${finalCounts.conversations}`);

    console.log('🎉 PostgreSQL migration completed successfully!');

    return {
      success: true,
      counts: finalCounts
    };

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  migrateData()
    .then(result => {
      console.log('✨ Migration completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateData;