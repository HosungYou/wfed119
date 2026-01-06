import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import { AIService } from '@/lib/services/aiServiceClaude';

const aiService = new AIService();

type SuggestionType = 'objective' | 'key_result' | 'action';

type SuggestRequest = {
  type?: SuggestionType;
  roleName?: string;
  roleDescription?: string;
  objectiveText?: string;
  keyResultText?: string;
  swotStrategies?: string[];
  durationMonths?: number;
};

const normalizeDuration = (value?: number) => {
  if (value === 3 || value === 6 || value === 12) return value;
  return 6;
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const auth = checkDevAuth(session);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as SuggestRequest;
    const type = body.type;

    if (!type || !['objective', 'key_result', 'action'].includes(type)) {
      return NextResponse.json({ error: 'type must be objective, key_result, or action' }, { status: 400 });
    }

    const roleName = body.roleName?.trim() || 'Personal Role';
    const roleDescription = body.roleDescription?.trim() || '';
    const objectiveText = body.objectiveText?.trim() || '';
    const keyResultText = body.keyResultText?.trim() || '';
    const strategies = Array.isArray(body.swotStrategies) ? body.swotStrategies.filter(Boolean) : [];
    const duration = normalizeDuration(body.durationMonths);

    const strategyText = strategies.length > 0
      ? `Relevant SWOT strategies: ${strategies.slice(0, 6).join(' | ')}.`
      : 'No explicit SWOT strategies selected.';

    let prompt = '';

    if (type === 'objective') {
      prompt = [
        `Write ONE inspiring Objective sentence for the role: ${roleName}.`,
        roleDescription ? `Role description: ${roleDescription}.` : '',
        strategyText,
        `Goal horizon: ${duration} months.`,
        'Keep it concise, personal, and value-driven.',
      ].filter(Boolean).join(' ');
    }

    if (type === 'key_result') {
      prompt = [
        `Write ONE measurable Key Result for the objective: ${objectiveText || 'an objective in this role'}.`,
        `Role: ${roleName}.`,
        strategyText,
        `Goal horizon: ${duration} months.`,
        'Include a concrete metric or success criteria and a realistic deadline.',
      ].filter(Boolean).join(' ');
    }

    if (type === 'action') {
      prompt = [
        `Write ONE concrete action step that advances this Key Result: ${keyResultText || 'a key result'}.`,
        `Role: ${roleName}.`,
        `Goal horizon: ${duration} months.`,
        'Make it small, specific, and easy to start within a week.',
      ].filter(Boolean).join(' ');
    }

    const suggestion = await aiService.generateGoalSuggestion(prompt);

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error('[Goal AI Suggest] Unexpected error:', error);
    return NextResponse.json({ error: 'Failed to generate suggestion' }, { status: 500 });
  }
}
