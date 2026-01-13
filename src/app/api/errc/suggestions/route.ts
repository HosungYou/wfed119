import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getVerifiedUser } from '@/lib/supabase-server';
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';
import type {
  ErrcSuggestionsRequest,
  ErrcSuggestionsResponse,
  ErrcCategory,
  WellbeingDimension,
} from '@/lib/types/errc';
import { ERRC_CATEGORY_LABELS, WELLBEING_DIMENSION_LABELS } from '@/lib/types/errc';

/**
 * POST /api/errc/suggestions
 *
 * Generate AI suggestions for ERRC items based on wellbeing scores and context
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getVerifiedUser();
    const supabase = await createServerSupabaseClient();

    const auth = checkDevAuth(user);

    if (!requireAuth(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ErrcSuggestionsRequest = await req.json();

    if (!body.category || !body.wellbeing_scores) {
      return NextResponse.json(
        { error: 'category and wellbeing_scores are required' },
        { status: 400 }
      );
    }

    // Find lowest wellbeing dimensions
    const scores = body.wellbeing_scores;
    const dimensionScores = Object.entries(scores) as [WellbeingDimension, number][];
    dimensionScores.sort((a, b) => a[1] - b[1]);
    const lowestDimensions = dimensionScores.slice(0, 3).map(([dim]) => dim);

    // Generate contextual suggestions based on category and wellbeing
    const suggestions = generateSuggestions(
      body.category,
      lowestDimensions,
      body.existing_items || [],
      body.swot_context
    );

    const response: ErrcSuggestionsResponse = { suggestions };
    return NextResponse.json(response);
  } catch (error) {
    console.error('[ERRC Suggestions] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Generate suggestions based on category and context
 * In production, this would call Claude API for personalized suggestions
 */
function generateSuggestions(
  category: ErrcCategory,
  lowestDimensions: WellbeingDimension[],
  existingItems: string[],
  swotContext?: { strengths: string[]; weaknesses: string[]; goals: string[] }
) {
  // Template suggestions by category
  const suggestionTemplates: Record<ErrcCategory, Array<{
    item_text: string;
    description: string;
    related_wellbeing: WellbeingDimension[];
    rationale: string;
  }>> = {
    eliminate: [
      {
        item_text: 'Unnecessary meetings',
        description: 'Meetings that don\'t require your presence or could be emails',
        related_wellbeing: ['occupational', 'emotional'],
        rationale: 'Reclaim time for focused work and reduce decision fatigue',
      },
      {
        item_text: 'Toxic relationships',
        description: 'Relationships that consistently drain your energy',
        related_wellbeing: ['social', 'emotional'],
        rationale: 'Protect your emotional wellbeing and energy',
      },
      {
        item_text: 'Excessive news consumption',
        description: 'Compulsive checking of news and social media',
        related_wellbeing: ['emotional', 'intellectual'],
        rationale: 'Reduce anxiety and free up mental space',
      },
      {
        item_text: 'Automatic "yes" to requests',
        description: 'Saying yes before considering your capacity',
        related_wellbeing: ['occupational', 'physical'],
        rationale: 'Prevent overcommitment and burnout',
      },
    ],
    reduce: [
      {
        item_text: 'Social media time',
        description: 'Time spent scrolling through social media feeds',
        related_wellbeing: ['emotional', 'intellectual'],
        rationale: 'Balance digital consumption with real-world activities',
      },
      {
        item_text: 'Overtime work',
        description: 'Working beyond regular hours habitually',
        related_wellbeing: ['physical', 'social', 'emotional'],
        rationale: 'Create space for rest and relationships',
      },
      {
        item_text: 'Perfectionism',
        description: 'Spending excessive time perfecting already good work',
        related_wellbeing: ['occupational', 'emotional'],
        rationale: 'Focus energy on high-impact activities',
      },
      {
        item_text: 'Passive entertainment',
        description: 'TV/streaming without intention',
        related_wellbeing: ['intellectual', 'physical'],
        rationale: 'Make room for more fulfilling activities',
      },
    ],
    raise: [
      {
        item_text: 'Quality time with family',
        description: 'Focused, device-free time with loved ones',
        related_wellbeing: ['social', 'emotional'],
        rationale: 'Strengthen relationships and emotional support',
      },
      {
        item_text: 'Exercise frequency',
        description: 'Regular physical activity',
        related_wellbeing: ['physical', 'emotional'],
        rationale: 'Improve energy, mood, and long-term health',
      },
      {
        item_text: 'Self-reflection time',
        description: 'Regular journaling or meditation',
        related_wellbeing: ['spiritual', 'emotional'],
        rationale: 'Increase self-awareness and emotional regulation',
      },
      {
        item_text: 'Active listening',
        description: 'Fully present attention in conversations',
        related_wellbeing: ['social', 'occupational'],
        rationale: 'Improve relationships and understanding',
      },
    ],
    create: [
      {
        item_text: 'Morning routine',
        description: 'A intentional start to each day',
        related_wellbeing: ['physical', 'spiritual', 'emotional'],
        rationale: 'Set positive tone and increase daily effectiveness',
      },
      {
        item_text: 'Weekly review habit',
        description: 'Regular reflection on progress and priorities',
        related_wellbeing: ['occupational', 'intellectual'],
        rationale: 'Maintain alignment with goals and values',
      },
      {
        item_text: 'New hobby or skill',
        description: 'Learning something purely for enjoyment',
        related_wellbeing: ['intellectual', 'emotional'],
        rationale: 'Stimulate growth and joy outside of work',
      },
      {
        item_text: 'Mentoring relationship',
        description: 'Either as mentor or mentee',
        related_wellbeing: ['social', 'occupational', 'spiritual'],
        rationale: 'Contribute to others while growing yourself',
      },
    ],
  };

  // Get base suggestions for category
  let suggestions = suggestionTemplates[category] || [];

  // Filter out already existing items
  if (existingItems.length > 0) {
    const existingLower = existingItems.map(i => i.toLowerCase());
    suggestions = suggestions.filter(
      s => !existingLower.some(e => s.item_text.toLowerCase().includes(e) || e.includes(s.item_text.toLowerCase()))
    );
  }

  // Prioritize suggestions that relate to lowest wellbeing dimensions
  suggestions.sort((a, b) => {
    const aRelevance = a.related_wellbeing.filter(w => lowestDimensions.includes(w)).length;
    const bRelevance = b.related_wellbeing.filter(w => lowestDimensions.includes(w)).length;
    return bRelevance - aRelevance;
  });

  // Return top 4 suggestions
  return suggestions.slice(0, 4);
}
