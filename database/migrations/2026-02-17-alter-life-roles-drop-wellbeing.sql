-- Life Roles v3.4.1: Drop wellbeing columns (data moved to later goal-setting module)
-- Reduce steps from 5 to 4

-- Drop wellbeing columns
ALTER TABLE public.life_roles_sessions DROP COLUMN IF EXISTS wellbeing_reflections;
ALTER TABLE public.life_roles_sessions DROP COLUMN IF EXISTS wellbeing_commitments;

-- Drop old step constraint
ALTER TABLE public.life_roles_sessions DROP CONSTRAINT IF EXISTS life_roles_sessions_current_step_check;

-- Fix existing rows BEFORE adding new constraint
UPDATE public.life_roles_sessions SET current_step = 4 WHERE current_step = 5;
UPDATE public.life_roles_sessions SET current_step = 1 WHERE current_step > 4 AND status != 'completed';

-- Now add new constraint (1-4)
ALTER TABLE public.life_roles_sessions ADD CONSTRAINT life_roles_sessions_current_step_check
  CHECK (current_step BETWEEN 1 AND 4);
