import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createSupabaseAdmin } from '@/lib/supabase';

const requireSuperAdmin = async () => {
  const supabase = await createServerSupabaseClient();
  // Use getUser() for better security (authenticates via Auth server)
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  const { data: userData, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('[Admin Cleanup] Role lookup error:', error);
  }

  if (userData?.role !== 'SUPER_ADMIN') {
    return { ok: false, status: 403, error: 'Super admin access required' };
  }

  return { ok: true, status: 200, error: null };
};

export async function POST(req: NextRequest) {
  const access = await requireSuperAdmin();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    createSupabaseAdmin();

    return NextResponse.json({
      success: true,
      sessionsDeleted: 0,
      orphanedRecords: 0,
      message: 'Cleanup is not automated; configure retention policies in Supabase if needed.'
    });
  } catch (error) {
    console.error('[Admin Cleanup] Service role missing:', error);
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured on the server.' },
      { status: 501 }
    );
  }
}
