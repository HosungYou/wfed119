-- Migration: Update integrated profile completeness for 10-module system
-- Date: 2026-01-13
-- Purpose: Align completeness calculation with 10 modules

CREATE OR REPLACE FUNCTION calculate_profile_completeness(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_completed_count INTEGER;
  v_total_modules INTEGER := 10;
BEGIN
  SELECT COUNT(*)
  INTO v_completed_count
  FROM public.module_progress
  WHERE user_id = p_user_id AND status = 'completed';

  RETURN ROUND((v_completed_count::DECIMAL / v_total_modules) * 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

UPDATE public.user_integrated_profiles
SET profile_completeness = calculate_profile_completeness(user_id),
    updated_at = NOW();
