import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createModuleProgressService } from '@/lib/services/moduleProgressService';
import { ModuleId, MODULE_CONFIGS } from '@/lib/types/modules';

/**
 * GET /api/modules/context
 * Get cross-module context for AI prompt injection
 *
 * Query params:
 * - moduleId: The current module requesting context
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

    if (!moduleId || !MODULE_CONFIGS[moduleId]) {
      return NextResponse.json({ error: 'Invalid moduleId' }, { status: 400 });
    }

    const service = await createModuleProgressService(user.id);
    if (!service) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });
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

    // Return raw context data
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
