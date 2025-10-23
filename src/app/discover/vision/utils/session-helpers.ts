/**
 * Vision Statement Session Helpers
 * Provides authenticated API calls for all vision statement pages
 */

import { makeAuthenticatedRequest } from '@/lib/supabase-client-auth';

export interface VisionSession {
  id: string;
  user_id: string;
  current_step: number;
  time_horizon?: number;
  time_horizon_type?: 'years_from_now' | 'specific_age';
  future_imagery?: string;
  future_imagery_analysis?: any;
  core_aspirations?: { keyword: string; reason: string }[];
  primary_aspiration?: string;
  magnitude_of_impact?: string;
  draft_versions?: any[];
  final_statement?: string;
  statement_style?: string;
  is_completed?: boolean;
}

export async function getVisionSession(): Promise<VisionSession> {
  const response = await makeAuthenticatedRequest('/api/discover/vision/session');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to load session');
  }

  return response.json();
}

export async function updateVisionSession(updates: Partial<VisionSession>): Promise<VisionSession> {
  const response = await makeAuthenticatedRequest('/api/discover/vision/session', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update session');
  }

  return response.json();
}

export async function getVisionContext() {
  const response = await makeAuthenticatedRequest('/api/discover/vision/context');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to load context');
  }

  return response.json();
}
