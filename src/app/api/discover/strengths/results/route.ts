import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';

type StrengthBucket = {
  skills: string[];
  attitudes: string[];
  values: string[];
};

const emptyStrengths: StrengthBucket = { skills: [], attitudes: [], values: [] };

const normalizeStrengths = (raw: unknown): StrengthBucket => {
  if (!raw || typeof raw !== 'object') return emptyStrengths;

  const result: StrengthBucket = { skills: [], attitudes: [], values: [] };
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

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('[Strengths Results] Auth error:', authError);
    }

    const auth = checkDevAuth(user ? { user } : null);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = auth.userId;
    const userEmail = user?.email || null;

    let profile = null as any;

    const { data: profileByUser, error: profileError } = await supabase
      .from('strength_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('[Strengths Results] Query error:', profileError);
    }

    profile = profileByUser;

    if (!profile && userEmail) {
      const { data: profileByEmail, error: emailError } = await supabase
        .from('strength_profiles')
        .select('*')
        .eq('user_email', userEmail)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (emailError && emailError.code !== 'PGRST116') {
        console.error('[Strengths Results] Email query error:', emailError);
      }

      profile = profileByEmail;
    }

    if (!profile) {
      return NextResponse.json({
        exists: false,
        is_completed: false,
        strengths: emptyStrengths
      });
    }

    return NextResponse.json({
      exists: true,
      is_completed: true,
      session_id: profile.session_id,
      strengths: normalizeStrengths(profile.strengths),
      summary: profile.summary || null,
      insights: profile.insights || null,
      updated_at: profile.updated_at
    });
  } catch (error) {
    console.error('[Strengths Results] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
