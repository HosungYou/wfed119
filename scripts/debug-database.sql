-- Debug script to check current database state
-- Run this to understand what's happening

-- 1. Check current User table
SELECT 'User table contents:' as info;
SELECT id, "googleId", email, role, "isActive" FROM "public"."User" LIMIT 10;

-- 2. Check ValueResult table structure
SELECT 'ValueResult table structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'ValueResult' AND table_schema = 'public';

-- 3. Check current FK constraints on ValueResult
SELECT 'ValueResult FK constraints:' as info;
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name='ValueResult';

-- 4. Check if UserSession table exists and its structure
SELECT 'UserSession table check:' as info;
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'UserSession'
) as table_exists;

-- 5. Sample ValueResult data (if any)
SELECT 'ValueResult sample data:' as info;
SELECT id, "userId", "valueSet", "createdAt" FROM "public"."ValueResult" LIMIT 5;