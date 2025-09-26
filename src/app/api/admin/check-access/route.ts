import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { isAdmin: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const googleId = session.user.id;
    const normalizedEmail = session.user.email?.toLowerCase() ?? null;

    let user = await prisma.user.findUnique({
      where: { googleId },
      select: { role: true, email: true, googleId: true },
    });

    if (!user && normalizedEmail) {
      const userByEmail = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { role: true, email: true, googleId: true },
      });

      if (userByEmail) {
        user = await prisma.user.update({
          where: { email: normalizedEmail },
          data: { googleId },
          select: { role: true, email: true, googleId: true },
        });
      }
    }

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
