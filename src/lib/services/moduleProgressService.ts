/**
 * ModuleProgressService
 *
 * Manages user progress across LifeCraft modules and handles
 * cross-module data injection for the dependency chain:
 * Values → Strengths → Vision → SWOT → Dreams
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';
import {
  ModuleId,
  ModuleStatus,
  ModuleProgress,
  ModuleDataMap,
  CrossModuleContext,
  ValuesData,
  StrengthsData,
  VisionData,
  SwotData,
  DreamsData,
  MODULE_CONFIGS,
  canStartModule,
  getOptionalDataSources,
} from '@/lib/types/modules';

export class ModuleProgressService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Get all module progress for the user
   */
  async getAllProgress(): Promise<ModuleProgress[]> {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('module_progress')
      .select('*')
      .eq('user_id', this.userId);

    if (error) {
      console.error('[ModuleProgressService] Error fetching progress:', error);
      return [];
    }

    return (data || []).map(row => ({
      moduleId: row.module_id as ModuleId,
      status: row.status as ModuleStatus,
      completedAt: row.completed_at,
      lastUpdatedAt: row.updated_at,
      currentStage: row.current_stage,
      completionPercentage: row.completion_percentage || 0,
    }));
  }

  /**
   * Get progress for a specific module
   */
  async getModuleProgress(moduleId: ModuleId): Promise<ModuleProgress | null> {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('module_progress')
      .select('*')
      .eq('user_id', this.userId)
      .eq('module_id', moduleId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      moduleId: data.module_id as ModuleId,
      status: data.status as ModuleStatus,
      completedAt: data.completed_at,
      lastUpdatedAt: data.updated_at,
      currentStage: data.current_stage,
      completionPercentage: data.completion_percentage || 0,
    };
  }

  /**
   * Update module progress
   */
  async updateProgress(
    moduleId: ModuleId,
    updates: Partial<{
      status: ModuleStatus;
      currentStage: string;
      completionPercentage: number;
    }>
  ): Promise<boolean> {
    const supabase = await createServerSupabaseClient();

    const updateData: Record<string, unknown> = {
      user_id: this.userId,
      module_id: moduleId,
      updated_at: new Date().toISOString(),
    };

    if (updates.status) {
      updateData.status = updates.status;
      if (updates.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.completion_percentage = 100;
      }
    }

    if (updates.currentStage) {
      updateData.current_stage = updates.currentStage;
    }

    if (updates.completionPercentage !== undefined) {
      updateData.completion_percentage = updates.completionPercentage;
    }

    const { error } = await supabase
      .from('module_progress')
      .upsert(updateData, {
        onConflict: 'user_id,module_id',
      });

    if (error) {
      console.error('[ModuleProgressService] Error updating progress:', error);
      return false;
    }

    return true;
  }

  /**
   * Check if user can start a module (prerequisites met)
   */
  async canStartModule(moduleId: ModuleId): Promise<{
    canStart: boolean;
    missingPrerequisites: ModuleId[];
    completedModules: ModuleId[];
  }> {
    const allProgress = await this.getAllProgress();
    const completedModules = new Set(
      allProgress
        .filter(p => p.status === 'completed')
        .map(p => p.moduleId)
    );

    const result = canStartModule(moduleId, completedModules);

    return {
      ...result,
      completedModules: Array.from(completedModules),
    };
  }

  /**
   * Get cross-module context with injected data from completed modules
   */
  async getCrossModuleContext(currentModule: ModuleId): Promise<CrossModuleContext> {
    const allProgress = await this.getAllProgress();
    const completedModules = allProgress
      .filter(p => p.status === 'completed')
      .map(p => p.moduleId);

    const availableData: Partial<ModuleDataMap> = {};

    // Fetch data from completed modules that are dependencies
    const config = MODULE_CONFIGS[currentModule];
    const relevantModules = [
      ...config.dependencies.map(d => d.moduleId),
      ...getOptionalDataSources(currentModule),
    ];

    for (const depModule of relevantModules) {
      if (completedModules.includes(depModule)) {
        const data = await this.getModuleData(depModule);
        if (data) {
          (availableData as Record<ModuleId, unknown>)[depModule] = data;
        }
      }
    }

    return {
      userId: this.userId,
      availableData,
      completedModules,
      currentModule,
    };
  }

  /**
   * Fetch stored data for a specific module
   */
  private async getModuleData(moduleId: ModuleId): Promise<unknown> {
    switch (moduleId) {
      case 'values':
        return this.getValuesData();
      case 'strengths':
        return this.getStrengthsData();
      case 'vision':
        return this.getVisionData();
      case 'swot':
        return this.getSwotData();
      case 'dreams':
        return this.getDreamsData();
      default:
        return null;
    }
  }

  /**
   * Get Values module data
   */
  private async getValuesData(): Promise<ValuesData | null> {
    const supabase = await createServerSupabaseClient();

    const { data: results } = await supabase
      .from('value_results')
      .select('*')
      .eq('user_id', this.userId);

    if (!results || results.length === 0) return null;

    const valuesData: ValuesData = {
      terminalTop3: [],
      instrumentalTop3: [],
      workTop3: [],
      valueThemes: [],
      completedSets: [],
    };

    for (const result of results) {
      const top3 = Array.isArray(result.top3) ? result.top3 : [];
      const set = result.value_set as 'terminal' | 'instrumental' | 'work';

      switch (set) {
        case 'terminal':
          valuesData.terminalTop3 = top3;
          valuesData.completedSets.push('terminal');
          break;
        case 'instrumental':
          valuesData.instrumentalTop3 = top3;
          valuesData.completedSets.push('instrumental');
          break;
        case 'work':
          valuesData.workTop3 = top3;
          valuesData.completedSets.push('work');
          break;
      }
    }

    // Derive value themes from top values
    valuesData.valueThemes = [
      ...valuesData.terminalTop3.slice(0, 2),
      ...valuesData.instrumentalTop3.slice(0, 2),
      ...valuesData.workTop3.slice(0, 2),
    ];

    return valuesData;
  }

  /**
   * Get Strengths module data
   */
  private async getStrengthsData(): Promise<StrengthsData | null> {
    const supabase = await createServerSupabaseClient();

    const { data } = await supabase
      .from('strength_profiles')
      .select('*')
      .eq('user_id', this.userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) return null;

    return {
      topStrengths: Array.isArray(data.strengths) ? data.strengths : [],
      strengthsSummary: data.summary || '',
      conversationInsights: data.insights?.insights || [],
    };
  }

  /**
   * Get Vision module data
   */
  private async getVisionData(): Promise<VisionData | null> {
    const supabase = await createServerSupabaseClient();

    const { data } = await supabase
      .from('vision_statements')
      .select('*')
      .eq('user_id', this.userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) return null;

    return {
      timeHorizon: data.time_horizon || '5-year',
      coreAspiration: data.core_aspiration || '',
      visionStatement: data.vision_statement || '',
      roleVisions: data.role_visions || {},
    };
  }

  /**
   * Get SWOT module data
   */
  private async getSwotData(): Promise<SwotData | null> {
    const supabase = await createServerSupabaseClient();

    const { data: swotAnalysis } = await supabase
      .from('swot_analyses')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    if (!swotAnalysis) return null;

    // Get goals
    const { data: goals } = await supabase
      .from('swot_goals')
      .select('*')
      .eq('user_id', this.userId)
      .order('goal_number', { ascending: true });

    // Get ERRC
    const { data: errc } = await supabase
      .from('swot_errc')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    return {
      strengths: swotAnalysis.strengths || [],
      weaknesses: swotAnalysis.weaknesses || [],
      opportunities: swotAnalysis.opportunities || [],
      threats: swotAnalysis.threats || [],
      strategies: {
        so: swotAnalysis.so_strategies || [],
        wo: swotAnalysis.wo_strategies || [],
        st: swotAnalysis.st_strategies || [],
        wt: swotAnalysis.wt_strategies || [],
      },
      goals: (goals || []).map(g => ({
        number: g.goal_number,
        roleResponsibility: g.role_responsibility,
        actionPlan: g.action_plan,
        criteria: g.criteria,
        deadline: g.deadline,
      })),
      errc: errc ? {
        eliminate: errc.eliminate || [],
        reduce: errc.reduce || [],
        reinforce: errc.reinforce || [],
        create: errc.create_new || [],
      } : undefined,
    };
  }

  /**
   * Get Dreams module data
   */
  private async getDreamsData(): Promise<DreamsData | null> {
    const supabase = await createServerSupabaseClient();

    const { data } = await supabase
      .from('dreams')
      .select('*')
      .eq('user_id', this.userId);

    if (!data || data.length === 0) return null;

    const dreams = data.map(d => ({
      id: d.id,
      title: d.title,
      lifeStage: d.life_stage || '',
      wellbeingArea: d.wellbeing_area || '',
    }));

    // Categorize dreams by wellbeing area
    const categorizedDreams: Record<string, string[]> = {};
    for (const dream of dreams) {
      if (!categorizedDreams[dream.wellbeingArea]) {
        categorizedDreams[dream.wellbeingArea] = [];
      }
      categorizedDreams[dream.wellbeingArea].push(dream.title);
    }

    return { dreams, categorizedDreams };
  }

  /**
   * Generate AI prompt context from available module data
   */
  async generatePromptContext(currentModule: ModuleId): Promise<string> {
    const context = await this.getCrossModuleContext(currentModule);
    const parts: string[] = [];

    if (context.availableData.values) {
      const v = context.availableData.values;
      parts.push(`User's Core Values:
- Terminal Values: ${v.terminalTop3.join(', ')}
- Instrumental Values: ${v.instrumentalTop3.join(', ')}
- Work Values: ${v.workTop3.join(', ')}`);
    }

    if (context.availableData.strengths) {
      const s = context.availableData.strengths;
      parts.push(`User's Key Strengths:
${s.topStrengths.map(str => `- ${str.name}: ${str.description}`).join('\n')}`);
    }

    if (context.availableData.vision) {
      const v = context.availableData.vision;
      parts.push(`User's Vision Statement (${v.timeHorizon}):
${v.visionStatement}`);
    }

    if (context.availableData.swot) {
      const s = context.availableData.swot;
      parts.push(`User's SWOT Summary:
- Strengths: ${s.strengths.slice(0, 3).join(', ')}
- Key Goals: ${s.goals.slice(0, 3).map(g => g.roleResponsibility).join(', ')}`);
    }

    return parts.length > 0
      ? `--- User Profile Context ---\n${parts.join('\n\n')}\n--- End Context ---`
      : '';
  }
}

// Factory function for creating service instance
export async function createModuleProgressService(
  userId?: string
): Promise<ModuleProgressService | null> {
  if (userId) {
    return new ModuleProgressService(userId);
  }

  // Try to get userId from current session
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    return null;
  }

  return new ModuleProgressService(user.id);
}
