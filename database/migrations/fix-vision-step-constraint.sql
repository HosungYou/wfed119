-- Fix vision_statements check constraint to allow current_step = 0
-- This allows time-horizon selection before Step 1

-- Drop the old constraint
ALTER TABLE public.vision_statements
DROP CONSTRAINT IF EXISTS vision_statements_current_step_check;

-- Add new constraint that allows 0 (for time-horizon page)
ALTER TABLE public.vision_statements
ADD CONSTRAINT vision_statements_current_step_check
CHECK (current_step >= 0 AND current_step <= 4);

-- Add comment
COMMENT ON CONSTRAINT vision_statements_current_step_check ON public.vision_statements
IS 'Allow current_step 0 for time-horizon selection, 1-4 for actual steps';
