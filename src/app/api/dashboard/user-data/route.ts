import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user from Supabase
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email;
    const userName = session.user.user_metadata?.name || session.user.email;
    const userImage = session.user.user_metadata?.avatar_url;

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
          completed: false,
          latestStrengths: [],
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