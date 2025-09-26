#!/usr/bin/env node

/**
 * Set up SUPER_ADMIN users from environment variable
 * Set SUPER_ADMIN_EMAILS="email1@example.com,email2@example.com"
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupAdminsFromEnv() {
  const adminEmailsEnv = process.env.SUPER_ADMIN_EMAILS;

  if (!adminEmailsEnv) {
    console.log('⚠️  SUPER_ADMIN_EMAILS environment variable not set');
    console.log('Set it like: SUPER_ADMIN_EMAILS="email1@gmail.com,email2@gmail.com"');
    return;
  }

  const adminEmails = adminEmailsEnv.split(',').map(email => email.trim());
  console.log(`🔧 Setting up ${adminEmails.length} SUPER_ADMIN users...`);

  for (const email of adminEmails) {
    try {
      const user = await prisma.user.upsert({
        where: { email },
        update: {
          role: 'SUPER_ADMIN',
          isActive: true
        },
        create: {
          googleId: `placeholder-${Date.now()}`, // Will be updated on OAuth
          email,
          name: email.split('@')[0],
          role: 'SUPER_ADMIN',
          isActive: true
        }
      });
      console.log(`✅ ${email} set as SUPER_ADMIN`);
    } catch (error) {
      console.error(`❌ Failed to set up ${email}:`, error.message);
    }
  }

  console.log('🎉 Admin setup complete!');
  await prisma.$disconnect();
}

setupAdminsFromEnv();