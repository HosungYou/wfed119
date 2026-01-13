import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getVerifiedUser } from '@/lib/supabase-server';

const normalizeStrengths = (raw: unknown) => {
  if (!raw || typeof raw !== 'object') return { skills: [], attitudes: [], values: [] };

  const record = raw as Record<string, unknown>;
  const result = { skills: [] as string[], attitudes: [] as string[], values: [] as string[] };

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
    // Get verified user using the new helper
    const user = await getVerifiedUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const userEmail = user.email;
    const userName = user.user_metadata?.name || user.email;
    const userImage = user.user_metadata?.avatar_url;

    const supabase = await createServerSupabaseClient();

    // Test basic database connection
    console.log('Testing Supabase connection...');

    // Get user data from users table
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    // Try to get value results
    let valueResults = [];
    try {
      const { data, error } = await supabase
        .from('value_results')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('ValueResult query error:', error);
      } else {
        valueResults = data || [];
        console.log('ValueResult query successful:', valueResults.length);
      }
    } catch (valueError) {
      console.error('ValueResult query failed:', valueError);
    }

    // Try to get strengths result
    let strengthsResult: any = null;
    try {
      const { data } = await supabase
        .from('strength_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      strengthsResult = data || null;
    } catch (strengthError) {
      console.error('Strengths query failed:', strengthError);
    }

    // Return simplified dashboard data
    const dashboard = {
      user: {
        id: userId,
        email: userEmail,
        name: userName,
        image: userImage,
        createdAt: userData?.created_at || new Date().toISOString(),
      },

      modules: {
        strengths: {
          completed: !!strengthsResult,
          latestStrengths: strengthsResult ? normalizeStrengths(strengthsResult.strengths) : [],
        },

        values: {
          terminal: valueResults.find(v => v.value_set === 'terminal') || null,
          instrumental: valueResults.find(v => v.value_set === 'instrumental') || null,
          work: valueResults.find(v => v.value_set === 'work') || null,
          completed: valueResults.length >= 3
        },

        enneagram: {
          completed: false
        },

        career: {
          completed: false
        }
      },

      insights: {
        strengthSummary: [],
        completionRate: valueResults.length > 0 ? 50 : 0
      },

      adminAccess: userData?.role === 'ADMIN' || userData?.role === 'SUPER_ADMIN'
    };

    return NextResponse.json(dashboard);

  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error.message },
      { status: 500 }
    );
  }
}
