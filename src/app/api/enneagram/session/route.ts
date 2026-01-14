import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/enneagram/session
 * Fetches the user's most recent Enneagram session if exists.
 * Used for session restoration on page load.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { session: authSession }, error: authError } = await supabase.auth.getSession();

    if (authError || !authSession?.user?.id) {
      // Not authenticated - return empty response
      return NextResponse.json({ session: null });
    }

    const userId = authSession.user.id;

    // Find user's most recent enneagram session
    const { data: enneagramSession, error } = await supabase
      .from('enneagram_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[Enneagram Session] Query error:', error);
      return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
    }

    if (!enneagramSession) {
      return NextResponse.json({ session: null });
    }

    // Return session data for restoration
    return NextResponse.json({
      session: {
        sessionId: enneagramSession.session_id,
        stage: enneagramSession.stage,
        locale: enneagramSession.locale || 'en',
        responses: enneagramSession.responses || {},
        primaryType: enneagramSession.primary_type,
        wingEstimate: enneagramSession.wing_estimate,
        instinct: enneagramSession.instinct,
        confidence: enneagramSession.confidence,
        scores: enneagramSession.scores,
        isComplete: enneagramSession.stage === 'complete',
      }
    });
  } catch (e) {
    console.error('[Enneagram Session] Error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
