#!/usr/bin/env node

const readline = require('readline');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🚀 WFED119 PostgreSQL Migration Tool');
  console.log('====================================\n');

  console.log('Available operations:');
  console.log('1. Export current SQLite data');
  console.log('2. Migrate to PostgreSQL');
  console.log('3. Verify migration');
  console.log('4. Rollback to SQLite');
  console.log('5. Full migration (export → migrate → verify)');
  console.log('0. Exit\n');

  const choice = await question('Select operation (0-5): ');

  try {
    switch (choice) {
      case '1':
        await exportData();
        break;
      case '2':
        await migrateToPostgreSQL();
        break;
      case '3':
        await verifyMigration();
        break;
      case '4':
        await rollbackToSQLite();
        break;
      case '5':
        await fullMigration();
        break;
      case '0':
        console.log('👋 Goodbye!');
        process.exit(0);
        break;
      default:
        console.log('❌ Invalid choice');
        process.exit(1);
    }
  } catch (error) {
    console.error('💥 Operation failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

async function exportData() {
  console.log('\n📦 Exporting current SQLite data...');
  const confirm = await question('This will create a backup of all current data. Continue? (y/N): ');

  if (confirm.toLowerCase() !== 'y') {
    console.log('❌ Export cancelled');
    return;
  }

  execSync('node scripts/export-current-data.js', { stdio: 'inherit' });
  console.log('✅ Export completed');
}

async function migrateToPostgreSQL() {
  console.log('\n🐘 Migrating to PostgreSQL...');

  // Check if PostgreSQL URL is configured
  const envPath = path.join(process.cwd(), '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');

  if (!envContent.includes('postgresql://')) {
    console.log('❌ PostgreSQL DATABASE_URL not found in .env file');
    console.log('Please update your .env file with PostgreSQL connection string:');
    console.log('DATABASE_URL="postgresql://user:password@host:5432/dbname"');
    return;
  }

  console.log('⚠️  WARNING: This will replace your current database with PostgreSQL');
  console.log('Make sure you have:');
  console.log('- Created a PostgreSQL database');
  console.log('- Updated DATABASE_URL in .env file');
  console.log('- Run data export first');

  const confirm = await question('Continue with migration? (y/N): ');

  if (confirm.toLowerCase() !== 'y') {
    console.log('❌ Migration cancelled');
    return;
  }

  // Update schema
  console.log('📄 Updating Prisma schema...');
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  const enhancedSchemaPath = path.join(process.cwd(), 'prisma', 'schema.enhanced.prisma');

  if (fs.existsSync(enhancedSchemaPath)) {
    // Backup current schema
    fs.copyFileSync(schemaPath, path.join(process.cwd(), 'prisma', 'schema.sqlite.backup'));
    // Use enhanced schema
    fs.copyFileSync(enhancedSchemaPath, schemaPath);
    console.log('✅ Schema updated to PostgreSQL');
  }

  // Generate Prisma client
  console.log('🔄 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Run migration
  console.log('🔄 Running database migration...');
  execSync('npx prisma migrate dev --name postgresql_migration', { stdio: 'inherit' });

  // Migrate data
  execSync('node scripts/migrate-data-to-postgresql.js', { stdio: 'inherit' });

  console.log('✅ PostgreSQL migration completed');
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');
  execSync('node scripts/verify-migration.js', { stdio: 'inherit' });
  console.log('✅ Verification completed');
}

async function rollbackToSQLite() {
  console.log('\n⏪ Rolling back to SQLite...');
  console.log('⚠️  WARNING: This will revert to SQLite database');
  console.log('All PostgreSQL data will be lost unless you have backups');

  const confirm = await question('Continue with rollback? (y/N): ');

  if (confirm.toLowerCase() !== 'y') {
    console.log('❌ Rollback cancelled');
    return;
  }

  execSync('node scripts/rollback-to-sqlite.js', { stdio: 'inherit' });
  console.log('✅ Rollback completed');
}

async function fullMigration() {
  console.log('\n🎯 Full PostgreSQL Migration');
  console.log('This will:');
  console.log('1. Export current SQLite data');
  console.log('2. Migrate to PostgreSQL');
  console.log('3. Verify data integrity');

  const confirm = await question('Continue with full migration? (y/N): ');

  if (confirm.toLowerCase() !== 'y') {
    console.log('❌ Full migration cancelled');
    return;
  }

  console.log('\n📦 Step 1: Exporting data...');
  execSync('node scripts/export-current-data.js', { stdio: 'inherit' });

  console.log('\n🐘 Step 2: Migrating to PostgreSQL...');
  await migrateToPostgreSQL();

  console.log('\n🔍 Step 3: Verifying migration...');
  execSync('node scripts/verify-migration.js', { stdio: 'inherit' });

  console.log('\n🎉 Full migration completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Test your application thoroughly');
  console.log('2. Update production environment variables');
  console.log('3. Deploy to production');
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n👋 Migration interrupted by user');
  process.exit(0);
});

// Run main function
main().catch(error => {
  console.error('💥 Migration tool failed:', error);
  process.exit(1);
});