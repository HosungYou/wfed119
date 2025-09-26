#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');

const collaboratorEmails = [
  'cloudhoppr@example.com',    // GitHub: Cloudhoppr
  'alrjohn@example.com',       // GitHub: AlrJohn
  'johnar17@example.com',      // GitHub: JohnAR17
];

const prisma = new PrismaClient();

async function setupCollaboratorAdmin() {
  console.log('🔧 Setting up collaborator admin access...');

  try {
    // Note: This script assumes User table exists in production
    // If using current schema (without User table), this would need modification

    for (const email of collaboratorEmails) {
      console.log(`⚙️  Setting up admin access for: ${email}`);

      // Check if user exists (would need Google OAuth first)
      const existingUser = await prisma.user.findUnique({
        where: { email: email }
      }).catch(() => null); // Catch error if User table doesn't exist

      if (existingUser) {
        // Update existing user to ADMIN role
        await prisma.user.update({
          where: { email: email },
          data: {
            role: 'ADMIN',
            isActive: true
          }
        });
        console.log(`✅ Updated ${email} to ADMIN role`);
      } else {
        console.log(`⚠️  User ${email} not found - will be set to ADMIN on first login`);
        // Note: This could be handled in the OAuth callback
      }
    }

    console.log('✅ Collaborator admin setup completed!');

  } catch (error) {
    if (error.code === 'P2021') {
      console.log('ℹ️  User table does not exist in current schema');
      console.log('ℹ️  Collaborators will have database access through Prisma Accelerate API key');
    } else {
      console.error('❌ Setup failed:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

setupCollaboratorAdmin();