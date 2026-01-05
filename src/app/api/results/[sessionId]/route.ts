import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const emptyStrengths = { skills: [], attitudes: [], values: [] };

const normalizeStrengths = (raw: unknown) => {
  if (!raw || typeof raw !== 'object') return emptyStrengths;

  const result = { skills: [] as string[], attitudes: [] as string[], values: [] as string[] };
  const record = raw as Record<string, unknown>;

  (['skills', 'attitudes', 'values'] as const).forEach((key) => {
    const items = record[key];
    if (!Array.isArray(items)) return;

    result[key] = items
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const candidate = (item as Record<string, unknown>).name || (item as Record<string, unknown>).strength;
          return typeof candidate === 'string' ? candidate : null;
        }
        return null;
      })
      .filter((item): item is string => Boolean(item));
  });

  return result;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    let supabase;
    try {
      supabase = createSupabaseAdmin();
    } catch (error) {
      console.error('[Results API] Service role missing:', error);
      return NextResponse.json(
        { error: 'Server is missing SUPABASE_SERVICE_ROLE_KEY' },
        { status: 501 }
      );
    }

    const { data: profile, error } = await supabase
      .from('strength_profiles')
      .select('*')
      .eq('session_id', sessionId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('[Results API] Strengths query error:', error);
      return NextResponse.json({ error: 'Failed to load results' }, { status: 500 });
    }

    const { data: enneagramSession, error: enneagramError } = await supabase
      .from('enneagram_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (enneagramError && enneagramError.code !== 'PGRST116') {
      console.error('[Results API] Enneagram query error:', enneagramError);
    }

    const enneagram = enneagramSession
      ? {
          primaryType: enneagramSession.primary_type || null,
          confidence: enneagramSession.confidence || null,
          wingEstimate: enneagramSession.wing_estimate || null,
          instinct: enneagramSession.instinct || null,
          typeProbabilities: enneagramSession.scores?.probabilities || {}
        }
      : null;

    return NextResponse.json({
      sessionId,
      strengths: profile ? normalizeStrengths(profile.strengths) : emptyStrengths,
      enneagram,
      message: profile ? undefined : 'No strengths found for this session.'
    });
  } catch (error) {
    console.error('[Results API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
