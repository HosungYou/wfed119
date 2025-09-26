const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyMigration() {
  try {
    console.log('🔍 Starting migration verification...');

    // Basic counts
    const counts = {
      users: await prisma.user.count(),
      sessions: await prisma.session.count(),
      userSessions: await prisma.userSession.count(),
      valueResults: await prisma.valueResult.count(),
      strengths: await prisma.strength.count(),
      conversations: await prisma.conversation.count()
    };

    console.log('📊 Current data counts:');
    console.log(`👤 Users: ${counts.users}`);
    console.log(`🔐 Sessions: ${counts.sessions}`);
    console.log(`🔗 User Sessions: ${counts.userSessions}`);
    console.log(`❤️ Value Results: ${counts.valueResults}`);
    console.log(`💪 Strengths: ${counts.strengths}`);
    console.log(`💬 Conversations: ${counts.conversations}`);

    // Data integrity checks
    console.log('\n🔍 Performing data integrity checks...');

    // Check for orphaned UserSessions
    const orphanedUserSessions = await prisma.userSession.count({
      where: {
        user: null
      }
    });

    // Check for orphaned Strengths
    const orphanedStrengths = await prisma.strength.count({
      where: {
        session: null
      }
    });

    // Check for orphaned Conversations
    const orphanedConversations = await prisma.conversation.count({
      where: {
        session: null
      }
    });

    // Check for orphaned Value Results
    const orphanedValueResults = await prisma.valueResult.count({
      where: {
        user: null
      }
    });

    console.log('🔗 Orphaned records check:');
    console.log(`🔗 Orphaned User Sessions: ${orphanedUserSessions}`);
    console.log(`💪 Orphaned Strengths: ${orphanedStrengths}`);
    console.log(`💬 Orphaned Conversations: ${orphanedConversations}`);
    console.log(`❤️ Orphaned Value Results: ${orphanedValueResults}`);

    // User role distribution
    const roleDistribution = await prisma.user.groupBy({
      by: ['role'],
      _count: true
    });

    console.log('\n👥 User role distribution:');
    roleDistribution.forEach(role => {
      console.log(`${role.role}: ${role._count}`);
    });

    // Value set distribution
    const valueSetDistribution = await prisma.valueResult.groupBy({
      by: ['valueSet'],
      _count: true
    });

    console.log('\n❤️ Value set distribution:');
    valueSetDistribution.forEach(set => {
      console.log(`${set.valueSet}: ${set._count}`);
    });

    // Strength category distribution
    const strengthCategories = await prisma.strength.groupBy({
      by: ['category'],
      _count: true
    });

    console.log('\n💪 Strength category distribution:');
    strengthCategories.forEach(cat => {
      console.log(`${cat.category}: ${cat._count}`);
    });

    // Session completion rates
    const sessionStats = await prisma.userSession.groupBy({
      by: ['sessionType', 'completed'],
      _count: true
    });

    console.log('\n📈 Session completion rates:');
    const completionMap = {};
    sessionStats.forEach(stat => {
      if (!completionMap[stat.sessionType]) {
        completionMap[stat.sessionType] = { total: 0, completed: 0 };
      }
      completionMap[stat.sessionType].total += stat._count;
      if (stat.completed) {
        completionMap[stat.sessionType].completed += stat._count;
      }
    });

    Object.entries(completionMap).forEach(([type, stats]) => {
      const rate = ((stats.completed / stats.total) * 100).toFixed(1);
      console.log(`${type}: ${stats.completed}/${stats.total} (${rate}%)`);
    });

    // Sample data checks
    console.log('\n🎯 Sample data verification:');

    // Check a random user's data completeness
    const sampleUser = await prisma.user.findFirst({
      include: {
        valueResults: true,
        sessions: true,
        _count: {
          select: {
            valueResults: true,
            sessions: true
          }
        }
      }
    });

    if (sampleUser) {
      console.log(`Sample user ${sampleUser.email}:`);
      console.log(`- Value results: ${sampleUser._count.valueResults}`);
      console.log(`- Sessions: ${sampleUser._count.sessions}`);
    }

    // Overall health score
    let healthScore = 100;
    const issues = [];

    if (orphanedUserSessions > 0) {
      healthScore -= 10;
      issues.push(`${orphanedUserSessions} orphaned user sessions`);
    }

    if (orphanedStrengths > 0) {
      healthScore -= 10;
      issues.push(`${orphanedStrengths} orphaned strengths`);
    }

    if (orphanedConversations > 0) {
      healthScore -= 10;
      issues.push(`${orphanedConversations} orphaned conversations`);
    }

    if (orphanedValueResults > 0) {
      healthScore -= 10;
      issues.push(`${orphanedValueResults} orphaned value results`);
    }

    if (counts.users === 0) {
      healthScore -= 30;
      issues.push('No users found');
    }

    console.log(`\n🏥 Migration Health Score: ${healthScore}/100`);

    if (issues.length > 0) {
      console.log('⚠️ Issues found:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('✅ All integrity checks passed');
    }

    // Performance test
    console.log('\n⚡ Performance test:');
    const start = Date.now();
    await prisma.user.findMany({
      include: {
        valueResults: true,
        sessions: {
          include: {
            strengths: true
          }
        }
      },
      take: 10
    });
    const duration = Date.now() - start;
    console.log(`Complex query execution time: ${duration}ms`);

    console.log('\n🎉 Migration verification completed!');

    return {
      success: true,
      healthScore,
      issues,
      counts
    };

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  verifyMigration()
    .then(result => {
      if (result.healthScore >= 90) {
        console.log('✨ Migration verification passed with excellent health');
        process.exit(0);
      } else if (result.healthScore >= 70) {
        console.log('⚠️ Migration verification passed with warnings');
        process.exit(0);
      } else {
        console.log('❌ Migration verification found significant issues');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Verification failed:', error);
      process.exit(1);
    });
}

module.exports = verifyMigration;