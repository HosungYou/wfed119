-- Fix for Supabase value_results table unique constraint issue
-- This creates the missing unique constraint needed for upsert operations

-- First, check if there are any duplicate records that would prevent unique constraint
SELECT user_id, value_set, COUNT(*) as count
FROM value_results
GROUP BY user_id, value_set
HAVING COUNT(*) > 1;

-- If duplicates exist, delete them first (keep the latest one)
DELETE FROM value_results a USING (
  SELECT user_id, value_set, MAX(updated_at) as max_updated
  FROM value_results
  GROUP BY user_id, value_set
) b
WHERE a.user_id = b.user_id
  AND a.value_set = b.value_set
  AND a.updated_at < b.max_updated;

-- Now add the unique constraint that Supabase upsert expects
ALTER TABLE value_results
ADD CONSTRAINT unique_user_value_set
UNIQUE (user_id, value_set);

-- Verify the constraint was created
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'value_results'
  AND constraint_type = 'UNIQUE';