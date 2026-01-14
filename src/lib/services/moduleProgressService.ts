/**
 * ModuleProgressService
 *
 * MAJOR REBASE (2026-01-06):
 * - Linear (순차적 강제) progression enforcement
 * - 8 modules must be completed in sequence
 * - Dreams integrated into Vision module as Step 4
 * - Full cross-module data integration with AI insights
 *
 * Module Order:
 * 1. Values → 2. Strengths → 3. Enneagram → 4. Life Themes
 * 5. Vision (with Dreams) → 6. SWOT → 7. Goals → 8. ERRC
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
  EnneagramData,
  LifeThemesData,
  VisionData,
  MissionData,
  CareerOptionsData,
  SwotData,
  GoalSettingData,
  ErrcData,
  IntegratedProfile,
  MODULE_CONFIGS,
  MODULE_ORDER,
  MODULE_PARTS,
  canStartModuleLinear,
  getNextModule,
  getOverallProgress,
  getCurrentPart,
  getLinearPrerequisites,
} from '@/lib/types/modules';

export class ModuleProgressService {
  private userId: string;
  private isAdminRole: boolean | null = null; // Cached admin check

  constructor(userId: string) {
    this.userId = userId;
  }

  // ============================================================================
  // Admin Role Check
  // ============================================================================

  /**
   * Check if the user has ADMIN or SUPER_ADMIN role
   * Admins can access all modules without lock restrictions
   */
  async checkIsAdmin(): Promise<boolean> {
    // Return cached result if available
    if (this.isAdminRole !== null) {
      return this.isAdminRole;
    }

    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', this.userId)
      .single();

    if (error || !data) {
      console.warn('[ModuleProgressService] Could not fetch user role:', error);
      this.isAdminRole = false;
      return false;
    }

    this.isAdminRole = data.role === 'ADMIN' || data.role === 'SUPER_ADMIN';
    return this.isAdminRole;
  }

  // ============================================================================
  // Progress Management
  // ============================================================================

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

    const existingProgress = (data || []).map(row => ({
      moduleId: row.module_id as ModuleId,
      status: row.status as ModuleStatus,
      completedAt: row.completed_at,
      lastUpdatedAt: row.updated_at,
      currentStage: row.current_stage,
      completionPercentage: row.completion_percentage || 0,
    }));

    // Fill gaps from legacy data so cross-module context works before backfill
    const progressMap = new Map<ModuleId, ModuleProgress>();
    existingProgress.forEach(p => progressMap.set(p.moduleId, p));

    const derivedProgress = await this.deriveProgressFromExistingData(supabase);
    for (const derived of derivedProgress) {
      if (!progressMap.has(derived.moduleId)) {
        progressMap.set(derived.moduleId, derived);
      }
    }

    return Array.from(progressMap.values());
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

        // Sync integrated profile when module completes
        await this.syncIntegratedProfile(moduleId);
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

  // ============================================================================
  // Linear Progression Enforcement
  // ============================================================================

  /**
   * Check if user can start a module (LINEAR progression enforcement)
   * ALL previous modules must be completed
   * ADMIN/SUPER_ADMIN users bypass lock restrictions
   */
  async canStartModule(moduleId: ModuleId): Promise<{
    canStart: boolean;
    missingPrerequisites: ModuleId[];
    completedModules: ModuleId[];
    nextModule: ModuleId | null;
    overallProgress: number;
    isAdmin?: boolean;
  }> {
    const allProgress = await this.getAllProgress();
    const completedModules = new Set(
      allProgress
        .filter(p => p.status === 'completed')
        .map(p => p.moduleId)
    );

    const nextMod = getNextModule(completedModules);
    const progress = getOverallProgress(completedModules);

    // Admin bypass: allow access to all modules
    const isAdmin = await this.checkIsAdmin();
    if (isAdmin) {
      return {
        canStart: true,
        missingPrerequisites: [],
        completedModules: Array.from(completedModules),
        nextModule: nextMod,
        overallProgress: progress,
        isAdmin: true,
      };
    }

    const result = canStartModuleLinear(moduleId, completedModules);

    return {
      ...result,
      completedModules: Array.from(completedModules),
      nextModule: nextMod,
      overallProgress: progress,
    };
  }

  /**
   * Get the next module user should complete
   */
  async getNextModuleToComplete(): Promise<{
    nextModule: ModuleId | null;
    overallProgress: number;
    currentPart: string | null;
    completedModules: ModuleId[];
  }> {
    const allProgress = await this.getAllProgress();
    const completedModules = new Set(
      allProgress
        .filter(p => p.status === 'completed')
        .map(p => p.moduleId)
    );

    const nextMod = getNextModule(completedModules);
    const progress = getOverallProgress(completedModules);
    const part = getCurrentPart(completedModules);

    return {
      nextModule: nextMod,
      overallProgress: progress,
      currentPart: part,
      completedModules: Array.from(completedModules),
    };
  }

  /**
   * Get journey status with all module states
   * ADMIN/SUPER_ADMIN users see all modules as unlocked
   */
  async getJourneyStatus(): Promise<{
    modules: Array<{
      moduleId: ModuleId;
      name: string;
      nameKo: string;
      status: ModuleStatus;
      isLocked: boolean;
      isNext: boolean;
      order: number;
      part: string;
      completionPercentage: number;
    }>;
    overallProgress: number;
    currentPart: string | null;
    nextModule: ModuleId | null;
    isAdmin?: boolean;
  }> {
    const allProgress = await this.getAllProgress();
    const progressMap = new Map(allProgress.map(p => [p.moduleId, p]));

    const completedModules = new Set(
      allProgress
        .filter(p => p.status === 'completed')
        .map(p => p.moduleId)
    );

    const nextMod = getNextModule(completedModules);
    const progress = getOverallProgress(completedModules);
    const part = getCurrentPart(completedModules);

    // Check admin status for bypass
    const isAdmin = await this.checkIsAdmin();

    const modules = MODULE_ORDER.map((moduleId, index) => {
      const config = MODULE_CONFIGS[moduleId];
      const moduleProgress = progressMap.get(moduleId);
      const { canStart } = canStartModuleLinear(moduleId, completedModules);

      return {
        moduleId,
        name: config.name,
        nameKo: config.nameKo,
        status: moduleProgress?.status || 'not_started',
        // Admin bypass: all modules unlocked for admin users
        isLocked: isAdmin ? false : (!canStart && moduleProgress?.status !== 'completed'),
        isNext: moduleId === nextMod,
        order: index + 1,
        part: MODULE_PARTS[moduleId],
        completionPercentage: moduleProgress?.completionPercentage || 0,
      };
    });

    return {
      modules,
      overallProgress: progress,
      currentPart: part,
      nextModule: nextMod,
      isAdmin,
    };
  }

  // ============================================================================
  // Cross-Module Data Access
  // ============================================================================

  /**
   * Get cross-module context with injected data from completed modules
   */
  async getCrossModuleContext(currentModule: ModuleId): Promise<CrossModuleContext> {
    const allProgress = await this.getAllProgress();
    const completedModules = allProgress
      .filter(p => p.status === 'completed')
      .map(p => p.moduleId);

    const completedSet = new Set(completedModules);
    const availableData: Partial<ModuleDataMap> = {};

    // Fetch data from ALL completed modules for full context
    for (const moduleId of completedModules) {
      const data = await this.getModuleData(moduleId);
      if (data) {
        (availableData as Record<ModuleId, unknown>)[moduleId] = data;
      }
    }

    const nextMod = getNextModule(completedSet);
    const progress = getOverallProgress(completedSet);
    const part = getCurrentPart(completedSet);

    return {
      userId: this.userId,
      availableData,
      completedModules,
      currentModule,
      nextModule: nextMod,
      overallProgress: progress,
      currentPart: part,
    };
  }

  /**
   * Get data for prerequisite modules (for auto-population)
   */
  async getPrerequisiteData(moduleId: ModuleId): Promise<Partial<ModuleDataMap>> {
    const prerequisites = getLinearPrerequisites(moduleId);
    const data: Partial<ModuleDataMap> = {};

    for (const prereq of prerequisites) {
      const moduleData = await this.getModuleData(prereq);
      if (moduleData) {
        (data as Record<ModuleId, unknown>)[prereq] = moduleData;
      }
    }

    return data;
  }

  // ============================================================================
  // Auto-Population Helpers
  // ============================================================================

  /**
   * Get suggested SWOT strengths from Strengths module data
   */
  async getSuggestedSwotStrengths(): Promise<string[]> {
    const strengthsData = await this.getStrengthsData();
    if (!strengthsData) return [];

    return strengthsData.topStrengths
      .slice(0, 5)
      .map(s => s.name);
  }

  /**
   * Get SWOT strategies for Goals module reference
   */
  async getSwotStrategiesForGoals(): Promise<{
    priorityStrategies: Array<{ strategy: string; type: string }>;
    allStrategies: { so: string[]; wo: string[]; st: string[]; wt: string[] };
  }> {
    const swotData = await this.getSwotData();
    if (!swotData) {
      return {
        priorityStrategies: [],
        allStrategies: { so: [], wo: [], st: [], wt: [] },
      };
    }

    return {
      priorityStrategies: (swotData.priorityStrategies || []).map(s => ({
        strategy: s.strategy,
        type: s.type,
      })),
      allStrategies: swotData.strategies,
    };
  }

  /**
   * Get all Part 1 data for Vision module
   */
  async getPart1DataForVision(): Promise<{
    values: ValuesData | null;
    strengths: StrengthsData | null;
    enneagram: EnneagramData | null;
    lifeThemes: LifeThemesData | null;
  }> {
    const [values, strengths, enneagram, lifeThemes] = await Promise.all([
      this.getValuesData(),
      this.getStrengthsData(),
      this.getEnneagramData(),
      this.getLifeThemesData(),
    ]);

    return { values, strengths, enneagram, lifeThemes };
  }

  // ============================================================================
  // Module Data Fetchers
  // ============================================================================

  /**
   * Fetch stored data for a specific module
   */
  private async getModuleData(moduleId: ModuleId): Promise<unknown> {
    switch (moduleId) {
      case 'values':
        return this.getValuesData();
      case 'strengths':
        return this.getStrengthsData();
      case 'enneagram':
        return this.getEnneagramData();
      case 'life-themes':
        return this.getLifeThemesData();
      case 'vision':
        return this.getVisionData();
      case 'mission':
        return this.getMissionData();
      case 'career-options':
        return this.getCareerOptionsData();
      case 'swot':
        return this.getSwotData();
      case 'goals':
        return this.getGoalsData();
      case 'errc':
        return this.getErrcData();
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
      .from('strength_discovery_results')
      .select('final_strengths, summary, insights, is_completed, updated_at')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) return null;

    let parsedStrengths: Array<{ name: string; description: string; category?: string; evidence?: string }> = [];

    if (Array.isArray(data.final_strengths)) {
      parsedStrengths = data.final_strengths;
    } else if (typeof data.final_strengths === 'string') {
      try {
        const parsed = JSON.parse(data.final_strengths);
        if (Array.isArray(parsed)) {
          parsedStrengths = parsed;
        }
      } catch (err) {
        console.warn('[ModuleProgressService] Failed to parse final_strengths:', err);
      }
    }

    return {
      topStrengths: parsedStrengths,
      strengthsSummary: data.summary || '',
      conversationInsights: data.insights?.insights || [],
    };
  }

  /**
   * Get Enneagram module data
   * Reads from enneagram_sessions table where stage='complete'
   */
  private async getEnneagramData(): Promise<EnneagramData | null> {
    const supabase = await createServerSupabaseClient();

    const { data } = await supabase
      .from('enneagram_sessions')
      .select('*')
      .eq('user_id', this.userId)
      .eq('stage', 'complete')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) return null;

    // Generate description based on type
    const typeDescriptions: Record<string, string> = {
      '1': 'The Reformer - Principled, purposeful, self-controlled, and perfectionistic',
      '2': 'The Helper - Generous, demonstrative, people-pleasing, and possessive',
      '3': 'The Achiever - Adaptable, excelling, driven, and image-conscious',
      '4': 'The Individualist - Expressive, dramatic, self-absorbed, and temperamental',
      '5': 'The Investigator - Perceptive, innovative, secretive, and isolated',
      '6': 'The Loyalist - Engaging, responsible, anxious, and suspicious',
      '7': 'The Enthusiast - Spontaneous, versatile, acquisitive, and scattered',
      '8': 'The Challenger - Self-confident, decisive, willful, and confrontational',
      '9': 'The Peacemaker - Receptive, reassuring, complacent, and resigned',
    };

    return {
      type: data.primary_type,
      wing: data.wing_estimate,
      instinct: data.instinct || 'sp',
      confidence: data.confidence || 'medium',
      description: typeDescriptions[data.primary_type] || '',
    };
  }

  /**
   * Get Life Themes module data
   */
  private async getLifeThemesData(): Promise<LifeThemesData | null> {
    const supabase = await createServerSupabaseClient();

    const { data } = await supabase
      .from('life_themes_results')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) return null;

    return {
      themes: data.themes || [],
      roleModels: data.role_models || [],
      favoriteMedia: data.favorite_media || [],
      hobbies: data.hobbies || [],
      mottos: data.mottos || [],
      favoriteSubjects: data.favorite_subjects || [],
      earlyMemories: data.early_memories || [],
    };
  }

  /**
   * Get Vision module data (includes Dreams as Step 4)
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

    // Parse dreams from JSONB
    let dreams: VisionData['dreams'] = [];
    if (data.dreams && Array.isArray(data.dreams)) {
      dreams = data.dreams;
    }

    // Parse dreams by life stage
    let dreamsByLifeStage: VisionData['dreamsByLifeStage'] = {
      immediate: [],
      '1-3years': [],
      '5years': [],
      '10years+': [],
    };
    if (data.dreams_by_life_stage) {
      dreamsByLifeStage = {
        ...dreamsByLifeStage,
        ...data.dreams_by_life_stage,
      };
    }

    // Parse dreams by wellbeing
    let dreamsByWellbeing: VisionData['dreamsByWellbeing'] = {
      physical: [],
      emotional: [],
      intellectual: [],
      social: [],
      spiritual: [],
      occupational: [],
      economic: [],
    };
    if (data.dreams_by_wellbeing) {
      dreamsByWellbeing = {
        ...dreamsByWellbeing,
        ...data.dreams_by_wellbeing,
      };
    }

    // Parse core aspirations
    let coreAspirations: string[] = [];
    if (data.core_aspirations) {
      if (Array.isArray(data.core_aspirations)) {
        coreAspirations = data.core_aspirations;
      } else if (typeof data.core_aspirations === 'string') {
        coreAspirations = [data.core_aspirations];
      }
    } else if (data.core_aspiration) {
      coreAspirations = [data.core_aspiration];
    }

    return {
      timeHorizon: data.time_horizon || '5-year',
      futureImagery: data.future_imagery || '',
      coreAspirations,
      visionStatement: data.vision_statement || data.final_statement || '',
      roleVisions: data.role_visions || {},
      dreams,
      dreamsByLifeStage,
      dreamsByWellbeing,
      dreamsAnalysis: data.dreams_analysis,
      dreamsCompleted: data.dreams_completed || false,
    };
  }

  /**
   * Get Mission module data
   */
  async getMissionData(): Promise<MissionData | null> {
    const supabase = await createServerSupabaseClient();

    const { data } = await supabase
      .from('mission_statements')
      .select('*')
      .eq('user_id', this.userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) return null;

    // Parse values used
    let valuesUsed: MissionData['valuesUsed'] = [];
    if (data.values_used && Array.isArray(data.values_used)) {
      valuesUsed = data.values_used;
    }

    // Parse purpose answers
    const purposeAnswers: MissionData['purposeAnswers'] = {
      whatDoYouDo: data.purpose_what || '',
      forWhom: data.purpose_for_whom || '',
      howDoYouDoIt: data.purpose_how || '',
      whatImpact: data.purpose_impact || '',
      whyDoesItMatter: data.purpose_why || '',
    };

    // Parse draft versions
    let draftVersions: MissionData['draftVersions'] = [];
    if (data.draft_versions && Array.isArray(data.draft_versions)) {
      draftVersions = data.draft_versions;
    } else if (data.draft_text) {
      draftVersions = [{
        version: 1,
        text: data.draft_text,
        createdAt: data.created_at,
        aiGenerated: data.ai_generated || false,
      }];
    }

    return {
      valuesUsed,
      purposeAnswers,
      draftVersions,
      finalStatement: data.final_statement || data.mission_statement || '',
      completedAt: data.completed_at,
    };
  }

  /**
   * Get Career Options module data
   */
  async getCareerOptionsData(): Promise<CareerOptionsData | null> {
    const supabase = await createServerSupabaseClient();

    const { data } = await supabase
      .from('career_explorations')
      .select('*')
      .eq('user_id', this.userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) return null;

    // Parse Holland code
    const hollandCode: CareerOptionsData['hollandCode'] = {
      primary: data.holland_primary || 'S',
      secondary: data.holland_secondary,
      tertiary: data.holland_tertiary,
      scores: data.holland_scores || {
        realistic: 0,
        investigative: 0,
        artistic: 0,
        social: 0,
        enterprising: 0,
        conventional: 0,
      },
    };

    // Parse suggested careers
    let suggestedCareers: CareerOptionsData['suggestedCareers'] = [];
    if (data.suggested_careers && Array.isArray(data.suggested_careers)) {
      suggestedCareers = data.suggested_careers;
    }

    // Parse explored careers
    let exploredCareers: CareerOptionsData['exploredCareers'] = [];
    if (data.explored_careers && Array.isArray(data.explored_careers)) {
      exploredCareers = data.explored_careers;
    }

    // Parse comparison matrix
    const comparisonMatrix: CareerOptionsData['comparisonMatrix'] = data.comparison_matrix || {
      careers: [],
      criteria: [],
      rankings: [],
    };

    // Parse top career choices
    let topCareerChoices: CareerOptionsData['topCareerChoices'] = [];
    if (data.top_career_choices && Array.isArray(data.top_career_choices)) {
      topCareerChoices = data.top_career_choices;
    }

    return {
      hollandCode,
      suggestedCareers,
      exploredCareers,
      comparisonMatrix,
      topCareerChoices,
      notes: data.notes,
      completedAt: data.completed_at,
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

    // Get priority strategies
    const { data: priorityStrategies } = await supabase
      .from('swot_priority_strategies')
      .select('*')
      .eq('user_id', this.userId)
      .order('priority_score', { ascending: false });

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
      priorityStrategies: (priorityStrategies || []).map(s => ({
        strategy: s.strategy,
        type: s.strategy_type as 'SO' | 'WO' | 'ST' | 'WT',
        impact: s.impact || 0,
        feasibility: s.feasibility || 0,
        priorityScore: s.priority_score || 0,
      })),
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
        raise: errc.reinforce || errc.raise || [],
        create: errc.create_new || errc.create || [],
      } : undefined,
    };
  }

  /**
   * Get Goals module data
   */
  private async getGoalsData(): Promise<GoalSettingData | null> {
    const supabase = await createServerSupabaseClient();

    // Get roles
    const { data: roles } = await supabase
      .from('goal_roles')
      .select('*')
      .eq('user_id', this.userId)
      .order('role_number', { ascending: true });

    if (!roles || roles.length === 0) return null;

    // Get objectives
    const { data: objectives } = await supabase
      .from('goal_objectives')
      .select('*')
      .eq('user_id', this.userId);

    // Get key results
    const { data: keyResults } = await supabase
      .from('goal_key_results')
      .select('*')
      .eq('user_id', this.userId)
      .order('key_result_number', { ascending: true });

    // Get action plans
    const { data: actionPlans } = await supabase
      .from('goal_action_plans')
      .select('*')
      .eq('user_id', this.userId)
      .order('action_number', { ascending: true });

    // Get reflections
    const { data: reflections } = await supabase
      .from('goal_reflections')
      .select('*')
      .eq('user_id', this.userId);

    const totalPercentage = roles.reduce((sum, r) => sum + (r.percentage_allocation || 0), 0);

    return {
      roles: roles.map(r => ({
        id: r.id,
        roleNumber: r.role_number,
        roleName: r.role_name,
        roleDescription: r.role_description || '',
        percentageAllocation: r.percentage_allocation || 0,
        isWellbeing: r.is_wellbeing || false,
      })),
      objectives: (objectives || []).map(o => ({
        id: o.id,
        roleId: o.role_id,
        objectiveText: o.objective_text,
        relatedSwotStrategies: o.related_swot_strategies || [],
      })),
      keyResults: (keyResults || []).map(kr => ({
        id: kr.id,
        objectiveId: kr.objective_id,
        keyResultNumber: kr.key_result_number,
        keyResultText: kr.key_result_text,
        successCriteria: kr.success_criteria || '',
        deadline: kr.deadline,
        status: kr.status || 'not_started',
        progressPercentage: kr.progress_percentage || 0,
      })),
      actionPlans: (actionPlans || []).map(ap => ({
        id: ap.id,
        keyResultId: ap.key_result_id,
        actionNumber: ap.action_number,
        actionText: ap.action_text,
        dueDate: ap.due_date,
        isCompleted: ap.is_completed || false,
      })),
      reflections: (reflections || []).map(r => ({
        reflectionType: r.reflection_type,
        reflectionText: r.reflection_text,
      })),
      totalPercentage,
    };
  }

  /**
   * Get ERRC module data
   */
  private async getErrcData(): Promise<ErrcData | null> {
    const supabase = await createServerSupabaseClient();

    // Get wellbeing assessments
    const { data: wellbeingData } = await supabase
      .from('errc_wellbeing')
      .select('*')
      .eq('user_id', this.userId)
      .order('assessment_type', { ascending: true });

    // Get canvas
    const { data: canvas } = await supabase
      .from('errc_canvas')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    // Get actions
    const { data: actions } = await supabase
      .from('errc_actions')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: true });

    // Get journal
    const { data: journal } = await supabase
      .from('errc_journal')
      .select('*')
      .eq('user_id', this.userId)
      .order('date', { ascending: false });

    if (!canvas && (!wellbeingData || wellbeingData.length === 0)) return null;

    const wellbeingBefore = wellbeingData?.find(w => w.assessment_type === 'before');
    const wellbeingAfter = wellbeingData?.find(w => w.assessment_type === 'after');

    const parseWellbeing = (data: unknown) => ({
      physical: (data as Record<string, number>)?.physical || 0,
      emotional: (data as Record<string, number>)?.emotional || 0,
      intellectual: (data as Record<string, number>)?.intellectual || 0,
      social: (data as Record<string, number>)?.social || 0,
      spiritual: (data as Record<string, number>)?.spiritual || 0,
      occupational: (data as Record<string, number>)?.occupational || 0,
      economic: (data as Record<string, number>)?.economic || 0,
    });

    return {
      wellbeingBefore: wellbeingBefore ? parseWellbeing(wellbeingBefore.scores) : {
        physical: 0, emotional: 0, intellectual: 0, social: 0,
        spiritual: 0, occupational: 0, economic: 0,
      },
      wellbeingAfter: wellbeingAfter ? parseWellbeing(wellbeingAfter.scores) : undefined,
      canvas: canvas ? {
        eliminate: canvas.eliminate || [],
        reduce: canvas.reduce || [],
        raise: canvas.raise || [],
        create: canvas.create || [],
      } : { eliminate: [], reduce: [], raise: [], create: [] },
      actions: (actions || []).map(a => ({
        id: a.id,
        category: a.category,
        action: a.action_text,
        dueDate: a.due_date,
        isCompleted: a.is_completed || false,
      })),
      journal: (journal || []).map(j => ({
        date: j.date,
        entry: j.entry,
        category: j.category,
      })),
    };
  }

  // ============================================================================
  // Integrated Profile Management
  // ============================================================================

  /**
   * Sync integrated profile when a module is completed
   */
  async syncIntegratedProfile(completedModuleId: ModuleId): Promise<void> {
    const supabase = await createServerSupabaseClient();

    // Get all completed modules
    const allProgress = await this.getAllProgress();
    const completedModules = allProgress
      .filter(p => p.status === 'completed')
      .map(p => p.moduleId);

    // Ensure the just-completed module is in the list
    if (!completedModules.includes(completedModuleId)) {
      completedModules.push(completedModuleId);
    }

    // Build profile data based on completed modules
    const profileData: Record<string, unknown> = {
      user_id: this.userId,
      modules_completed: completedModules,
      profile_completeness: Math.round((completedModules.length / MODULE_ORDER.length) * 100),
      updated_at: new Date().toISOString(),
    };

    // Add data from completed modules
    if (completedModules.includes('values')) {
      const valuesData = await this.getValuesData();
      if (valuesData) {
        profileData.top_values = [
          ...valuesData.terminalTop3.slice(0, 3).map(v => ({ type: 'terminal', name: v })),
          ...valuesData.instrumentalTop3.slice(0, 3).map(v => ({ type: 'instrumental', name: v })),
          ...valuesData.workTop3.slice(0, 3).map(v => ({ type: 'work', name: v })),
        ];
      }
    }

    if (completedModules.includes('strengths')) {
      const strengthsData = await this.getStrengthsData();
      if (strengthsData) {
        profileData.top_strengths = strengthsData.topStrengths.slice(0, 5).map(s => ({
          name: s.name,
          category: s.category,
          evidence: s.evidence,
        }));
      }
    }

    if (completedModules.includes('enneagram')) {
      const enneagramData = await this.getEnneagramData();
      if (enneagramData) {
        profileData.enneagram_type = enneagramData.type;
        profileData.enneagram_wing = enneagramData.wing;
        profileData.enneagram_instinct = enneagramData.instinct;
      }
    }

    if (completedModules.includes('life-themes')) {
      const lifeThemesData = await this.getLifeThemesData();
      if (lifeThemesData) {
        profileData.life_themes = lifeThemesData.themes.slice(0, 5);
      }
    }

    if (completedModules.includes('vision')) {
      const visionData = await this.getVisionData();
      if (visionData) {
        profileData.vision_statement = visionData.visionStatement;
        profileData.time_horizon = visionData.timeHorizon;
        profileData.dreams = visionData.dreams;
        profileData.core_aspirations = visionData.coreAspirations;
      }
    }

    if (completedModules.includes('mission')) {
      const missionData = await this.getMissionData();
      if (missionData) {
        profileData.mission_statement = missionData.finalStatement;
      }
    }

    if (completedModules.includes('career-options')) {
      const careerData = await this.getCareerOptionsData();
      if (careerData) {
        profileData.career_options = {
          hollandCode: careerData.hollandCode,
          topChoices: careerData.topCareerChoices,
        };
      }
    }

    if (completedModules.includes('swot')) {
      const swotData = await this.getSwotData();
      if (swotData) {
        profileData.swot_summary = {
          strengths: swotData.strengths.slice(0, 5),
          weaknesses: swotData.weaknesses.slice(0, 5),
          opportunities: swotData.opportunities.slice(0, 5),
          threats: swotData.threats.slice(0, 5),
        };
        profileData.priority_strategies = swotData.priorityStrategies.slice(0, 5);
      }
    }

    if (completedModules.includes('goals')) {
      const goalsData = await this.getGoalsData();
      if (goalsData) {
        profileData.life_roles = goalsData.roles.map(r => ({
          role: r.roleName,
          allocation: r.percentageAllocation,
          objectives: goalsData.objectives
            .filter(o => o.roleId === r.id)
            .map(o => o.objectiveText),
        }));
        profileData.key_objectives = goalsData.objectives.map(o => ({
          objective: o.objectiveText,
          keyResults: goalsData.keyResults
            .filter(kr => kr.objectiveId === o.id)
            .map(kr => kr.keyResultText),
        }));
      }
    }

    if (completedModules.includes('errc')) {
      const errcData = await this.getErrcData();
      if (errcData) {
        profileData.errc_actions = errcData.canvas;
        profileData.wellbeing_scores = errcData.wellbeingAfter || errcData.wellbeingBefore;
      }
    }

    // Upsert to integrated_profiles table
    const { error } = await supabase
      .from('user_integrated_profiles')
      .upsert(profileData, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('[ModuleProgressService] Error syncing integrated profile:', error);
    }
  }

  /**
   * Get the user's integrated profile
   */
  async getIntegratedProfile(): Promise<IntegratedProfile | null> {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('user_integrated_profiles')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    if (error || !data) return null;

    return {
      userId: data.user_id,
      topValues: data.top_values || [],
      topStrengths: data.top_strengths || [],
      enneagramType: data.enneagram_type,
      enneagramWing: data.enneagram_wing,
      enneagramInstinct: data.enneagram_instinct,
      lifeThemes: data.life_themes || [],
      missionStatement: data.mission_statement,
      visionStatement: data.vision_statement,
      timeHorizon: data.time_horizon,
      dreams: data.dreams || [],
      coreAspirations: data.core_aspirations || [],
      swotSummary: data.swot_summary || { strengths: [], weaknesses: [], opportunities: [], threats: [] },
      priorityStrategies: data.priority_strategies || [],
      lifeRoles: data.life_roles || [],
      keyObjectives: data.key_objectives || [],
      errcActions: data.errc_actions || { eliminate: [], reduce: [], raise: [], create: [] },
      wellbeingScores: data.wellbeing_scores,
      aiCareerInsights: data.ai_career_insights,
      aiStrengthPatterns: data.ai_strength_patterns,
      aiValueAlignment: data.ai_value_alignment,
      aiRecommendedActions: data.ai_recommended_actions || [],
      aiPersonalitySummary: data.ai_personality_summary,
      aiGrowthAreas: data.ai_growth_areas || [],
      modulesCompleted: data.modules_completed || [],
      profileCompleteness: data.profile_completeness || 0,
      lastAiAnalysisAt: data.last_ai_analysis_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  // ============================================================================
  // AI Context Generation
  // ============================================================================

  /**
   * Generate AI prompt context from available module data
   */
  async generatePromptContext(currentModule: ModuleId): Promise<string> {
    const context = await this.getCrossModuleContext(currentModule);
    const parts: string[] = [];

    if (context.availableData.values) {
      const v = context.availableData.values;
      parts.push(`User's Core Values:
- Terminal Values (Life Goals): ${v.terminalTop3.join(', ')}
- Instrumental Values (How to Live): ${v.instrumentalTop3.join(', ')}
- Work Values: ${v.workTop3.join(', ')}`);
    }

    if (context.availableData.strengths) {
      const s = context.availableData.strengths;
      parts.push(`User's Key Strengths:
${s.topStrengths.map(str => `- ${str.name}: ${str.description}`).join('\n')}`);
    }

    if (context.availableData.enneagram) {
      const e = context.availableData.enneagram;
      parts.push(`User's Enneagram Type: Type ${e.type}w${e.wing} (${e.instinct} instinct)
${e.description || ''}`);
    }

    if (context.availableData['life-themes']) {
      const lt = context.availableData['life-themes'];
      parts.push(`User's Life Themes:
${lt.themes.slice(0, 3).map(t => `- ${t.theme}: ${t.description}`).join('\n')}`);
    }

    if (context.availableData.vision) {
      const v = context.availableData.vision;
      parts.push(`User's Vision Statement (${v.timeHorizon}):
${v.visionStatement}
Core Aspirations: ${v.coreAspirations.join(', ')}`);
    }

    if (context.availableData.mission) {
      const m = context.availableData.mission;
      parts.push(`User's Mission Statement:
${m.finalStatement}`);
    }

    if (context.availableData['career-options']) {
      const c = context.availableData['career-options'];
      if (c.topCareerChoices && c.topCareerChoices.length > 0) {
        parts.push(`User's Top Career Choices:
${c.topCareerChoices.map(choice => `- ${choice.career}: ${choice.reason}`).join('\n')}`);
      }
    }

    if (context.availableData.swot) {
      const s = context.availableData.swot;
      parts.push(`User's SWOT Summary:
- Internal Strengths: ${s.strengths.slice(0, 3).join(', ')}
- Priority Strategies: ${s.priorityStrategies.slice(0, 3).map(p => p.strategy).join('; ')}`);
    }

    if (context.availableData.goals) {
      const g = context.availableData.goals;
      parts.push(`User's Life Roles:
${g.roles.slice(0, 4).map(r => `- ${r.roleName} (${r.percentageAllocation}%)`).join('\n')}`);
    }

    return parts.length > 0
      ? `--- User Profile Context ---\n${parts.join('\n\n')}\n--- End Context ---`
      : '';
  }

  // ============================================================================
  // Legacy Data Derivation (Backward Compatibility)
  // ============================================================================

  /**
   * Derive module progress when module_progress entries do not yet exist.
   */
  private async deriveProgressFromExistingData(
    supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
  ): Promise<ModuleProgress[]> {
    const progress: ModuleProgress[] = [];

    // Values
    const { data: valuesRows } = await supabase
      .from('value_results')
      .select('value_set, updated_at')
      .eq('user_id', this.userId);
    if (valuesRows && valuesRows.length > 0) {
      const setsCompleted = new Set(valuesRows.map(r => r.value_set));
      const percent = Math.min(100, Math.round((setsCompleted.size / 3) * 100));
      progress.push({
        moduleId: 'values',
        status: setsCompleted.size === 3 ? 'completed' : 'in_progress',
        completionPercentage: percent,
        currentStage: undefined,
        lastUpdatedAt: valuesRows[0]?.updated_at || new Date().toISOString(),
      });
    }

    // Strengths
    const { data: strengthsRow } = await supabase
      .from('strength_discovery_results')
      .select('is_completed, final_strengths, updated_at, current_step')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (strengthsRow) {
      const hasStrengths = !!strengthsRow.final_strengths;
      const status: ModuleStatus = strengthsRow.is_completed
        ? 'completed'
        : hasStrengths
          ? 'in_progress'
          : 'not_started';
      const completionPercentage = strengthsRow.is_completed
        ? 100
        : strengthsRow.current_step
          ? Math.min(100, Math.round((strengthsRow.current_step / 4) * 100))
          : hasStrengths
            ? 50
            : 0;
      progress.push({
        moduleId: 'strengths',
        status,
        completionPercentage,
        currentStage: undefined,
        lastUpdatedAt: strengthsRow.updated_at || new Date().toISOString(),
      });
    }

    // Enneagram - read from enneagram_sessions where stage='complete'
    const { data: enneagramRow } = await supabase
      .from('enneagram_sessions')
      .select('primary_type, stage, updated_at')
      .eq('user_id', this.userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    if (enneagramRow) {
      const isComplete = enneagramRow.stage === 'complete' && enneagramRow.primary_type;
      const stageProgress: Record<string, number> = {
        'screener': 20,
        'discriminators': 40,
        'wings': 60,
        'narrative': 80,
        'complete': 100,
      };
      progress.push({
        moduleId: 'enneagram',
        status: isComplete ? 'completed' : enneagramRow.stage !== 'screener' ? 'in_progress' : 'not_started',
        completionPercentage: stageProgress[enneagramRow.stage] || 0,
        currentStage: enneagramRow.stage,
        lastUpdatedAt: enneagramRow.updated_at || new Date().toISOString(),
      });
    }

    // Life Themes
    const { data: lifeThemesRow } = await supabase
      .from('life_themes_results')
      .select('themes, is_completed, updated_at')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (lifeThemesRow) {
      const hasThemes = lifeThemesRow.themes && Array.isArray(lifeThemesRow.themes) && lifeThemesRow.themes.length > 0;
      progress.push({
        moduleId: 'life-themes',
        status: lifeThemesRow.is_completed ? 'completed' : hasThemes ? 'in_progress' : 'not_started',
        completionPercentage: lifeThemesRow.is_completed ? 100 : hasThemes ? 50 : 0,
        currentStage: undefined,
        lastUpdatedAt: lifeThemesRow.updated_at || new Date().toISOString(),
      });
    }

    // Vision
    const { data: visionRow } = await supabase
      .from('vision_statements')
      .select('is_completed, final_statement, vision_statement, current_step, updated_at')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (visionRow) {
      const hasStatement = !!(visionRow.final_statement || visionRow.vision_statement);
      const status: ModuleStatus = visionRow.is_completed
        ? 'completed'
        : hasStatement
          ? 'in_progress'
          : 'not_started';
      const completionPercentage = visionRow.is_completed
        ? 100
        : visionRow.current_step
          ? Math.min(100, Math.round((visionRow.current_step / 5) * 100))
          : hasStatement
            ? 50
            : 0;
      progress.push({
        moduleId: 'vision',
        status,
        completionPercentage,
        currentStage: undefined,
        lastUpdatedAt: visionRow.updated_at || new Date().toISOString(),
      });
    }

    // SWOT
    const { data: swotRow } = await supabase
      .from('swot_analyses')
      .select('updated_at, is_completed')
      .eq('user_id', this.userId)
      .limit(1)
      .single();
    if (swotRow) {
      progress.push({
        moduleId: 'swot',
        status: swotRow.is_completed ? 'completed' : 'in_progress',
        completionPercentage: swotRow.is_completed ? 100 : 50,
        currentStage: undefined,
        lastUpdatedAt: swotRow.updated_at || new Date().toISOString(),
      });
    }

    // Goals
    const { data: goalsRows } = await supabase
      .from('goal_roles')
      .select('updated_at')
      .eq('user_id', this.userId)
      .limit(1);
    if (goalsRows && goalsRows.length > 0) {
      progress.push({
        moduleId: 'goals',
        status: 'in_progress',
        completionPercentage: 50,
        currentStage: undefined,
        lastUpdatedAt: goalsRows[0]?.updated_at || new Date().toISOString(),
      });
    }

    // ERRC
    const { data: errcRow } = await supabase
      .from('errc_canvas')
      .select('updated_at')
      .eq('user_id', this.userId)
      .limit(1)
      .single();
    if (errcRow) {
      progress.push({
        moduleId: 'errc',
        status: 'in_progress',
        completionPercentage: 50,
        currentStage: undefined,
        lastUpdatedAt: errcRow.updated_at || new Date().toISOString(),
      });
    }

    return progress;
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
