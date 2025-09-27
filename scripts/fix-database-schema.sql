-- Complete database schema fix for ValueResult FK issue
-- This script will properly align the database with the current schema

-- First, drop the problematic constraint
ALTER TABLE "public"."ValueResult" DROP CONSTRAINT IF EXISTS "ValueResult_userId_fkey";

-- Update the ValueResult table to use googleId instead of User.id
-- This assumes we're storing googleId values in userId field
-- If this breaks anything, we'll need to migrate the data first

-- Add the correct foreign key constraint
ALTER TABLE "public"."ValueResult"
ADD CONSTRAINT "ValueResult_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "public"."User"("googleId") ON DELETE CASCADE;

-- Verify the constraint was added
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
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name='ValueResult';