import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

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

    const supabase = await createServerSupabaseClient();

    // Find the session in user_sessions table
    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get strength profiles for this session
    const { data: strengthProfiles } = await supabase
      .from('strength_profiles')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    // Transform strengths back to categorized format
    const strengths = {
      skills: [],
      attitudes: [],
      values: []
    };

    if (strengthProfiles && strengthProfiles.length > 0) {
      const latestProfile = strengthProfiles[strengthProfiles.length - 1];
      if (latestProfile.strengths) {
        // Extract strengths from the stored data structure
        const strengthsData = latestProfile.strengths;
        if (typeof strengthsData === 'object') {
          strengths.skills = (strengthsData as any).skills || [];
          strengths.attitudes = (strengthsData as any).attitudes || [];
          strengths.values = (strengthsData as any).values || [];
        }
      }
    }

    return NextResponse.json({
      sessionId: session.session_id,
      stage: session.current_stage,
      completed: session.completed,
      messages: [], // Note: Conversation messages would need separate table
      strengths,
      metadata: {
        createdAt: session.started_at,
        updatedAt: session.updated_at,
        messageCount: 0, // Would need to count from conversations table
        strengthCount: Object.values(strengths).flat().length
      }
    });

  } catch (error) {
    console.error('Session Load API Error:', error);

    return NextResponse.json(
      { error: 'Failed to load session. Please try again.' },
      { status: 500 }
    );
  }
}

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

    const supabase = await createServerSupabaseClient();

    // Delete strength profiles for this session
    await supabase
      .from('strength_profiles')
      .delete()
      .eq('session_id', sessionId);

    // Delete the session itself
    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('session_id', sessionId);

    if (error) {
      console.error('Delete session error:', error);
      return NextResponse.json(
        { error: 'Failed to delete session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully',
      sessionId
    });

  } catch (error) {
    console.error('Session Delete API Error:', error);

    return NextResponse.json(
      { error: 'Failed to delete session. Please try again.' },
      { status: 500 }
    );
  }
}