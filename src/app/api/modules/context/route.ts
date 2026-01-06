import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createModuleProgressService } from '@/lib/services/moduleProgressService';
import { ModuleId, MODULE_CONFIGS, MODULE_ORDER } from '@/lib/types/modules';

/**
 * GET /api/modules/context
 * Get cross-module context for AI prompt injection
 *
 * Query params:
 * - moduleId: The current module requesting context (optional - if not provided, returns all available data)
 * - format: 'json' | 'prompt' (default: 'json')
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
    const format = searchParams.get('format') || 'json';

    const service = await createModuleProgressService(user.id);
    if (!service) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });
    }

    // If no moduleId, return all available data from completed modules
    if (!moduleId) {
      const allProgress = await service.getAllProgress();
      const completedModules = allProgress
        .filter(p => p.status === 'completed')
        .map(p => p.moduleId);

      // Fetch data from all completed modules
      const availableData: Record<string, unknown> = {};
      for (const modId of completedModules) {
        const data = await getModuleData(service, modId);
        if (data) {
          availableData[modId] = data;
        }
      }

      return NextResponse.json({
        userId: user.id,
        completedModules,
        availableData,
      });
    }

    // Validate moduleId if provided
    if (!MODULE_CONFIGS[moduleId]) {
      return NextResponse.json({ error: 'Invalid moduleId' }, { status: 400 });
    }

    if (format === 'prompt') {
      // Return formatted prompt context for AI
      const promptContext = await service.generatePromptContext(moduleId);
      return NextResponse.json({
        moduleId,
        promptContext,
        hasContext: promptContext.length > 0,
      });
    }

    // Return raw context data for specific module
    const context = await service.getCrossModuleContext(moduleId);

    return NextResponse.json({
      moduleId,
      userId: user.id,
      completedModules: context.completedModules,
      availableData: context.availableData,
      dependencies: MODULE_CONFIGS[moduleId].dependencies,
    });
  } catch (error) {
    console.error('[API] GET /api/modules/context error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Helper to fetch module-specific data
 */
async function getModuleData(service: Awaited<ReturnType<typeof createModuleProgressService>>, moduleId: ModuleId) {
  if (!service) return null;

  switch (moduleId) {
    case 'values':
      return service.getValuesData();
    case 'strengths':
      return service.getStrengthsData();
    case 'enneagram':
      return service.getEnneagramData();
    case 'life-themes':
      return service.getLifeThemesData();
    case 'vision':
      return service.getVisionData();
    case 'swot':
      return service.getSwotData();
    case 'goals':
      return service.getGoalsData();
    case 'errc':
      return service.getErrcData();
    default:
      return null;
  }
}
