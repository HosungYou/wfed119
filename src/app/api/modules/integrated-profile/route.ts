import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createModuleProgressService } from '@/lib/services/moduleProgressService';

/**
 * GET /api/modules/integrated-profile
 * Get user's integrated profile with all module data
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = await createModuleProgressService(user.id);
    if (!service) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });
    }

    const profile = await service.getIntegratedProfile();

    if (!profile) {
      // Return empty profile structure for new users
      return NextResponse.json({
        profile: {
          userId: user.id,
          topValues: [],
          topStrengths: [],
          lifeThemes: [],
          dreams: [],
          coreAspirations: [],
          swotSummary: {
            strengths: [],
            weaknesses: [],
            opportunities: [],
            threats: [],
          },
          priorityStrategies: [],
          lifeRoles: [],
          keyObjectives: [],
          errcActions: {
            eliminate: [],
            reduce: [],
            raise: [],
            create: [],
          },
          aiRecommendedActions: [],
          aiGrowthAreas: [],
          modulesCompleted: [],
          profileCompleteness: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('[API] GET /api/modules/integrated-profile error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/modules/integrated-profile/refresh
 * Trigger AI analysis refresh for the integrated profile
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = await createModuleProgressService(user.id);
    if (!service) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });
    }

    // Check which modules are completed to determine what analysis to run
    const journeyStatus = await service.getJourneyStatus();
    const completedModules = journeyStatus.modules
      .filter((m) => m.status === 'completed')
      .map((m) => m.moduleId);

    if (completedModules.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No modules completed yet',
      });
    }

    // Sync the integrated profile for the most recently completed module
    // This will aggregate data from all completed modules
    const lastCompleted = completedModules[completedModules.length - 1];
    await service.syncIntegratedProfile(lastCompleted);

    // Fetch updated profile
    const profile = await service.getIntegratedProfile();

    return NextResponse.json({
      success: true,
      profile,
      modulesAnalyzed: completedModules.length,
    });
  } catch (error) {
    console.error('[API] POST /api/modules/integrated-profile/refresh error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
