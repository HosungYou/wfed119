/**
 * AI Context Service
 *
 * Unified service for building AI prompts with cross-module context injection.
 * This service aggregates data from completed modules and formats it for AI consumption.
 *
 * v3.2 Update:
 * - Full 10-module support (including Mission and Career Options)
 * - Interpretation + Suggestion AI mode
 * - Robust null handling
 */

import { createModuleProgressService } from './moduleProgressService';
import {
  ModuleId,
  ValuesData,
  StrengthsData,
  EnneagramData,
  LifeThemesData,
  VisionData,
  MissionData,
  CareerOptionsData,
  SwotData,
  GoalSettingData,
  MODULE_ORDER,
} from '@/lib/types/modules';

export interface ModuleContext {
  values?: ValuesData | null;
  strengths?: StrengthsData | null;
  enneagram?: EnneagramData | null;
  lifeThemes?: LifeThemesData | null;
  vision?: VisionData | null;
  mission?: MissionData | null;
  careerOptions?: CareerOptionsData | null;
  swot?: SwotData | null;
  goals?: GoalSettingData | null;
}

export interface AIContextResult {
  promptContext: string;
  availableModules: ModuleId[];
  hasContext: boolean;
  summary: {
    values: string[];
    strengths: string[];
    enneagramType?: string;
    vision?: string;
    mission?: string;
  };
}

