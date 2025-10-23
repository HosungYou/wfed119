-- Add time horizon fields to vision_statements table
-- This allows users to specify when they want to achieve their vision

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
