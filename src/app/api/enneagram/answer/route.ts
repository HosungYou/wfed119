import { NextRequest, NextResponse } from 'next/server';
import { getScreenerItems } from '@/lib/enneagram/itemBank';
import { getInstinctItems } from '@/lib/enneagram/instincts';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createSupabaseAdmin } from '@/lib/supabase';

type Stage = 'screener' | 'discriminators' | 'wings' | 'narrative' | 'complete';

type LikertItem = { itemId: string; value: number };

type DiscriminatorAnswer = { itemId: string; choice: 'A' | 'B' };

type RequestBody = {
  sessionId?: string;
  stage?: Stage;
  input?: unknown;
  locale?: string;
};

const discriminatorsRequired = 6;

const isStage = (value: unknown): value is Stage =>
  value === 'screener' ||
  value === 'discriminators' ||
  value === 'wings' ||
  value === 'narrative' ||
  value === 'complete';

const asLikertItems = (value: unknown, max: number): LikertItem[] => {
  if (!Array.isArray(value)) return [];
  const mapped: LikertItem[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const itemId = typeof (entry as { itemId?: unknown }).itemId === 'string' ? (entry as { itemId?: string }).itemId : undefined;
    const rawValue = (entry as { value?: unknown }).value;
    const valueNumber = typeof rawValue === 'number' ? rawValue : Number(rawValue);
    if (!itemId || Number.isNaN(valueNumber) || valueNumber < 1 || valueNumber > 5) continue;
    mapped.push({ itemId, value: valueNumber });
    if (mapped.length >= max) break;
  }
  return mapped;
};

const asDiscriminatorAnswers = (value: unknown, max: number): DiscriminatorAnswer[] => {
  if (!Array.isArray(value)) return [];
  const mapped: DiscriminatorAnswer[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const itemId = typeof (entry as { itemId?: unknown }).itemId === 'string' ? (entry as { itemId?: string }).itemId : undefined;
    const choice = (entry as { choice?: unknown }).choice;
    if (!itemId || (choice !== 'A' && choice !== 'B')) continue;
    mapped.push({ itemId, choice });
    if (mapped.length >= max) break;
  }
  return mapped;
};

const asTexts = (value: unknown, max: number): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => entry.length > 0)
    .slice(0, max);
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as RequestBody;
  const { sessionId, stage, input, locale = 'en' } = body;

  if (!sessionId || !isStage(stage)) {
    return NextResponse.json({ error: 'Missing sessionId or stage' }, { status: 400 });
  }

  let admin;
  try {
    admin = createSupabaseAdmin();
  } catch (error) {
    console.error('[Enneagram Answer] Service role missing:', error);
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured on the server.' },
      { status: 501 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || null;

  const { data: existingSession, error: fetchError } = await admin
    .from('enneagram_sessions')
    .select('responses, user_id')
    .eq('session_id', sessionId)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('[Enneagram Answer] Session lookup error:', fetchError);
    return NextResponse.json({ error: 'Failed to load session' }, { status: 500 });
  }

  let progress = 0;
  let nextStage: Stage = stage;

  const responses = (existingSession?.responses && typeof existingSession.responses === 'object')
    ? existingSession.responses
    : {};
  const updatedResponses = { ...responses } as Record<string, unknown>;

  if (stage === 'screener') {
    const totalItems = getScreenerItems(locale).length;
    const responses = asLikertItems((input as { items?: unknown })?.items, totalItems);
    updatedResponses.screener = responses;
    progress = Math.min(1, responses.length / totalItems);
    if (responses.length < totalItems) {
      return NextResponse.json(
        {
          error: `Please answer all ${totalItems} questions before proceeding.`,
          progress,
          nextStage: stage,
        },
        { status: 400 },
      );
    }
    nextStage = 'discriminators';
  }

  if (stage === 'discriminators') {
    const answers = asDiscriminatorAnswers((input as { answers?: unknown })?.answers, discriminatorsRequired);
    updatedResponses.discriminators = answers;
    progress = Math.min(1, answers.length / discriminatorsRequired);
    if (progress >= 1) {
      nextStage = 'wings';
    }
  }

  if (stage === 'wings') {
    const validIds = new Set(getInstinctItems(locale).map((item) => item.id));
    const responses = asLikertItems((input as { items?: unknown })?.items, validIds.size).filter((item) => validIds.has(item.itemId));
    updatedResponses.wings = responses;
    const total = validIds.size || 1;
    progress = Math.min(1, responses.length / total);
    if (progress >= 1) {
      nextStage = 'narrative';
    }
  }

  if (stage === 'narrative') {
    const texts = asTexts((input as { texts?: unknown })?.texts, 2);
    updatedResponses.narrative = texts;
    progress = texts.length / 2;
    if (texts.length === 2) {
      nextStage = 'complete';
    }
  }

  if (stage === 'complete') {
    progress = 1;
  }

  const upsertPayload = {
    session_id: sessionId,
    user_id: userId || existingSession?.user_id || null,
    locale,
    stage: nextStage,
    responses: updatedResponses,
    updated_at: new Date().toISOString()
  };

  const { error: upsertError } = await admin
    .from('enneagram_sessions')
    .upsert(upsertPayload, { onConflict: 'session_id' });

  if (upsertError) {
    console.error('[Enneagram Answer] Upsert error:', upsertError);
    return NextResponse.json({ error: 'Failed to save responses' }, { status: 500 });
  }

  return NextResponse.json({ sessionId, stage, nextStage, progress });
}
