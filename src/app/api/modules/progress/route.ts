import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createModuleProgressService } from '@/lib/services/moduleProgressService';
import { ModuleId, ModuleStatus, MODULE_CONFIGS, canStartModule } from '@/lib/types/modules';

/**
 * GET /api/modules/progress
 * Get user's module progress (all or specific module)
 *
 * Optimized: Calculate canStart in memory instead of DB queries per module
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const moduleId = searchParams.get('moduleId') as ModuleId | null;

    const service = await createModuleProgressService(user.id);
    if (!service) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });
    }

    // Get all progress first (single DB call)
    const allProgress = await service.getAllProgress();

    // Pre-compute completed modules set (no additional DB calls)
    const completedModulesSet = new Set(
      allProgress.filter(p => p.status === 'completed').map(p => p.moduleId)
    );

    if (moduleId) {
      // Get specific module progress
      const progress = allProgress.find(p => p.moduleId === moduleId) || null;
      const canStart = canStartModule(moduleId, completedModulesSet);
      const config = MODULE_CONFIGS[moduleId];

      return NextResponse.json({
        moduleId,
        progress,
        canStart: canStart.canStart,
        missingPrerequisites: canStart.missingPrerequisites,
        config: {
          name: config.name,
          description: config.description,
          route: config.route,
          stages: config.stages,
        },
      });
    }

    // Build progress map with module configs (no additional DB calls)
    const progressMap: Record<string, unknown> = {};
    for (const modId of Object.keys(MODULE_CONFIGS) as ModuleId[]) {
      const progress = allProgress.find(p => p.moduleId === modId);
      const canStart = canStartModule(modId, completedModulesSet);
      const config = MODULE_CONFIGS[modId];

      progressMap[modId] = {
        progress: progress || {
          moduleId: modId,
          status: 'not_started',
          completionPercentage: 0,
          lastUpdatedAt: null,
        },
        canStart: canStart.canStart,
        missingPrerequisites: canStart.missingPrerequisites,
        config: {
          name: config.name,
          description: config.description,
          route: config.route,
          stages: config.stages,
        },
      };
    }

    return NextResponse.json({
      userId: user.id,
      modules: progressMap,
      completedModules: Array.from(completedModulesSet),
    });
  } catch (error) {
    console.error('[API] GET /api/modules/progress error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/modules/progress
 * Update module progress
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { moduleId, status, currentStage, completionPercentage } = body;

    if (!moduleId || !MODULE_CONFIGS[moduleId as ModuleId]) {
      return NextResponse.json({ error: 'Invalid moduleId' }, { status: 400 });
    }

    const service = await createModuleProgressService(user.id);
    if (!service) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });
    }

    // Check if user can start this module (if status is changing to in_progress)
    if (status === 'in_progress') {
      const canStart = await service.canStartModule(moduleId as ModuleId);
      if (!canStart.canStart) {
        return NextResponse.json({
          error: 'Prerequisites not met',
          missingPrerequisites: canStart.missingPrerequisites,
        }, { status: 403 });
      }
    }

    const success = await service.updateProgress(moduleId as ModuleId, {
      status: status as ModuleStatus,
      currentStage,
      completionPercentage,
    });

    if (!success) {
      return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
    }

    const updatedProgress = await service.getModuleProgress(moduleId as ModuleId);

    return NextResponse.json({
      success: true,
      progress: updatedProgress,
    });
  } catch (error) {
    console.error('[API] POST /api/modules/progress error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
