import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import type {
  SaveResponseRequest,
  UpdateResponseRequest,
  QuestionNumber,
} from '@/lib/types/lifeThemes';
import { validateResponse, getNextStep, getStepByQuestion, QUESTION_CONFIG } from '@/lib/types/lifeThemes';

/**
 * GET /api/life-themes/responses
 *
 * Fetch all responses for user's session
 * Query params: question=1-6 (optional)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's session
    const { data: ltSession } = await supabase
      .from('life_themes_sessions')
      .select('id')
      .eq('user_id', auth.userId)
      .single();

    if (!ltSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check for question filter
    const { searchParams } = new URL(req.url);
    const questionParam = searchParams.get('question');

    let query = supabase
      .from('life_themes_responses')
      .select('*')
      .eq('session_id', ltSession.id)
      .order('question_number');

    if (questionParam) {
      const questionNumber = parseInt(questionParam) as QuestionNumber;
      if (questionNumber >= 1 && questionNumber <= 6) {
        query = query.eq('question_number', questionNumber);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Life Themes Responses] Error fetching:', error);
      return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
    }

    // If fetching specific question, return single object
    if (questionParam) {
      return NextResponse.json(data?.[0] || null);
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('[Life Themes Responses] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/life-themes/responses
 *
 * Create or update response (upsert by question_number)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: SaveResponseRequest = await req.json();

    if (!body.question_number || !body.response_data) {
      return NextResponse.json(
        { error: 'question_number and response_data are required' },
        { status: 400 }
      );
    }

    // Validate question number
    if (body.question_number < 1 || body.question_number > 6) {
      return NextResponse.json(
        { error: 'question_number must be between 1 and 6' },
        { status: 400 }
      );
    }

    // Get user's session
    const { data: ltSession } = await supabase
      .from('life_themes_sessions')
      .select('id')
      .eq('user_id', auth.userId)
      .single();

    if (!ltSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Validate response data if marking as completed
    if (body.is_completed) {
      const validation = validateResponse(body.question_number, body.response_data);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.errors.join(', ') },
          { status: 400 }
        );
      }
    }

    // Check if response exists
    const { data: existing } = await supabase
      .from('life_themes_responses')
      .select('id')
      .eq('session_id', ltSession.id)
      .eq('question_number', body.question_number)
      .single();

    let result;

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('life_themes_responses')
        .update({
          response_data: body.response_data,
          identified_patterns: body.identified_patterns || null,
          is_completed: body.is_completed ?? false,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('[Life Themes Responses] Error updating:', error);
        return NextResponse.json({ error: 'Failed to update response' }, { status: 500 });
      }
      result = data;
    } else {
      // Create new
      const { data, error } = await supabase
        .from('life_themes_responses')
        .insert({
          session_id: ltSession.id,
          question_number: body.question_number,
          response_data: body.response_data,
          identified_patterns: body.identified_patterns || null,
          is_completed: body.is_completed ?? false,
        })
        .select()
        .single();

      if (error) {
        console.error('[Life Themes Responses] Error creating:', error);
        return NextResponse.json({ error: 'Failed to create response' }, { status: 500 });
      }
      result = data;
    }

    // Update session step if completing this question
    if (body.is_completed) {
      const currentStep = getStepByQuestion(body.question_number);
      const nextStep = getNextStep(currentStep);

      if (nextStep) {
        await supabase
          .from('life_themes_sessions')
          .update({ current_step: nextStep })
          .eq('id', ltSession.id);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Life Themes Responses] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/life-themes/responses
 *
 * Update specific response by question number
 * Query params: question=1-6 (required)
 */
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const questionParam = searchParams.get('question');

    if (!questionParam) {
      return NextResponse.json(
        { error: 'question query param is required' },
        { status: 400 }
      );
    }

    const questionNumber = parseInt(questionParam) as QuestionNumber;
    if (questionNumber < 1 || questionNumber > 6) {
      return NextResponse.json(
        { error: 'question must be between 1 and 6' },
        { status: 400 }
      );
    }

    const body: UpdateResponseRequest = await req.json();

    // Get user's session
    const { data: ltSession } = await supabase
      .from('life_themes_sessions')
      .select('id')
      .eq('user_id', auth.userId)
      .single();

    if (!ltSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Validate if marking as completed
    if (body.is_completed && body.response_data) {
      const validation = validateResponse(questionNumber, body.response_data);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.errors.join(', ') },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (body.response_data !== undefined) updateData.response_data = body.response_data;
    if (body.identified_patterns !== undefined) updateData.identified_patterns = body.identified_patterns;
    if (body.is_completed !== undefined) updateData.is_completed = body.is_completed;

    const { data, error } = await supabase
      .from('life_themes_responses')
      .update(updateData)
      .eq('session_id', ltSession.id)
      .eq('question_number', questionNumber)
      .select()
      .single();

    if (error) {
      console.error('[Life Themes Responses] Error updating:', error);
      return NextResponse.json({ error: 'Failed to update response' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Life Themes Responses] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
