import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/conversations/[sessionId]
 * Retrieve all conversation messages for a specific session
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    const { data: { session: authSession }, error: authError } = await supabase.auth.getSession();

    if (!authSession || authError) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Verify session belongs to user
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_sessions')
      .select('user_id')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (sessionData.user_id !== authSession.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this session' },
        { status: 403 }
      );
    }

    // Get all messages for this session
    const { data: messages, error: messagesError } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('[CONVERSATIONS_API] Error fetching messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch conversation messages' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sessionId,
      messages: messages || [],
      count: messages?.length || 0
    });

  } catch (error) {
    console.error('[CONVERSATIONS_API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/conversations/[sessionId]
 * Delete all conversation messages for a specific session (GDPR compliance)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    const { data: { session: authSession }, error: authError } = await supabase.auth.getSession();

    if (!authSession || authError) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Verify session belongs to user
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_sessions')
      .select('user_id')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (sessionData.user_id !== authSession.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this session' },
        { status: 403 }
      );
    }

    // Delete all messages for this session
    const { error: deleteError } = await supabase
      .from('conversation_messages')
      .delete()
      .eq('session_id', sessionId);

    if (deleteError) {
      console.error('[CONVERSATIONS_API] Error deleting messages:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete conversation messages' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation messages deleted successfully',
      sessionId
    });

  } catch (error) {
    console.error('[CONVERSATIONS_API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}