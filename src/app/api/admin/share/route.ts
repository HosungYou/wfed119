import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// Check if user is admin
async function checkAdminAccess(userId: string) {
  const user = await prisma.user.findUnique({
    where: { googleId: userId },
    select: { role: true }
  });
  return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await checkAdminAccess(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId');
    const dataType = searchParams.get('dataType') || 'all';

    // Get admin's groups
    const adminGroups = await prisma.adminGroup.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          { members: { some: { googleId: session.user.id } } }
        ],
        isActive: true
      },
      include: {
        members: {
          select: { id: true, email: true, name: true }
        },
        sharedData: {
          where: groupId ? { groupId } : undefined,
          include: {
            user: {
              select: { id: true, email: true, name: true }
            }
          }
        },
        permissions: true
      }
    });

    // Get shared data based on permissions
    const sharedData = await prisma.sharedData.findMany({
      where: {
        groupId: groupId || { in: adminGroups.map(g => g.id) },
        dataType: dataType === 'all' ? undefined : dataType
      },
      include: {
        user: {
          select: { id: true, email: true, name: true }
        },
        group: true
      }
    });

    // Fetch actual data based on shared permissions
    const enrichedData = await Promise.all(
      sharedData.map(async (share) => {
        let actualData = null;

        switch (share.dataType) {
          case 'values':
            actualData = await prisma.valueResult.findMany({
              where: { userId: share.userId },
              select: {
                id: true,
                userId: true,
                valueSet: true,
                layout: true,
                top3: true,
                createdAt: true,
                updatedAt: true
              }
            });
            break;

          case 'strengths':
            actualData = await prisma.userSession.findMany({
              where: {
                userId: share.userId,
                sessionType: 'strengths',
                completed: true
              },
              include: { strengths: true }
            });
            break;

          case 'analysis':
            actualData = await prisma.analysisResult.findMany({
              where: { userId: share.userId },
              orderBy: { generatedAt: 'desc' },
              take: 5
            });
            break;

          case 'all':
            actualData = {
              values: await prisma.valueResult.findMany({
                where: { userId: share.userId },
                select: {
                  id: true,
                  userId: true,
                  valueSet: true,
                  layout: true,
                  top3: true,
                  createdAt: true,
                  updatedAt: true
                }
              }),
              strengths: await prisma.userSession.findMany({
                where: { userId: share.userId, completed: true },
                include: { strengths: true }
              }),
              analyses: await prisma.analysisResult.findMany({
                where: { userId: share.userId },
                orderBy: { generatedAt: 'desc' },
                take: 3
              })
            };
            break;
        }

        return {
          ...share,
          data: actualData
        };
      })
    );

    return NextResponse.json({
      groups: adminGroups,
      sharedData: enrichedData,
      permissions: adminGroups[0]?.permissions || []
    });

  } catch (error) {
    console.error('Admin Share API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await checkAdminAccess(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { action, groupId, targetUserId, dataType, permissions } = body;

    switch (action) {
      case 'create_group':
        const newGroup = await prisma.adminGroup.create({
          data: {
            name: body.name,
            description: body.description,
            ownerId: session.user.id,
            members: {
              connect: body.memberIds?.map((id: string) => ({ id })) || []
            }
          }
        });

        // Create default permissions
        await prisma.groupPermission.createMany({
          data: [
            { groupId: newGroup.id, resource: 'all', action: 'view' },
            { groupId: newGroup.id, resource: 'all', action: 'export' }
          ]
        });

        return NextResponse.json({ success: true, group: newGroup });

      case 'share_data':
        const shareData = await prisma.sharedData.create({
          data: {
            userId: targetUserId,
            groupId,
            dataType: dataType || 'all',
            permissions: permissions || ['view'],
            expiresAt: body.expiresAt ? new Date(body.expiresAt) : null
          }
        });

        // Log the action
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'share',
            resource: 'user_data',
            resourceId: targetUserId,
            details: { groupId, dataType, permissions }
          }
        });

        return NextResponse.json({ success: true, share: shareData });

      case 'revoke_share':
        await prisma.sharedData.delete({
          where: {
            userId_groupId_dataType: {
              userId: targetUserId,
              groupId,
              dataType: dataType || 'all'
            }
          }
        });

        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Admin Share POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}