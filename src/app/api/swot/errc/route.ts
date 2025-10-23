import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';

/**
 * GET /api/swot/errc
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: swotData } = await supabase
      .from('swot_analyses')
      .select('id')
      .eq('user_id', auth.userId)
      .single();

    if (!swotData) {
      return NextResponse.json({});
    }

    const { data, error } = await supabase
      .from('swot_errc')
      .select('*')
      .eq('swot_analysis_id', swotData.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[SWOT ERRC] Error fetching:', error);
      return NextResponse.json({ error: 'Failed to fetch ERRC' }, { status: 500 });
    }

    return NextResponse.json(data || {});
  } catch (error) {
    console.error('[SWOT ERRC] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/swot/errc
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
    const { eliminate, reduce, reinforce, create_new } = body;

    const { data: swotData } = await supabase
      .from('swot_analyses')
      .select('id')
      .eq('user_id', auth.userId)
      .single();

    if (!swotData) {
      return NextResponse.json({ error: 'SWOT analysis not found' }, { status: 404 });
    }

    // Check if ERRC exists
    const { data: existingERRC } = await supabase
      .from('swot_errc')
      .select('id')
      .eq('swot_analysis_id', swotData.id)
      .single();

    let result;

    if (existingERRC) {
      // Update
      const { data, error } = await supabase
        .from('swot_errc')
        .update({
          eliminate,
          reduce,
          reinforce,
          create_new
        })
        .eq('swot_analysis_id', swotData.id)
        .select()
        .single();

      if (error) {
        console.error('[SWOT ERRC] Error updating:', error);
        return NextResponse.json({ error: 'Failed to update ERRC' }, { status: 500 });
      }
      result = data;
    } else {
      // Insert
      const { data, error } = await supabase
        .from('swot_errc')
        .insert({
          swot_analysis_id: swotData.id,
          user_id: auth.userId,
          eliminate,
          reduce,
          reinforce,
          create_new
        })
        .select()
        .single();

      if (error) {
        console.error('[SWOT ERRC] Error inserting:', error);
        return NextResponse.json({ error: 'Failed to create ERRC' }, { status: 500 });
      }
      result = data;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[SWOT ERRC] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
