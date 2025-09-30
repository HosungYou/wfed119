import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

    const supabase = createServerSupabaseClient();

    // TODO: Implement Enneagram scoring with Supabase
    // This endpoint needs to be updated to work with the enneagram_sessions table

    return NextResponse.json({
      message: 'Enneagram scoring - Supabase implementation pending',
      sessionId
    });
  } catch (e) {
    console.error('[ENNEAGRAM_SCORE] Error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
