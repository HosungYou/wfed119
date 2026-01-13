import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const databaseDisabledResponse = () =>
  NextResponse.json({ error: 'Database operations disabled' }, { status: 503 });

export async function POST(req: NextRequest) {
  try {
    const { sessionId, stage, messages, strengths, metadata } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 },
      );
    }

    if (process.env.DB_ENABLED === 'false') {
      return databaseDisabledResponse();
    }

    const supabase = await createServerSupabaseClient();
    // Use getUser() for better security (authenticates via Auth server)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    let session = null;

    if (!userError && user) {
      // Get session only after user verification
      const { data: { session: verifiedSession } } = await supabase.auth.getSession();
      session = verifiedSession;
    }

    const userId = session?.user?.id || null;
    const userEmail = session?.user?.email || null;

    // Upsert session record
    await supabase
      .from('user_sessions')
      .upsert({
        session_id: sessionId,
        user_id: userId,
        current_stage: stage || 'initial',
        updated_at: new Date().toISOString(),
        completed: stage === 'summary',
        session_type: 'strengths',
        metadata: metadata || null,
      }, {
        onConflict: 'session_id',
      });

    // If messages are provided, update them
    if (messages && Array.isArray(messages)) {
      // Clear existing conversations for this session to avoid duplicates
      await supabase
        .from('conversation_messages')
        .delete()
        .eq('session_id', sessionId);

      // Save all messages
      if (messages.length > 0) {
        await supabase
          .from('conversation_messages')
          .insert(
            messages.map((message: { role: string; content: string; timestamp?: string }, index: number) => ({
              session_id: sessionId,
              user_id: userId,
              role: message.role,
              content: message.content,
              metadata: {
                timestamp: message.timestamp || new Date().toISOString(),
                messageIndex: index,
              },
            }))
          );
      }
    }

    // If strengths are provided, update them
    if (strengths) {
      await supabase
        .from('strength_profiles')
        .delete()
        .eq('session_id', sessionId);

      await supabase
        .from('strength_profiles')
        .insert({
          session_id: sessionId,
          user_id: userId,
          user_email: userEmail,
          strengths,
          summary: 'Saved from session',
          insights: { saved_at: new Date().toISOString() }
        });
    }

    return NextResponse.json({
      success: true,
      sessionId,
      message: 'Session saved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Session Save API Error:', error);

    return NextResponse.json(
      { error: 'Failed to save session. Please try again.' },
      { status: 500 },
    );
  }
}
