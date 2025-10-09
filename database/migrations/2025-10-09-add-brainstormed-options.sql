-- Migration: Add brainstormed_options columns to vision_statements table
-- Date: 2025-10-09
-- Description: Support for NEW Step 2 - Brainstorm 6-Word Vision Statements

-- Add columns for Step 2 brainstorming functionality
ALTER TABLE vision_statements
ADD COLUMN IF NOT EXISTS brainstormed_options JSONB,
ADD COLUMN IF NOT EXISTS selected_option_index INT;

-- Add comments for documentation
COMMENT ON COLUMN vision_statements.brainstormed_options IS
'AI-generated 3-5 vision statement options from Step 2 (each 6 words or less).
Format: [{"statement": "Transform dreams into reality", "wordCount": 4, "explanation": "..."}]';

COMMENT ON COLUMN vision_statements.selected_option_index IS
'Index (0-4) of user-selected option from brainstormed_options array.
NULL if user created custom vision statement.';

-- Optional: Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_vision_statements_selected_option
ON vision_statements(selected_option_index)
WHERE selected_option_index IS NOT NULL;

-- Verification query (run after migration)
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'vision_statements'
-- AND column_name IN ('brainstormed_options', 'selected_option_index');
