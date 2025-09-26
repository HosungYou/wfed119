#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process');

console.log('🔧 Setting up Prisma client...');

// Check if DATABASE_URL exists and determine schema
const databaseUrl = process.env.DATABASE_URL;
const isPostgres = databaseUrl && (
  databaseUrl.includes('postgresql://') ||
  databaseUrl.includes('postgres://') ||
  databaseUrl.includes('render.com')  // Explicitly check for Render database
);

try {
  if (isPostgres) {
    console.log('📊 Using PostgreSQL schema...');
    // Generate client with PostgreSQL schema
    execSync('npx prisma generate --schema=prisma/schema.postgres.prisma', {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    // Only push schema in development or when explicitly allowed
    const isProduction = process.env.NODE_ENV === 'production';
    const isPrismaAccelerate = databaseUrl && databaseUrl.includes('accelerate.prisma-data.net');

    if (!isProduction && !isPrismaAccelerate) {
      console.log('🚀 Pushing schema to database...');
      execSync('npx prisma db push --schema=prisma/schema.postgres.prisma --accept-data-loss', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
    } else {
      console.log('🔒 Skipping schema push in production/Accelerate environment');
    }
  } else {
    console.log('📊 Using SQLite schema...');
    // Generate client with SQLite schema
    execSync('npx prisma generate', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
  }

  console.log('✅ Prisma setup completed successfully!');
} catch (error) {
  console.error('❌ Prisma setup failed:', error.message);
  // Don't fail the entire build, just log the error
  console.log('⚠️  Continuing without Prisma setup...');
}
