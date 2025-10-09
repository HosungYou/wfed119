/**
 * Apply vision_statements table migration
 * Adds time_horizon and related fields
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('\n🔄 Applying vision_statements migration...\n');

  try {
    // Check if columns already exist
    const { data: existingColumns, error: checkError } = await supabase
      .from('vision_statements')
      .select('*')
      .limit(1);

    if (checkError) {
      console.error('❌ Error checking table:', checkError);
      throw checkError;
    }

    console.log('✅ Table vision_statements exists\n');

    // Note: Supabase doesn't support direct ALTER TABLE via client
    // We need to use the SQL Editor in Supabase Dashboard

    console.log('📋 Please run the following SQL in Supabase Dashboard SQL Editor:\n');
    console.log('─'.repeat(80));
    console.log(`
-- Add time horizon fields to vision_statements table
ALTER TABLE public.vision_statements
ADD COLUMN IF NOT EXISTS time_horizon INTEGER,
ADD COLUMN IF NOT EXISTS time_horizon_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS primary_aspiration VARCHAR(255),
ADD COLUMN IF NOT EXISTS magnitude_of_impact TEXT,
ADD COLUMN IF NOT EXISTS professional_focus_validated BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN public.vision_statements.time_horizon IS 'Number representing years from now or specific age';
COMMENT ON COLUMN public.vision_statements.time_horizon_type IS 'Type: years_from_now or specific_age';
COMMENT ON COLUMN public.vision_statements.primary_aspiration IS 'The ONE core aspiration chosen from all aspirations';
COMMENT ON COLUMN public.vision_statements.magnitude_of_impact IS 'Description of the scale and reach of intended impact';
COMMENT ON COLUMN public.vision_statements.professional_focus_validated IS 'Whether professional career focus has been validated';
    `);
    console.log('─'.repeat(80));

    console.log('\n🔗 Supabase Dashboard SQL Editor:');
    console.log(`   ${supabaseUrl.replace('https://', 'https://app.')}/project/_/sql\n`);

    console.log('💡 Alternative: Use the migration file directly:');
    console.log('   database/migrations/add-time-horizon-to-vision.sql\n');

  } catch (error) {
    console.error('\n❌ Migration check failed:', error.message);
    process.exit(1);
  }
}

applyMigration();
