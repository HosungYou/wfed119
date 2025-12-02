import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import type {
  CreateThemeRequest,
  UpdateThemeRequest,
  ReorderThemesRequest,
  CreatePatternRequest,
} from '@/lib/types/lifeThemes';

/**
 * GET /api/life-themes/themes
 *
 * Fetch all themes and patterns for user's session
 * Query params: type=themes|patterns (default: both)
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

    const { searchParams } = new URL(req.url);
    const dataType = searchParams.get('type');

    if (dataType === 'themes') {
      const { data, error } = await supabase
        .from('life_themes')
        .select('*')
        .eq('session_id', ltSession.id)
        .order('priority_rank');

      if (error) {
        console.error('[Life Themes] Error fetching themes:', error);
        return NextResponse.json({ error: 'Failed to fetch themes' }, { status: 500 });
      }
      return NextResponse.json(data || []);
    }

    if (dataType === 'patterns') {
      const { data, error } = await supabase
        .from('life_themes_patterns')
        .select('*')
        .eq('session_id', ltSession.id)
        .order('created_at');

      if (error) {
        console.error('[Life Themes] Error fetching patterns:', error);
        return NextResponse.json({ error: 'Failed to fetch patterns' }, { status: 500 });
      }
      return NextResponse.json(data || []);
    }

    // Return both
    const [themesResult, patternsResult] = await Promise.all([
      supabase
        .from('life_themes')
        .select('*')
        .eq('session_id', ltSession.id)
        .order('priority_rank'),
      supabase
        .from('life_themes_patterns')
        .select('*')
        .eq('session_id', ltSession.id)
        .order('created_at'),
    ]);

    return NextResponse.json({
      themes: themesResult.data || [],
      patterns: patternsResult.data || [],
    });
  } catch (error) {
    console.error('[Life Themes] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/life-themes/themes
 *
 * Create a new theme or pattern
 * Body: { type: 'theme' | 'pattern', ...data }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type, ...data } = body;

    // Get user's session
    const { data: ltSession } = await supabase
      .from('life_themes_sessions')
      .select('id')
      .eq('user_id', auth.userId)
      .single();

    if (!ltSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (type === 'pattern') {
      const patternData = data as Omit<CreatePatternRequest, 'session_id'>;

      if (!patternData.pattern_text || !patternData.related_questions) {
        return NextResponse.json(
          { error: 'pattern_text and related_questions are required' },
          { status: 400 }
        );
      }

      const { data: result, error } = await supabase
        .from('life_themes_patterns')
        .insert({
          session_id: ltSession.id,
          pattern_text: patternData.pattern_text,
          pattern_description: patternData.pattern_description || null,
          related_questions: patternData.related_questions,
          evidence: patternData.evidence || null,
          source: patternData.source || 'user',
          confidence_score: patternData.confidence_score || null,
        })
        .select()
        .single();

      if (error) {
        console.error('[Life Themes] Error creating pattern:', error);
        return NextResponse.json({ error: 'Failed to create pattern' }, { status: 500 });
      }
      return NextResponse.json(result);
    }

    // Default: create theme
    const themeData = data as Omit<CreateThemeRequest, 'session_id'>;

    if (!themeData.theme_name) {
      return NextResponse.json({ error: 'theme_name is required' }, { status: 400 });
    }

    // Get next priority if not provided
    let priorityRank = themeData.priority_rank;
    if (!priorityRank) {
      const { data: existingThemes } = await supabase
        .from('life_themes')
        .select('priority_rank')
        .eq('session_id', ltSession.id)
        .order('priority_rank', { ascending: false })
        .limit(1);

      priorityRank = (existingThemes?.[0]?.priority_rank || 0) + 1;
    }

    const { data: result, error } = await supabase
      .from('life_themes')
      .insert({
        session_id: ltSession.id,
        theme_name: themeData.theme_name,
        theme_description: themeData.theme_description || null,
        priority_rank: priorityRank,
        related_pattern_ids: themeData.related_pattern_ids || null,
        enneagram_connection: themeData.enneagram_connection || null,
        personal_reflection: themeData.personal_reflection || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[Life Themes] Error creating theme:', error);
      return NextResponse.json({ error: 'Failed to create theme' }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Life Themes] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/life-themes/themes
 *
 * Update a theme or pattern, or reorder themes
 * Query params: id=<uuid> (for update) or action=reorder (for reordering)
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('id');
    const action = searchParams.get('action');
    const itemType = searchParams.get('type'); // 'theme' or 'pattern'

    // Get user's session
    const { data: ltSession } = await supabase
      .from('life_themes_sessions')
      .select('id')
      .eq('user_id', auth.userId)
      .single();

    if (!ltSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const body = await req.json();

    // Handle reordering
    if (action === 'reorder') {
      const { theme_ids } = body as ReorderThemesRequest;

      if (!theme_ids || !Array.isArray(theme_ids)) {
        return NextResponse.json({ error: 'theme_ids array is required' }, { status: 400 });
      }

      // Update priorities based on order in array
      const updates = theme_ids.map((themeId, index) =>
        supabase
          .from('life_themes')
          .update({ priority_rank: index + 1 })
          .eq('id', themeId)
          .eq('session_id', ltSession.id)
      );

      await Promise.all(updates);

      // Fetch updated themes
      const { data: themes } = await supabase
        .from('life_themes')
        .select('*')
        .eq('session_id', ltSession.id)
        .order('priority_rank');

      return NextResponse.json(themes || []);
    }

    // Handle single item update
    if (!itemId) {
      return NextResponse.json({ error: 'id query param is required' }, { status: 400 });
    }

    if (itemType === 'pattern') {
      const updateData: Record<string, unknown> = {};
      if (body.pattern_text !== undefined) updateData.pattern_text = body.pattern_text;
      if (body.pattern_description !== undefined) updateData.pattern_description = body.pattern_description;
      if (body.related_questions !== undefined) updateData.related_questions = body.related_questions;
      if (body.evidence !== undefined) updateData.evidence = body.evidence;

      const { data, error } = await supabase
        .from('life_themes_patterns')
        .update(updateData)
        .eq('id', itemId)
        .eq('session_id', ltSession.id)
        .select()
        .single();

      if (error) {
        console.error('[Life Themes] Error updating pattern:', error);
        return NextResponse.json({ error: 'Failed to update pattern' }, { status: 500 });
      }
      return NextResponse.json(data);
    }

    // Default: update theme
    const updateData: Record<string, unknown> = {};
    if (body.theme_name !== undefined) updateData.theme_name = body.theme_name;
    if (body.theme_description !== undefined) updateData.theme_description = body.theme_description;
    if (body.priority_rank !== undefined) updateData.priority_rank = body.priority_rank;
    if (body.related_pattern_ids !== undefined) updateData.related_pattern_ids = body.related_pattern_ids;
    if (body.enneagram_connection !== undefined) updateData.enneagram_connection = body.enneagram_connection;
    if (body.personal_reflection !== undefined) updateData.personal_reflection = body.personal_reflection;

    const { data, error } = await supabase
      .from('life_themes')
      .update(updateData)
      .eq('id', itemId)
      .eq('session_id', ltSession.id)
      .select()
      .single();

    if (error) {
      console.error('[Life Themes] Error updating theme:', error);
      return NextResponse.json({ error: 'Failed to update theme' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Life Themes] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/life-themes/themes
 *
 * Delete a theme or pattern
 * Query params: id=<uuid>, type=theme|pattern (required)
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('id');
    const itemType = searchParams.get('type');

    if (!itemId || !itemType) {
      return NextResponse.json(
        { error: 'id and type query params are required' },
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

    const tableName = itemType === 'pattern' ? 'life_themes_patterns' : 'life_themes';

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', itemId)
      .eq('session_id', ltSession.id);

    if (error) {
      console.error('[Life Themes] Error deleting:', error);
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }

    // If deleting theme, renumber remaining themes
    if (itemType === 'theme') {
      const { data: remainingThemes } = await supabase
        .from('life_themes')
        .select('id, priority_rank')
        .eq('session_id', ltSession.id)
        .order('priority_rank');

      if (remainingThemes) {
        for (let i = 0; i < remainingThemes.length; i++) {
          if (remainingThemes[i].priority_rank !== i + 1) {
            await supabase
              .from('life_themes')
              .update({ priority_rank: i + 1 })
              .eq('id', remainingThemes[i].id);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Life Themes] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
