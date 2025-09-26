#!/usr/bin/env node

/**
 * Promote existing user to SUPER_ADMIN role
 * Usage: node scripts/promote-user-to-admin.js <email>
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function promoteUserToAdmin(email) {
  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: node scripts/promote-user-to-admin.js <email>');
    process.exit(1);
  }

  try {
    console.log(`🔍 Looking for user: ${email}`);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email }
    });

    if (!existingUser) {
      console.log(`❌ User ${email} not found in database`);
      console.log('💡 User must sign in with Google first to create their account');
      process.exit(1);
    }

    // Update user role to SUPER_ADMIN
    const updatedUser = await prisma.user.update({
      where: { email: email },
      data: {
        role: 'SUPER_ADMIN',
        isActive: true
      }
    });

    console.log(`✅ Successfully promoted ${email} to SUPER_ADMIN`);
    console.log(`👤 User details:`, {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      isActive: updatedUser.isActive
    });

    // Create audit log entry
    try {
      await prisma.auditLog.create({
        data: {
          action: 'PROMOTE_TO_SUPER_ADMIN',
          tableName: 'User',
          recordId: updatedUser.id,
          newValues: {
            email: email,
            role: 'SUPER_ADMIN'
          },
          ipAddress: 'admin-script',
          userAgent: 'node-promotion-script'
        }
      });
      console.log('📝 Audit log entry created');
    } catch (auditError) {
      console.log('⚠️  Audit log creation failed (non-critical)');
    }

  } catch (error) {
    console.error('❌ Failed to promote user:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line argument
const email = process.argv[2];
promoteUserToAdmin(email);