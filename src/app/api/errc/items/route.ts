import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import type { CreateErrcItemRequest, ReorderErrcItemsRequest, ErrcCategory } from '@/lib/types/errc';

/**
 * GET /api/errc/items
 *
 * Fetch all ERRC items for user's session
 * Query params: category=eliminate|reduce|raise|create (optional)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    // Use getUser() for better security (authenticates via Auth server)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    let session = null;

    if (!userError && user) {
      // Get session only after user verification
      const { data: { session: verifiedSession } } = await supabase.auth.getSession();
      session = verifiedSession;
    }
    const auth = checkDevAuth(session);

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

    // Check for category filter
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') as ErrcCategory | null;

    let query = supabase
      .from('errc_items')
      .select('*')
      .eq('session_id', errcSession.id)
      .order('priority');

    if (category && ['eliminate', 'reduce', 'raise', 'create'].includes(category)) {
      query = query.eq('category', category);
    }

    const { data: items, error } = await query;

    if (error) {
      console.error('[ERRC Items] Error fetching:', error);
      return NextResponse.json({ error: 'Failed to fetch ERRC items' }, { status: 500 });
    }

    // Fetch action steps for all items
    const itemIds = items?.map(i => i.id) || [];
    const { data: steps } = itemIds.length > 0
      ? await supabase
          .from('errc_action_steps')
          .select('*')
          .in('errc_item_id', itemIds)
          .order('step_number')
      : { data: [] };

    // Combine items with steps
    const itemsWithSteps = items?.map(item => ({
      ...item,
      actionSteps: steps?.filter(s => s.errc_item_id === item.id) || [],
    })) || [];

    return NextResponse.json(itemsWithSteps);
  } catch (error) {
    console.error('[ERRC Items] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/errc/items
 *
 * Create a new ERRC item
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    // Use getUser() for better security (authenticates via Auth server)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    let session = null;

    if (!userError && user) {
      // Get session only after user verification
      const { data: { session: verifiedSession } } = await supabase.auth.getSession();
      session = verifiedSession;
    }
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateErrcItemRequest = await req.json();

    // Validate required fields
    if (!body.category || !body.item_text) {
      return NextResponse.json({ error: 'category and item_text are required' }, { status: 400 });
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

    // Get next priority for this category
    const { data: existingItems } = await supabase
      .from('errc_items')
      .select('priority')
      .eq('session_id', errcSession.id)
      .eq('category', body.category)
      .order('priority', { ascending: false })
      .limit(1);

    const nextPriority = body.priority || ((existingItems?.[0]?.priority || 0) + 1);

    const { data, error } = await supabase
      .from('errc_items')
      .insert({
        session_id: errcSession.id,
        category: body.category,
        item_text: body.item_text,
        description: body.description || null,
        priority: nextPriority,
        related_wellbeing: body.related_wellbeing || [],
        is_active: true,
        progress_percentage: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('[ERRC Items] Error creating:', error);
      return NextResponse.json({ error: 'Failed to create ERRC item' }, { status: 500 });
    }

    return NextResponse.json({ ...data, actionSteps: [] });
  } catch (error) {
    console.error('[ERRC Items] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/errc/items
 *
 * Reorder items within a category
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    // Use getUser() for better security (authenticates via Auth server)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    let session = null;

    if (!userError && user) {
      // Get session only after user verification
      const { data: { session: verifiedSession } } = await supabase.auth.getSession();
      session = verifiedSession;
    }
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ReorderErrcItemsRequest = await req.json();

    if (!body.category || !body.item_ids || !Array.isArray(body.item_ids)) {
      return NextResponse.json({ error: 'category and item_ids array are required' }, { status: 400 });
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

    // Update priorities based on order in array
    const updates = body.item_ids.map((itemId, index) =>
      supabase
        .from('errc_items')
        .update({ priority: index + 1 })
        .eq('id', itemId)
        .eq('session_id', errcSession.id)
        .eq('category', body.category)
    );

    await Promise.all(updates);

    // Fetch updated items
    const { data: items } = await supabase
      .from('errc_items')
      .select('*')
      .eq('session_id', errcSession.id)
      .eq('category', body.category)
      .order('priority');

    return NextResponse.json(items || []);
  } catch (error) {
    console.error('[ERRC Items] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