export class AIContextService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Build comprehensive AI context from all completed modules
   */
  async buildContextForModule(targetModule: ModuleId): Promise<AIContextResult> {
    const service = await createModuleProgressService(this.userId);
    if (!service) {
      return {
        promptContext: '',
        availableModules: [],
        hasContext: false,
        summary: { values: [], strengths: [] },
      };
    }

    const crossModuleContext = await service.getCrossModuleContext(targetModule);
    const sections: string[] = [];
    const availableModules: ModuleId[] = [];
    const summary: AIContextResult['summary'] = { values: [], strengths: [] };

    // Values
    if (crossModuleContext.availableData.values) {
      const v = crossModuleContext.availableData.values;
      availableModules.push('values');
      summary.values = [
        ...v.terminalTop3.slice(0, 2),
        ...v.instrumentalTop3.slice(0, 2),
        ...v.workTop3.slice(0, 2),
      ];

      sections.push(`
## 사용자의 핵심 가치 (User's Core Values)
- 궁극적 가치 (Terminal): ${v.terminalTop3.join(', ') || '미완료'}
- 수단적 가치 (Instrumental): ${v.instrumentalTop3.join(', ') || '미완료'}
- 직업 가치 (Work): ${v.workTop3.join(', ') || '미완료'}

→ 이 가치들과 일치하는 제안을 우선시하세요.
`);
    }

    // Strengths
    if (crossModuleContext.availableData.strengths) {
      const s = crossModuleContext.availableData.strengths;
      availableModules.push('strengths');
      summary.strengths = s.topStrengths.slice(0, 5).map(str => str.name);

      sections.push(`
## 발견된 강점 (Discovered Strengths)
${s.topStrengths.slice(0, 5).map(str => `- ${str.name}: ${str.description || ''}`).join('\n')}

${s.strengthsSummary ? `요약: ${s.strengthsSummary}` : ''}

→ 이 강점을 활용하는 방향으로 안내하세요.
`);
    }

    // Enneagram
    if (crossModuleContext.availableData.enneagram) {
      const e = crossModuleContext.availableData.enneagram;
      availableModules.push('enneagram');
      summary.enneagramType = `Type ${e.type}w${e.wing}`;

      sections.push(`
## 성격 유형 (Personality Type - Enneagram)
- 유형: Type ${e.type} (Wing ${e.wing})
- 본능 변형: ${e.instinct === 'sp' ? '자기보존' : e.instinct === 'so' ? '사회적' : '성적'}
- 확신도: ${e.confidence === 'high' ? '높음' : e.confidence === 'medium' ? '보통' : '낮음'}
${e.description ? `- 설명: ${e.description}` : ''}

→ 이 유형의 동기부여 방식과 성장 방향을 고려하세요.
`);
    }

    // Life Themes
    if (crossModuleContext.availableData['life-themes']) {
      const lt = crossModuleContext.availableData['life-themes'];
      availableModules.push('life-themes');

      sections.push(`
## 생애 주제 (Life Themes)
${lt.themes.slice(0, 3).map(t => `- ${t.theme}: ${t.description || ''}`).join('\n')}

→ 이 주제들이 사용자의 커리어 선택에 어떻게 연결되는지 고려하세요.
`);
    }

    // Vision
    if (crossModuleContext.availableData.vision) {
      const v = crossModuleContext.availableData.vision;
      availableModules.push('vision');
      summary.vision = v.visionStatement;

      sections.push(`
## 비전 (Vision Statement)
- 시간 지평: ${v.timeHorizon}
- 비전 선언문: ${v.visionStatement || '미완료'}
${v.coreAspirations.length > 0 ? `- 핵심 열망: ${v.coreAspirations.join(', ')}` : ''}

→ 이 비전과 연결된 제안을 제공하세요.
`);
    }

    // Mission
    if (crossModuleContext.availableData.mission) {
      const m = crossModuleContext.availableData.mission as MissionData;
      availableModules.push('mission');
      summary.mission = m.finalStatement;

      sections.push(`
## 사명 (Mission Statement)
${m.finalStatement || '미완료'}

→ 사명과 일치하는 방향으로 안내하세요.
`);
    }

    // Career Options
    if (crossModuleContext.availableData['career-options']) {
      const c = crossModuleContext.availableData['career-options'] as CareerOptionsData;
      availableModules.push('career-options');

      const topCareers = c.topCareerChoices?.slice(0, 3) || [];
      sections.push(`
## 커리어 옵션 (Career Options)
- Holland 코드: ${c.hollandCode.primary}${c.hollandCode.secondary || ''}${c.hollandCode.tertiary || ''}
${topCareers.length > 0 ? `- 선호 커리어: ${topCareers.map(tc => tc.career).join(', ')}` : ''}

→ 이 커리어 방향과 연결된 목표를 제안하세요.
`);
    }

    // SWOT
    if (crossModuleContext.availableData.swot) {
      const s = crossModuleContext.availableData.swot;
      availableModules.push('swot');

      sections.push(`
## SWOT 분석 요약
- 강점: ${s.strengths.slice(0, 3).join(', ')}
- 약점: ${s.weaknesses.slice(0, 3).join(', ')}
- 기회: ${s.opportunities.slice(0, 3).join(', ')}
- 위협: ${s.threats.slice(0, 3).join(', ')}
${s.priorityStrategies.length > 0 ? `
우선순위 전략:
${s.priorityStrategies.slice(0, 3).map(p => `- [${p.type}] ${p.strategy}`).join('\n')}
` : ''}

→ SWOT 전략을 기반으로 실행 가능한 제안을 하세요.
`);
    }

    // Goals
    if (crossModuleContext.availableData.goals) {
      const g = crossModuleContext.availableData.goals;
      availableModules.push('goals');

      sections.push(`
## 설정된 목표 (Goals)
역할:
${g.roles.slice(0, 4).map(r => `- ${r.roleName} (${r.percentageAllocation}%)`).join('\n')}

주요 목표:
${g.objectives.slice(0, 3).map(o => `- ${o.objectiveText}`).join('\n')}

→ 기존 목표와 연결된 실행 계획을 제안하세요.
`);
    }

    const promptContext = sections.length > 0
      ? `
=== 사용자 프로필 컨텍스트 ===
완료된 모듈: ${availableModules.join(', ')}
진행률: ${Math.round((availableModules.length / MODULE_ORDER.length) * 100)}%

${sections.join('\n')}
=== 컨텍스트 끝 ===
`
      : '';

    return {
      promptContext,
      availableModules,
      hasContext: sections.length > 0,
      summary,
    };
  }

  /**
   * Get a quick summary of user profile for UI display
   */
  async getProfileSummary(): Promise<AIContextResult['summary']> {
    const result = await this.buildContextForModule('errc'); // Get all available data
    return result.summary;
  }

  /**
   * Build context specifically for AI suggestions
   * Returns a more concise format optimized for AI prompts
   */
  async buildSuggestionContext(targetModule: ModuleId): Promise<string> {
    const result = await this.buildContextForModule(targetModule);

    if (!result.hasContext) {
      return '사용자 프로필 정보가 아직 충분하지 않습니다.';
    }

    const conciseParts: string[] = [];

    if (result.summary.values.length > 0) {
      conciseParts.push(`핵심 가치: ${result.summary.values.join(', ')}`);
    }

    if (result.summary.strengths.length > 0) {
      conciseParts.push(`주요 강점: ${result.summary.strengths.join(', ')}`);
    }

    if (result.summary.enneagramType) {
      conciseParts.push(`성격 유형: ${result.summary.enneagramType}`);
    }

    if (result.summary.vision) {
      conciseParts.push(`비전: ${result.summary.vision.slice(0, 100)}...`);
    }

    if (result.summary.mission) {
      conciseParts.push(`사명: ${result.summary.mission.slice(0, 100)}...`);
    }

    return conciseParts.join('\n');
  }
}

/**
 * Factory function to create AIContextService instance
 */
export async function createAIContextService(userId?: string): Promise<AIContextService | null> {
  if (userId) {
    return new AIContextService(userId);
  }

  // Try to get from session
  const { createServerSupabaseClient } = await import('@/lib/supabase-server');
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    return null;
  }

  return new AIContextService(user.id);
}
