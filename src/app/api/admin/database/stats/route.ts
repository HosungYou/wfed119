import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createSupabaseAdmin } from '@/lib/supabase';

async function checkSuperAdmin(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  return user?.role === 'SUPER_ADMIN';
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isSuperAdmin = await checkSuperAdmin(session.user.id);
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    let admin;
    try {
      admin = createSupabaseAdmin();
    } catch (error) {
      console.error('Database stats admin client error:', error);
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured on the server.' },
        { status: 501 }
      );
    }

    // Get counts from Supabase tables
    const [
      { count: userCount },
      { count: adminCount },
      { count: valueResultCount },
      { count: strengthCount },
      { count: sessionCount }
    ] = await Promise.all([
      admin.from('users').select('*', { count: 'exact', head: true }),
      admin.from('users').select('*', { count: 'exact', head: true }).in('role', ['ADMIN', 'SUPER_ADMIN']),
      admin.from('value_results').select('*', { count: 'exact', head: true }),
      admin.from('strength_profiles').select('*', { count: 'exact', head: true }),
      admin.from('user_sessions').select('*', { count: 'exact', head: true })
    ]);

    // Get completed sessions count
    const { count: completedSessionCount } = await admin
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('completed', true);

    // Get active sessions (updated in last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: activeSessionCount } = await admin
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('completed', false)
      .gte('updated_at', oneDayAgo);

    // Get value results by type
    const { data: valuesByType } = await admin
      .from('value_results')
      .select('value_set');

    const valueTypeMap = valuesByType?.reduce((acc, item) => {
      acc[item.value_set] = (acc[item.value_set] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Get unique strengths count
    const { data: strengthData } = await admin
      .from('strength_profiles')
      .select('strengths');

    const uniqueStrengths = new Set();
    strengthData?.forEach(profile => {
      if (!profile.strengths || typeof profile.strengths !== 'object') return;
      const buckets = profile.strengths as Record<string, unknown>;

      Object.values(buckets).forEach((items) => {
        if (!Array.isArray(items)) return;
        items.forEach((strength: any) => {
          if (typeof strength === 'string') {
            uniqueStrengths.add(strength);
            return;
          }
          if (strength && typeof strength === 'object' && strength.name) {
            uniqueStrengths.add(strength.name);
          }
        });
      });
    });

    // Simple storage placeholder (Supabase manages storage)
    const storageInfo = {
      used: 'N/A',
      limit: 'Managed by Supabase',
      percentage: 0
    };

    return NextResponse.json({
      users: {
        total: userCount || 0,
        admins: adminCount || 0,
        active: activeSessionCount || 0
      },
      sessions: {
        total: sessionCount || 0,
        completed: completedSessionCount || 0,
        active: activeSessionCount || 0
      },
      values: {
        total: valueResultCount || 0,
        byType: valueTypeMap
      },
      strengths: {
        total: strengthCount || 0,
        unique: uniqueStrengths.size
      },
      storage: storageInfo,
      lastBackup: null // Supabase handles backups automatically
    });

  } catch (error) {
    console.error('Database stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database statistics' },
      { status: 500 }
    );
  }
}
