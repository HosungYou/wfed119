import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { isAdmin: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { data: user } = await supabase
      .from('users')
      .select('role, email, id')
      .eq('id', session.user.id)
      .single();

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    return NextResponse.json({
      isAdmin,
      isSuperAdmin,
      role: user?.role || 'USER',
      email: user?.email
    });

  } catch (error) {
    console.error('Admin access check error:', error);
    return NextResponse.json(
      { isAdmin: false, error: 'Failed to check access' },
      { status: 500 }
    );
  }
}