import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getInstinctItems } from '@/lib/enneagram/instincts';
import { confidenceBand, primaryType, scoreStage1 } from '@/lib/enneagram/scoring';

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

    let admin;
    try {
      admin = createSupabaseAdmin();
    } catch (error) {
      console.error('[Enneagram Score] Service role missing:', error);
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured on the server.' },
        { status: 501 }
      );
    }

    const { data: session, error } = await admin
      .from('enneagram_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('[Enneagram Score] Session lookup error:', error);
      return NextResponse.json({ error: 'Failed to load session' }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const responses = session.responses && typeof session.responses === 'object' ? session.responses : {};
    const stage1 = (responses as Record<string, unknown>).screener;

    if (!Array.isArray(stage1) || stage1.length === 0) {
      return NextResponse.json({ error: 'Screener responses missing' }, { status: 400 });
    }

    const normalized = stage1
      .map((entry: any) => ({ itemId: entry?.itemId, value: entry?.value }))
      .filter((entry: any) => typeof entry.itemId === 'string' && typeof entry.value === 'number');

    const scores = scoreStage1(normalized, session.locale || 'en');
    const primary = primaryType(scores.probabilities);
    const confidence = confidenceBand(scores.probabilities);

    const wingCandidates = {
      '1': ['9', '2'],
      '2': ['1', '3'],
      '3': ['2', '4'],
      '4': ['3', '5'],
      '5': ['4', '6'],
      '6': ['5', '7'],
      '7': ['6', '8'],
      '8': ['7', '9'],
      '9': ['8', '1'],
    } as const;

    const wings = wingCandidates[primary as keyof typeof wingCandidates] || [];
    const wing = wings
      .map((candidate) => ({ candidate, score: scores.probabilities[candidate] || 0 }))
      .sort((a, b) => b.score - a.score)[0]?.candidate;

    let instinct: string | null = null;
    const stage3 = (responses as Record<string, unknown>).wings;
    if (Array.isArray(stage3)) {
      const items = getInstinctItems(session.locale || 'en');
      const byId = new Map(items.map((item) => [item.id, item.instinct]));
      const totals = { sp: 0, so: 0, sx: 0 } as Record<'sp' | 'so' | 'sx', number>;

      stage3.forEach((entry: any) => {
        const id = entry?.itemId;
        const value = typeof entry?.value === 'number' ? entry.value : 0;
        const instinctKey = byId.get(id);
        if (instinctKey) totals[instinctKey] += value;
      });

      const top = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
      instinct = top?.[0] || null;
    }

    const result = {
      sessionId,
      primaryType: primary,
      typeProbabilities: scores.probabilities,
      confidence,
      wingEstimate: wing ? `${primary}w${wing}` : null,
      instinct,
    };

    const { error: updateError } = await admin
      .from('enneagram_sessions')
      .update({
        scores,
        primary_type: primary,
        wing_estimate: result.wingEstimate,
        instinct,
        confidence,
        stage: 'complete',
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    if (updateError) {
      console.error('[Enneagram Score] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update score' }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error('enneagram/score error', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
