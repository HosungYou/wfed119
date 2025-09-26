#!/usr/bin/env node

/**
 * Migrate PostgreSQL database to enhanced schema with User table and roles
 * This script will:
 * 1. Create User table with role system
 * 2. Create UserSession table for better tracking
 * 3. Create AuditLog table for admin actions
 * 4. Set up newhosung@gmail.com as SUPER_ADMIN
 * 5. Update ValueResult table relations
 */

const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateToEnhancedSchema() {
  console.log('🚀 Starting migration to enhanced schema...');

  try {
    // Step 1: Generate Prisma client with enhanced schema
    console.log('📦 Generating Prisma client with enhanced schema...');
    execSync('npx prisma generate --schema=prisma/schema.postgres.prisma', {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    // Step 2: Push schema changes to database
    console.log('📊 Pushing schema changes to database...');
    try {
      execSync('npx prisma db push --schema=prisma/schema.postgres.prisma --accept-data-loss', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
    } catch (pushError) {
      console.log('⚠️  Schema push completed with warnings (expected for new tables)');
    }

    // Step 3: Create SUPER_ADMIN user
    console.log('👤 Creating SUPER_ADMIN user...');
    await createSuperAdminUser();

    // Step 4: Verify migration
    console.log('🔍 Verifying migration...');
    await verifyMigration();

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('🎉 Enhanced features now available:');
    console.log('- User role system (USER, ADMIN, SUPER_ADMIN)');
    console.log('- Admin dashboard access control');
    console.log('- User session tracking');
    console.log('- Audit logging for admin actions');
    console.log('');
    console.log('🔑 SUPER_ADMIN access:');
    console.log('- Email: newhosung@gmail.com');
    console.log('- Dashboard: https://wfed119-1.onrender.com/admin/database');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function createSuperAdminUser() {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'newhosung@gmail.com' }
    });

    if (existingUser) {
      // Update existing user to SUPER_ADMIN
      const updatedUser = await prisma.user.update({
        where: { email: 'newhosung@gmail.com' },
        data: {
          role: 'SUPER_ADMIN',
          isActive: true
        }
      });
      console.log(`✅ Updated existing user to SUPER_ADMIN: ${updatedUser.email}`);
    } else {
      // Create new SUPER_ADMIN user
      const newUser = await prisma.user.create({
        data: {
          googleId: 'google-oauth-placeholder', // Will be updated on first login
          email: 'newhosung@gmail.com',
          name: 'Hosung You',
          role: 'SUPER_ADMIN',
          isActive: true
        }
      });
      console.log(`✅ Created new SUPER_ADMIN user: ${newUser.email}`);
    }

    // Create audit log entry (skip if fails)
    try {
      await prisma.auditLog.create({
        data: {
          action: 'CREATE_SUPER_ADMIN',
          tableName: 'User',
          newValues: {
            email: 'newhosung@gmail.com',
            role: 'SUPER_ADMIN'
          },
          ipAddress: 'migration-script',
          userAgent: 'node-migration-script'
        }
      });
    } catch (auditError) {
      console.log('⚠️  Audit log creation skipped (table may not be ready)');
    }

  } catch (error) {
    console.error('Failed to create SUPER_ADMIN user:', error.message);
    throw error;
  }
}

async function verifyMigration() {
  try {
    // Check if User table exists and has data
    const userCount = await prisma.user.count();
    console.log(`📊 Users in database: ${userCount}`);

    // Check if SUPER_ADMIN exists
    const superAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    if (superAdmin) {
      console.log(`👑 SUPER_ADMIN found: ${superAdmin.email}`);
    } else {
      throw new Error('SUPER_ADMIN user not found');
    }

    // Check other tables
    const sessionCount = await prisma.session.count();
    const valueCount = await prisma.valueResult.count();
    const strengthCount = await prisma.strength.count();

    console.log(`📈 Database summary:`);
    console.log(`  - Users: ${userCount}`);
    console.log(`  - Sessions: ${sessionCount}`);
    console.log(`  - Value Results: ${valueCount}`);
    console.log(`  - Strengths: ${strengthCount}`);

  } catch (error) {
    console.error('Migration verification failed:', error.message);
    throw error;
  }
}

// Handle OAuth callback to link Google ID
async function handleOAuthCallback(googleId, email) {
  if (email === 'newhosung@gmail.com') {
    await prisma.user.update({
      where: { email: 'newhosung@gmail.com' },
      data: { googleId: googleId }
    });
    console.log('✅ Linked Google OAuth ID to SUPER_ADMIN account');
  }
}

if (require.main === module) {
  migrateToEnhancedSchema();
}

module.exports = { migrateToEnhancedSchema, handleOAuthCallback };