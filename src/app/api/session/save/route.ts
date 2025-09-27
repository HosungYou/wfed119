import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, stage, messages, strengths } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    const { data: { session: authSession } } = await supabase.auth.getSession();

    const userId = authSession?.user?.id ?? null;
    const userEmail = authSession?.user?.email ?? null;
    const userName = authSession?.user?.user_metadata?.name ?? null;

    const normalizedStage = typeof stage === 'string' && stage ? stage : 'initial';
    const isCompleted = normalizedStage === 'summary';

    // Save or update user session
    const { error: sessionError } = await supabase
      .from('user_sessions')
      .upsert({
        session_id: sessionId,
        user_id: userId,
        session_type: 'strengths',
        current_stage: normalizedStage,
        completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
        metadata: {
          module: 'strengths',
          lastUpdated: new Date().toISOString(),
          userEmail: userEmail,
          userName: userName
        }
      });

    if (sessionError) {
      console.error('Session upsert error:', sessionError);
    }

    // Handle strengths data
    const normalisedStrengths = {
      skills: Array.isArray(strengths?.skills) ? strengths.skills : [],
      attitudes: Array.isArray(strengths?.attitudes) ? strengths.attitudes : [],
      values: Array.isArray(strengths?.values) ? strengths.values : [],
    };

    if (
      normalisedStrengths.skills.length ||
      normalisedStrengths.attitudes.length ||
      normalisedStrengths.values.length
    ) {
      const summarySegments: string[] = [];
      if (normalisedStrengths.skills.length) {
        summarySegments.push(`Skills ▸ ${normalisedStrengths.skills.slice(0, 3).join(', ')}`);
      }
      if (normalisedStrengths.attitudes.length) {
        summarySegments.push(`Attitudes ▸ ${normalisedStrengths.attitudes.slice(0, 3).join(', ')}`);
      }
      if (normalisedStrengths.values.length) {
        summarySegments.push(`Values ▸ ${normalisedStrengths.values.slice(0, 3).join(', ')}`);
      }

      const profileInsights = {
        topPicks: {
          skill: normalisedStrengths.skills[0] ?? null,
          attitude: normalisedStrengths.attitudes[0] ?? null,
          value: normalisedStrengths.values[0] ?? null,
        },
        counts: {
          skills: normalisedStrengths.skills.length,
          attitudes: normalisedStrengths.attitudes.length,
          values: normalisedStrengths.values.length,
        },
        stage: normalizedStage,
        completed: isCompleted,
        updatedAt: new Date().toISOString(),
      };

      // Save strength profile
      const { error: strengthError } = await supabase
        .from('strength_profiles')
        .upsert({
          session_id: sessionId,
          user_id: userId,
          user_email: userEmail,
          strengths: normalisedStrengths,
          summary: summarySegments.join(' | ') || null,
          insights: profileInsights,
        });

      if (strengthError) {
        console.error('Strength profile upsert error:', strengthError);
      }
    }

    return NextResponse.json({
      success: true,
      sessionId,
      message: 'Session saved successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Session Save API Error:', error);

    return NextResponse.json(
      { error: 'Failed to save session. Please try again.' },
      { status: 500 }
    );
  }
}