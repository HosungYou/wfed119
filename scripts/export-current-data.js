const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportData() {
  try {
    console.log('🔄 Starting data export...');

    // Ensure backup directory exists
    const backupDir = path.join(process.cwd(), 'backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Export all data
    const data = {
      metadata: {
        exportedAt: new Date().toISOString(),
        databaseType: 'sqlite',
        version: '1.0'
      },
      users: await prisma.user.findMany(),
      sessions: await prisma.session.findMany(),
      userSessions: await prisma.userSession.findMany(),
      conversations: await prisma.conversation.findMany(),
      strengths: await prisma.strength.findMany(),
      valueResults: await prisma.valueResult.findMany()
    };

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `data_export_${timestamp}.json`;
    const filepath = path.join(backupDir, filename);

    // Write data to file
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

    // Log summary
    console.log('✅ Data exported successfully');
    console.log(`📁 File: ${filepath}`);
    console.log(`👤 Users: ${data.users.length}`);
    console.log(`🔐 Sessions: ${data.sessions.length}`);
    console.log(`🔗 User Sessions: ${data.userSessions.length}`);
    console.log(`💬 Conversations: ${data.conversations.length}`);
    console.log(`💪 Strengths: ${data.strengths.length}`);
    console.log(`❤️ Value Results: ${data.valueResults.length}`);

    // Create latest symlink
    const latestPath = path.join(backupDir, 'latest_export.json');
    if (fs.existsSync(latestPath)) {
      fs.unlinkSync(latestPath);
    }
    fs.symlinkSync(filename, latestPath);

    console.log('🔗 Created latest_export.json symlink');

    return {
      success: true,
      filename,
      counts: {
        users: data.users.length,
        sessions: data.sessions.length,
        userSessions: data.userSessions.length,
        conversations: data.conversations.length,
        strengths: data.strengths.length,
        valueResults: data.valueResults.length
      }
    };

  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  exportData()
    .then(result => {
      console.log('🎉 Export completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Export failed:', error);
      process.exit(1);
    });
}

module.exports = exportData;