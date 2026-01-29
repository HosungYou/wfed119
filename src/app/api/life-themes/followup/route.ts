import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getVerifiedUser } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import type { FollowUpData } from '@/lib/types/lifeThemes';

/**
 * GET /api/life-themes/followup
 * Fetch existing follow-up data for user's session
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getVerifiedUser();
    const supabase = await createServerSupabaseClient();

    const auth = checkDevAuth(user);
    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's session
    const { data: ltSession } = await supabase
      .from('life_themes_sessions')
      .select('id')
      .eq('user_id', auth.userId)
      .single();

    if (!ltSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Fetch follow-up data from analysis table
    const { data, error } = await supabase
      .from('life_themes_analysis')
      .select('*')
      .eq('session_id', ltSession.id)
      .eq('analysis_type', 'followup')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[FollowUp] Error fetching:', error);
      return NextResponse.json({ error: 'Failed to fetch follow-up data' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(null);
    }

    // Return structured_data as FollowUpData
    return NextResponse.json(data.structured_data as FollowUpData);
  } catch (error) {
    console.error('[FollowUp] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/life-themes/followup
 * Save follow-up data (upsert)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getVerifiedUser();
    const supabase = await createServerSupabaseClient();

    const auth = checkDevAuth(user);
    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: FollowUpData = await req.json();

    // Validate required fields
    const requiredFields = ['enneagramConnection', 'integrationNotes', 'themePriorities', 'careerGuidance', 'selfLearning'];
    for (const field of requiredFields) {
      if (body[field as keyof FollowUpData] === undefined) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    // Get user's session
    const { data: ltSession } = await supabase
      .from('life_themes_sessions')
      .select('id')
      .eq('user_id', auth.userId)
      .single();

    if (!ltSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Generate summary content
    const content = `Follow-up reflection completed. ${body.themePriorities.length} themes prioritized.`;

    // Check if follow-up already exists
    const { data: existing } = await supabase
      .from('life_themes_analysis')
      .select('id')
      .eq('session_id', ltSession.id)
      .eq('analysis_type', 'followup')
      .single();

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('life_themes_analysis')
        .update({
          content,
          structured_data: body,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('life_themes_analysis')
        .insert({
          session_id: ltSession.id,
          analysis_type: 'followup',
          content,
          structured_data: body,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Update session step to results
    await supabase
      .from('life_themes_sessions')
      .update({ current_step: 'results' })
      .eq('id', ltSession.id);

    return NextResponse.json(result.structured_data);
  } catch (error) {
    console.error('[FollowUp] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
