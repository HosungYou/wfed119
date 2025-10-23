import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

async function checkSuperAdmin(userId: string) {
  const supabase = createServerSupabaseClient();
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  return user?.role === 'SUPER_ADMIN';
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isSuperAdmin = await checkSuperAdmin(session.user.id);
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    // Get counts from Supabase tables
    const [
      { count: userCount },
      { count: adminCount },
      { count: valueResultCount },
      { count: strengthCount },
      { count: sessionCount }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).in('role', ['ADMIN', 'SUPER_ADMIN']),
      supabase.from('value_results').select('*', { count: 'exact', head: true }),
      supabase.from('strength_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('user_sessions').select('*', { count: 'exact', head: true })
    ]);

    // Get completed sessions count
    const { count: completedSessionCount } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('completed', true);

    // Get active sessions (updated in last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: activeSessionCount } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('completed', false)
      .gte('updated_at', oneDayAgo);

    // Get value results by type
    const { data: valuesByType } = await supabase
      .from('value_results')
      .select('value_set');

    const valueTypeMap = valuesByType?.reduce((acc, item) => {
      acc[item.value_set] = (acc[item.value_set] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Get unique strengths count
    const { data: strengthData } = await supabase
      .from('strength_profiles')
      .select('strengths');

    const uniqueStrengths = new Set();
    strengthData?.forEach(profile => {
      if (profile.strengths && Array.isArray(profile.strengths)) {
        profile.strengths.forEach((strength: any) => {
          if (strength.name) uniqueStrengths.add(strength.name);
        });
      }
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