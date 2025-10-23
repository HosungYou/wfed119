/**
 * Run database migrations using Supabase client
 * Usage: node scripts/run-migration.js <migration-file.sql>
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration(sqlFilePath) {
  try {
    console.log(`\n📄 Reading migration file: ${sqlFilePath}`);

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

    console.log(`\n🔄 Executing migration...\n`);
    console.log('SQL Preview:');
    console.log('─'.repeat(60));
    console.log(sqlContent.substring(0, 500) + '...\n');
    console.log('─'.repeat(60));

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

    if (error) {
      // If exec_sql doesn't exist, try direct query
      console.log('ℹ️  Trying direct SQL execution...');

      // Split by semicolons and execute each statement
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);

        const { error: execError } = await supabase.rpc('exec_sql', { sql: stmt });

        if (execError) {
          console.error(`❌ Error in statement ${i + 1}:`, execError.message);
          throw execError;
        }

        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }

    console.log('\n✅ Migration completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Get migration file from command line
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Usage: node scripts/run-migration.js <migration-file.sql>');
  process.exit(1);
}

const fullPath = path.resolve(migrationFile);

if (!fs.existsSync(fullPath)) {
  console.error(`❌ File not found: ${fullPath}`);
  process.exit(1);
}

runMigration(fullPath);
