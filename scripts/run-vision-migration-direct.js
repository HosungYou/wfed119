/**
 * Run vision migration using Supabase REST API directly
 */

const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

async function runSQL(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL execution failed: ${error}`);
  }

  return await response.json();
}

async function applyMigration() {
  console.log('\n🔄 Applying migration using Supabase Management API...\n');

  const statements = [
    'ALTER TABLE public.vision_statements ADD COLUMN IF NOT EXISTS time_horizon INTEGER;',
    'ALTER TABLE public.vision_statements ADD COLUMN IF NOT EXISTS time_horizon_type VARCHAR(50);',
    'ALTER TABLE public.vision_statements ADD COLUMN IF NOT EXISTS primary_aspiration VARCHAR(255);',
    'ALTER TABLE public.vision_statements ADD COLUMN IF NOT EXISTS magnitude_of_impact TEXT;',
    'ALTER TABLE public.vision_statements ADD COLUMN IF NOT EXISTS professional_focus_validated BOOLEAN DEFAULT FALSE;'
  ];

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`\n[${i + 1}/${statements.length}] Executing: ${stmt.substring(0, 80)}...`);

    try {
      // Try using PostgreSQL connection string if available
      const { Pool } = require('pg');

      // Get connection from env or construct it
      const connectionString = process.env.DATABASE_URL ||
        `postgresql://postgres:[SERVICE_KEY]@db.${supabaseUrl.split('//')[1].split('.')[0]}.supabase.co:5432/postgres`;

      console.log('   Using direct PostgreSQL connection...');

      const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
      });

      await pool.query(stmt);
      await pool.end();

      console.log('   ✅ Success');

    } catch (pgError) {
      console.log('   ⚠️  PostgreSQL method not available, trying alternative...');
      console.error('   Error:', pgError.message);

      // Fallback: Just log for manual execution
      console.log('   ℹ️  Please run this SQL manually in Supabase Dashboard');
    }
  }

  console.log('\n✅ Migration application attempted\n');
  console.log('🔗 Verify in Supabase Dashboard:');
  console.log(`   ${supabaseUrl.replace('https://', 'https://app.')}/project/_/editor\n`);
}

applyMigration().catch(error => {
  console.error('\n❌ Migration failed:', error.message);
  console.log('\n💡 Please run the SQL manually in Supabase Dashboard SQL Editor:');
  console.log('   See: database/migrations/add-time-horizon-to-vision.sql\n');
});
