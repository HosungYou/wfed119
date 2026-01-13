import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getVerifiedUser } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  try {
    const user = await getVerifiedUser();

    if (!user) {
      return NextResponse.json(
        { isAdmin: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const { data: userData } = await supabase
      .from('users')
      .select('role, email, id')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.role === 'ADMIN' || userData?.role === 'SUPER_ADMIN';
    const isSuperAdmin = userData?.role === 'SUPER_ADMIN';

    return NextResponse.json({
      isAdmin,
      isSuperAdmin,
      role: userData?.role || 'USER',
      email: userData?.email
    });

  } catch (error) {
    console.error('Admin access check error:', error);
    return NextResponse.json(
      { isAdmin: false, error: 'Failed to check access' },
      { status: 500 }
    );
  }
}