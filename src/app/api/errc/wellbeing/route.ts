import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import type { CreateWellbeingAssessmentRequest, UpdateWellbeingAssessmentRequest } from '@/lib/types/errc';
import { validateWellbeingAssessment } from '@/lib/types/errc';

/**
 * GET /api/errc/wellbeing
 *
 * Fetch wellbeing assessments for user's ERRC session
 * Query params: type=before|after (optional)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    // Use getUser() for better security (authenticates via Auth server)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    const auth = checkDevAuth(user);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's ERRC session
    const { data: errcSession } = await supabase
      .from('errc_sessions')
      .select('id')
      .eq('user_id', auth.userId)
      .single();

    if (!errcSession) {
      return NextResponse.json({ error: 'ERRC session not found' }, { status: 404 });
    }

    // Check for type filter
    const { searchParams } = new URL(req.url);
    const assessmentType = searchParams.get('type');

    let query = supabase
      .from('errc_wellbeing_assessments')
      .select('*')
      .eq('session_id', errcSession.id);

    if (assessmentType && (assessmentType === 'before' || assessmentType === 'after')) {
      query = query.eq('assessment_type', assessmentType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ERRC Wellbeing] Error fetching:', error);
      return NextResponse.json({ error: 'Failed to fetch wellbeing assessments' }, { status: 500 });
    }

    // If fetching specific type, return single object
    if (assessmentType) {
      return NextResponse.json(data?.[0] || null);
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('[ERRC Wellbeing] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/errc/wellbeing
 *
 * Create or update wellbeing assessment (upsert by session_id + type)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    // Use getUser() for better security (authenticates via Auth server)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    const auth = checkDevAuth(user);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateWellbeingAssessmentRequest = await req.json();

    // Validate wellbeing scores
    const validation = validateWellbeingAssessment(body);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 });
    }

    // Get user's ERRC session
    const { data: errcSession } = await supabase
      .from('errc_sessions')
      .select('id')
      .eq('user_id', auth.userId)
      .single();

    if (!errcSession) {
      return NextResponse.json({ error: 'ERRC session not found' }, { status: 404 });
    }

    // Check if assessment exists
    const { data: existing } = await supabase
      .from('errc_wellbeing_assessments')
      .select('id')
      .eq('session_id', errcSession.id)
      .eq('assessment_type', body.assessment_type)
      .single();

    let result;

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('errc_wellbeing_assessments')
        .update({
          physical_wellbeing: body.physical_wellbeing,
          emotional_wellbeing: body.emotional_wellbeing,
          intellectual_wellbeing: body.intellectual_wellbeing,
          social_wellbeing: body.social_wellbeing,
          spiritual_wellbeing: body.spiritual_wellbeing,
          occupational_wellbeing: body.occupational_wellbeing,
          notes: body.notes || null,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('[ERRC Wellbeing] Error updating:', error);
        return NextResponse.json({ error: 'Failed to update wellbeing assessment' }, { status: 500 });
      }
      result = data;
    } else {
      // Create new
      const { data, error } = await supabase
        .from('errc_wellbeing_assessments')
        .insert({
          session_id: errcSession.id,
          assessment_type: body.assessment_type,
          physical_wellbeing: body.physical_wellbeing,
          emotional_wellbeing: body.emotional_wellbeing,
          intellectual_wellbeing: body.intellectual_wellbeing,
          social_wellbeing: body.social_wellbeing,
          spiritual_wellbeing: body.spiritual_wellbeing,
          occupational_wellbeing: body.occupational_wellbeing,
          notes: body.notes || null,
        })
        .select()
        .single();

      if (error) {
        console.error('[ERRC Wellbeing] Error creating:', error);
        return NextResponse.json({ error: 'Failed to create wellbeing assessment' }, { status: 500 });
      }
      result = data;
    }

    // Update session step if completing before assessment
    if (body.assessment_type === 'before') {
      await supabase
        .from('errc_sessions')
        .update({ current_step: 'canvas' })
        .eq('id', errcSession.id);
    } else if (body.assessment_type === 'after') {
      await supabase
        .from('errc_sessions')
        .update({ current_step: 'results' })
        .eq('id', errcSession.id);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[ERRC Wellbeing] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/errc/wellbeing
 *
 * Update specific wellbeing assessment
 * Query params: type=before|after (required)
 */
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    // Use getUser() for better security (authenticates via Auth server)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    const auth = checkDevAuth(user);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const assessmentType = searchParams.get('type');

    if (!assessmentType || (assessmentType !== 'before' && assessmentType !== 'after')) {
      return NextResponse.json({ error: 'type parameter required (before or after)' }, { status: 400 });
    }

    const body: UpdateWellbeingAssessmentRequest = await req.json();

    // Get user's ERRC session
    const { data: errcSession } = await supabase
      .from('errc_sessions')
      .select('id')
      .eq('user_id', auth.userId)
      .single();

    if (!errcSession) {
      return NextResponse.json({ error: 'ERRC session not found' }, { status: 404 });
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (body.physical_wellbeing !== undefined) updateData.physical_wellbeing = body.physical_wellbeing;
    if (body.emotional_wellbeing !== undefined) updateData.emotional_wellbeing = body.emotional_wellbeing;
    if (body.intellectual_wellbeing !== undefined) updateData.intellectual_wellbeing = body.intellectual_wellbeing;
    if (body.social_wellbeing !== undefined) updateData.social_wellbeing = body.social_wellbeing;
    if (body.spiritual_wellbeing !== undefined) updateData.spiritual_wellbeing = body.spiritual_wellbeing;
    if (body.occupational_wellbeing !== undefined) updateData.occupational_wellbeing = body.occupational_wellbeing;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const { data, error } = await supabase
      .from('errc_wellbeing_assessments')
      .update(updateData)
      .eq('session_id', errcSession.id)
      .eq('assessment_type', assessmentType)
      .select()
      .single();

    if (error) {
      console.error('[ERRC Wellbeing] Error updating:', error);
      return NextResponse.json({ error: 'Failed to update wellbeing assessment' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[ERRC Wellbeing] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
