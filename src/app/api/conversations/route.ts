import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getVerifiedUser } from '@/lib/supabase-server';

/**
 * GET /api/conversations
 * Get all conversation sessions for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getVerifiedUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const supabase = await createServerSupabaseClient();

    // Get all sessions with conversation message counts
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select(`
        id,
        session_id,
        session_type,
        current_stage,
        completed,
        created_at,
        updated_at,
        completed_at
      `)
      .eq('user_id', userId)
      .eq('session_type', 'strengths')
      .order('updated_at', { ascending: false });

    if (sessionsError) {
      console.error('[CONVERSATIONS_API] Error fetching sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to fetch conversation sessions' },
        { status: 500 }
      );
    }

    // Get message counts for each session
    const sessionsWithCounts = await Promise.all(
      (sessions || []).map(async (session) => {
        const { count, error: countError } = await supabase
          .from('conversation_messages')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', session.session_id);

        if (countError) {
          console.error('[CONVERSATIONS_API] Error counting messages:', countError);
        }

        return {
          ...session,
          messageCount: count || 0
        };
      })
    );

    return NextResponse.json({
      sessions: sessionsWithCounts,
      count: sessionsWithCounts.length
    });

  } catch (error) {
    console.error('[CONVERSATIONS_API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}