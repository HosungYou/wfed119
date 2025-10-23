import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const databaseDisabledResponse = () =>
  NextResponse.json({ error: 'Database operations disabled' }, { status: 503 });

export async function POST(req: NextRequest) {
  try {
    const { sessionId, stage, messages, strengths } = await req.json();

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

    // Upsert session record
    await supabase
      .from('sessions')
      .upsert({
        session_id: sessionId,
        current_stage: stage || 'initial',
        updated_at: new Date().toISOString(),
        completed: stage === 'summary',
      }, {
        onConflict: 'session_id',
      });

    // If messages are provided, update them
    if (messages && Array.isArray(messages)) {
      // Clear existing conversations for this session to avoid duplicates
      await supabase
        .from('conversations')
        .delete()
        .eq('session_id', sessionId);

      // Save all messages
      if (messages.length > 0) {
        await supabase
          .from('conversations')
          .insert(
            messages.map((message: { role: string; content: string; timestamp?: string }, index: number) => ({
              session_id: sessionId,
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
      // Clear existing strengths
      await supabase
        .from('strengths')
        .delete()
        .eq('session_id', sessionId);

      // Save new strengths
      const strengthRecords = [];
      for (const [category, items] of Object.entries(strengths)) {
        for (const item of items as string[]) {
          strengthRecords.push({
            session_id: sessionId,
            category,
            name: item,
            evidence: `Saved from session at ${new Date().toISOString()}`,
            confidence: 0.8,
          });
        }
      }

      if (strengthRecords.length > 0) {
        await supabase.from('strengths').insert(strengthRecords);
      }
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
