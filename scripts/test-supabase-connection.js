#!/usr/bin/env node

/**
 * Test script to verify Supabase connection and environment variables
 * Run this script to diagnose connection issues
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('=== Supabase Connection Test ===\n');

// Check environment variables
console.log('1. Environment Variables Check:');
console.log('--------------------------------');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('NEXT_PUBLIC_SUPABASE_URL:', url ? '✅ Set' : '❌ Missing');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', anonKey ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', serviceKey ? '✅ Set' : '❌ Missing');

if (!url || !anonKey) {
  console.error('\n❌ Missing required environment variables!');
  console.error('Please ensure .env.local contains:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=...');
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY=...');
  process.exit(1);
}

console.log('\n2. Connection Test:');
console.log('-------------------');
console.log('Connecting to:', url);

// Create Supabase client
const supabase = createClient(url, anonKey);

// Test database connection
async function testConnection() {
  try {
    // Test 1: Check if we can reach Supabase
    console.log('\nTesting database connection...');
    const { data, error } = await supabase
      .from('value_results')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Database connection failed:', error.message);
      console.error('Error code:', error.code);
      console.error('Details:', error.details);

      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.error('\n⚠️  Table "value_results" does not exist!');
        console.error('Please run the SQL migration script to create tables.');
      }
    } else {
      console.log('✅ Database connection successful!');
    }

    // Test 2: Check auth status
    console.log('\nTesting auth service...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError) {
      console.error('❌ Auth service error:', authError.message);
    } else if (session) {
      console.log('✅ Auth service working - User signed in:', session.user.email);
    } else {
      console.log('✅ Auth service working - No active session');
    }

    // Test 3: List tables (if we have service role key)
    if (serviceKey) {
      console.log('\nTesting with service role...');
      const adminSupabase = createClient(url, serviceKey);

      // Query to check if tables exist
      const tables = ['users', 'user_sessions', 'strength_profiles', 'value_results'];
      console.log('Checking tables:');

      for (const table of tables) {
        const { error } = await adminSupabase
          .from(table)
          .select('count')
          .limit(1);

        if (error) {
          console.log(`  ${table}: ❌ ${error.message}`);
        } else {
          console.log(`  ${table}: ✅ Exists`);
        }
      }
    }

    console.log('\n=== Test Complete ===');

  } catch (err) {
    console.error('\n❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

testConnection();