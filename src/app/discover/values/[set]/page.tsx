'use client';

import React, { useMemo, useRef, useState, useEffect, use } from 'react';
import Link from 'next/link';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { ArrowLeft, Save, Download, LogIn, LogOut, ShieldCheck, RotateCcw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import * as htmlToImage from 'html-to-image';
import { useModuleProgress } from '@/hooks/useModuleProgress';

type Value = { id: string; name: string; description: string };
type SetKey = 'terminal' | 'instrumental' | 'work';

const TERMINAL: Value[] = [
  { id: 'tv1', name: 'Family Security', description: "Ensuring the safety, well-being, and financial security of one's family" },
  { id: 'tv2', name: 'Personal Growth', description: "Self-improvement, learning, and developing one's potential" },
  { id: 'tv3', name: 'Health and Wellness', description: 'Physical, mental, and emotional well-being' },
  { id: 'tv4', name: 'National Security', description: "Safety and stability of one's nation" },
  { id: 'tv5', name: 'Global Citizenship', description: 'Belonging and responsibility to the global community' },
  { id: 'tv6', name: 'Inner Peace', description: 'Inner tranquility, contentment, and balance' },
  { id: 'tv7', name: 'Social Justice', description: 'Fair, equitable, and just society' },
  { id: 'tv8', name: 'Mature Love', description: 'Deep, committed relationship with intimacy and passion' },
  { id: 'tv9', name: 'Sense of Accomplishment', description: 'Achieving goals and feeling successful' },
  { id: 'tv10', name: 'A World of Beauty', description: 'Beauty in nature, art, and life experiences' },
  { id: 'tv11', name: 'Spirituality', description: 'Connection beyond the material world' },
  { id: 'tv12', name: 'Recognition', description: 'Acknowledgment, respect, and esteem from others' },
  { id: 'tv13', name: 'Freedom', description: 'Autonomy and the right to make choices' },
  { id: 'tv14', name: 'Financial Freedom', description: 'Economic independence; freedom from constraints' },
  { id: 'tv15', name: 'Pleasure', description: 'Enjoyable and satisfying experiences' },
  { id: 'tv16', name: 'Sustainable Planet', description: 'Eco-friendly, sustainable world' },
  { id: 'tv17', name: 'Wisdom', description: 'Knowledge, insight, and sound judgment' },
  { id: 'tv18', name: 'Authenticity', description: 'Being true to oneself with sincerity' },
  { id: 'tv19', name: 'True Friendship', description: 'Deep, meaningful, loyal friendships' },
  { id: 'tv20', name: 'Comfortable Life', description: 'Contentment, ease, and security' },
  { id: 'tv21', name: 'A World at Peace', description: 'Peace, cooperation, and mutual understanding' },
  { id: 'tv22', name: 'Happiness', description: 'Joy and a sense of purpose' },
  { id: 'tv23', name: 'Innovation', description: 'Creativity, progress, and new ideas' },
  { id: 'tv24', name: 'An Exciting Life', description: 'Adventure and stimulation' }
];

const INSTRUMENTAL: Value[] = [
  { id: 'iv1', name: 'Open-mindedness', description: 'Consider new ideas; revise views based on evidence' },
  { id: 'iv2', name: 'Humility', description: 'Be grounded; learn from others' },
  { id: 'iv3', name: 'Empathy', description: 'Resonate with others\' feelings and respond appropriately' },
  { id: 'iv4', name: 'Tolerance', description: 'Accept differences even when uncomfortable' },
  { id: 'iv5', name: 'Discipline', description: 'Act consistently with principles and rules' },
  { id: 'iv6', name: 'Logical Thinking', description: 'Systematic, rational reasoning' },
  { id: 'iv7', name: 'Helpfulness', description: 'Recognize needs and offer support' },
  { id: 'iv8', name: 'Responsiveness', description: 'Respond quickly and sensitively to needs' },
  { id: 'iv9', name: 'Imagination', description: 'Envision possibilities beyond current reality' },
  { id: 'iv10', name: 'Reliability', description: 'Keep promises; be consistent and dependable' },
  { id: 'iv11', name: 'Ambition', description: 'Hold big dreams and strive to realize them' },
  { id: 'iv12', name: 'Courage', description: 'Choose right action despite fear or difficulty' },
  { id: 'iv13', name: 'Competence', description: 'Perform tasks effectively and with quality' },
  { id: 'iv14', name: 'Perseverance', description: 'Endure hardship and do not give up' },
  { id: 'iv15', name: 'Assertiveness', description: 'Express opinions and rights confidently' },
  { id: 'iv16', name: 'Self-control', description: 'Regulate impulses and emotions' },
  { id: 'iv17', name: 'Adaptability', description: 'Adjust flexibly to changing environments' },
  { id: 'iv18', name: 'Respect', description: 'Value others\' dignity and rights' },
  { id: 'iv19', name: 'Initiative', description: 'Take the lead and create opportunities' },
  { id: 'iv20', name: 'Intellectual Activity', description: 'Expand knowledge via learning and thinking' },
  { id: 'iv21', name: 'Integrity', description: 'Speak truth; align inner and outer self' },
  { id: 'iv22', name: 'Creativity', description: 'Generate original ideas and solutions' },
  { id: 'iv23', name: 'Cleanliness & Order', description: 'Keep spaces hygienic and organized' },
  { id: 'iv24', name: 'Loyalty', description: 'Maintain unwavering commitment and allegiance' },
  { id: 'iv25', name: 'Responsibility', description: 'Own outcomes; carry roles to completion' },
  { id: 'iv26', name: 'Kindness', description: 'Be warm and considerate to others' },
  { id: 'iv27', name: 'Cooperation', description: 'Work harmoniously with others toward goals' },
  { id: 'iv28', name: 'Resilience', description: 'Bounce back quickly from setbacks' }
];

const WORK: Value[] = [
  { id: 'wv1', name: 'Supervisory Opportunity', description: 'Leadership experience managing team members' },
  { id: 'wv2', name: 'Fairness', description: 'Equitable and just treatment at work' },
  { id: 'wv3', name: 'Relationships', description: 'Positive relationships with colleagues and supervisors' },
  { id: 'wv4', name: 'Work–Life Balance', description: 'Harmony between work and personal life' },
  { id: 'wv5', name: 'Compensation', description: 'Sufficient financial rewards' },
  { id: 'wv6', name: 'Contribution (Impact)', description: 'Make meaningful impact and add value' },
  { id: 'wv7', name: 'Task Variety', description: 'Diverse tasks and responsibilities' },
  { id: 'wv8', name: 'Challenge', description: 'Test and develop abilities' },
  { id: 'wv9', name: 'Autonomy/Independence', description: 'Perform tasks with minimal interference' },
  { id: 'wv10', name: 'Prestige', description: 'Respect via reputable role or organization' },
  { id: 'wv11', name: 'Achievement', description: 'Feel accomplishment by achieving goals' },
  { id: 'wv12', name: 'Advancement', description: 'Opportunities for higher roles and responsibility' },
  { id: 'wv13', name: 'Security/Stability', description: 'Safe conditions and stable employment' },
  { id: 'wv14', name: 'Travel (Business Trips)', description: 'Visit various locations through work' },
  { id: 'wv15', name: 'Geographic Location', description: 'Convenient location for commute and life' },
  { id: 'wv16', name: 'Flexibility', description: 'Flexible time or place of work' },
  { id: 'wv17', name: 'Ethics', description: 'Strong ethical standards in the environment' },
  { id: 'wv18', name: 'Recognition', description: 'Appropriate evaluation and appreciation' },
  { id: 'wv19', name: 'Person–Job Fit', description: 'Tasks match ability and disposition' },
  { id: 'wv20', name: 'Working Conditions', description: 'Pleasant and efficient physical environment' },
  { id: 'wv21', name: 'Professional Development', description: 'Learn and grow into expertise' },
  { id: 'wv22', name: 'Supportive Supervision', description: 'Encouraging, constructive manager' },
  { id: 'wv23', name: 'Creativity', description: 'Exercise free, original ideas' },
  { id: 'wv24', name: 'Teamwork', description: 'Collaborate to achieve shared goals' },
  { id: 'wv25', name: 'Innovation', description: 'Introduce new methods/technologies for change' }
];

type Layout = {
  very_important: string[];
  important: string[];
  somewhat_important: string[];
  not_important: string[];
};
const emptyLayout: Layout = { very_important: [], important: [], somewhat_important: [], not_important: [] };
type LayoutBucket = keyof Layout;

interface ValuePatterns {
  securityCount: number;
  socialCount: number;
  growthCount: number;
  achievementCount: number;
  veryImportantValues: Value[];
}

interface PersonalityInsights {
  mbtiType: string;
  enneagramType: string;
  coreTheme: string;
}

interface CareerInsights {
  careers: string[];
  workEnvironment: string;
  leadershipStyle: string;
}

interface ThemeValue {
  id: string;
  name: string;
  bucket: LayoutBucket;
  priority: number;
}

interface ThemeScore {
  name: string;
  values: ThemeValue[];
  count: number;
  totalScore: number;
  averageScore: number;
  highPriorityCount: number;
}

interface ThemeAnalysis {
  mostImportantThemes: ThemeScore[];
  leastImportantThemes: ThemeScore[];
  allThemes: ThemeScore[];
}

interface ThemeInsights {
  profileInsight: string;
  balanceInsight: string;
}

const layoutBucketIds: LayoutBucket[] = ['very_important', 'important', 'somewhat_important', 'not_important'];

const isLayoutBucket = (value: string): value is LayoutBucket =>
  layoutBucketIds.includes(value as LayoutBucket);

export default function ValueSetPage({ params }: { params: Promise<{ set?: string }> }) {
  // Unwrap the async params using React.use() for Next.js 15 compatibility
  const resolvedParams = use(params);

  const normalizedSet = useMemo<SetKey>(() => {
    const candidate = resolvedParams?.set;
    if (candidate === 'terminal' || candidate === 'instrumental' || candidate === 'work') {
      return candidate;
    }
    return 'work';
  }, [resolvedParams?.set]);

  const [routeSet, setRouteSet] = useState<SetKey>(normalizedSet);
  useEffect(() => { setRouteSet(normalizedSet); }, [normalizedSet]);

  const VALUES = useMemo(() => {
    switch (routeSet) {
      case 'terminal': return TERMINAL;
      case 'instrumental': return INSTRUMENTAL;
      default: return WORK;
    }
  }, [routeSet]);

  const { user, isAuthenticated, loading, signInWithGoogle, signOut } = useAuth();
  const { startModule, updateStage, completeModule } = useModuleProgress('values');
  const [palette, setPalette] = useState<string[]>([]);
  const [layout, setLayout] = useState<Layout>(emptyLayout);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      startModule();
    }
  }, [isAuthenticated, startModule]);

  useEffect(() => { setPalette(VALUES.map(v => v.id)); setLayout(emptyLayout); }, [VALUES]);

  // Load saved from server if available
  useEffect(() => {
    // Use user.id consistently (same as server-side resolveUserId)
    const userId = user?.id ?? user?.email ?? undefined;
    if (!userId || !routeSet) return;
    fetch(`/api/discover/values/results?user_id=${encodeURIComponent(userId)}&set=${routeSet}`)
      .then(r => r.json())
      .then(data => {
        if (data && data.exists) {
          const saved: Layout = data.layout;
          setLayout(saved);
          const placed = new Set([...saved.very_important, ...saved.important, ...saved.somewhat_important, ...saved.not_important]);
          setPalette(VALUES.filter(v => !placed.has(v.id)).map(v => v.id));
        }
      })
      .catch(() => { });
  }, [user, routeSet, VALUES]);

  const byId = useMemo(() => Object.fromEntries(VALUES.map(v => [v.id, v])), [VALUES]);

  function handleDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const sourceId = source.droppableId;
    const destId = destination.droppableId;
    if (sourceId === destId && source.index === destination.index) return;

    const nextLayout: Layout = JSON.parse(JSON.stringify(layout));

    // Remove from source
    if (sourceId === 'palette') {
      setPalette(prev => prev.filter(x => x !== draggableId));
    } else if (isLayoutBucket(sourceId)) {
      const updated = nextLayout[sourceId].filter(x => x !== draggableId);
      nextLayout[sourceId] = updated;
    }

    // Add to dest
    if (destId === 'palette') {
      setPalette(prev => { const arr = [...prev]; arr.splice(destination.index, 0, draggableId); return arr; });
      // Ensure layout reflects removal from the source bucket
      setLayout(nextLayout);
    } else if (isLayoutBucket(destId)) {
      // Check if destination bucket has room (max 7 items)
      const destArray = nextLayout[destId];
      if (destArray.length >= 7) {
        // Bucket is full, don't allow the drop
        return;
      }

      const arr = [...destArray];
      arr.splice(destination.index, 0, draggableId);
      nextLayout[destId] = arr;
      setLayout(nextLayout);
    }
  }

  const top3 = layout.very_important.slice(0, 3).map(id => byId[id]?.name || id);

  // Value Analysis Functions
  function analyzeValuePatterns(): ValuePatterns | null {
    const veryImportantValues = layout.very_important.map(id => byId[id]);

    if (veryImportantValues.length === 0) return null;

    // Security themes
    const securityKeywords = ['security', 'safety', 'stable', 'protection'];
    const securityCount = veryImportantValues.filter(v =>
      securityKeywords.some(keyword => v.name.toLowerCase().includes(keyword) || v.description.toLowerCase().includes(keyword))
    ).length;

    // Social impact themes
    const socialKeywords = ['social', 'global', 'community', 'recognition', 'justice', 'contribution'];
    const socialCount = veryImportantValues.filter(v =>
      socialKeywords.some(keyword => v.name.toLowerCase().includes(keyword) || v.description.toLowerCase().includes(keyword))
    ).length;

    // Growth/autonomy themes
    const growthKeywords = ['growth', 'freedom', 'wisdom', 'learning', 'autonomy', 'independence'];
    const growthCount = veryImportantValues.filter(v =>
      growthKeywords.some(keyword => v.name.toLowerCase().includes(keyword) || v.description.toLowerCase().includes(keyword))
    ).length;

    // Achievement themes
    const achievementKeywords = ['accomplishment', 'success', 'achievement', 'recognition', 'excellence'];
    const achievementCount = veryImportantValues.filter(v =>
      achievementKeywords.some(keyword => v.name.toLowerCase().includes(keyword) || v.description.toLowerCase().includes(keyword))
    ).length;

    return { securityCount, socialCount, growthCount, achievementCount, veryImportantValues };
  }

  function getPersonalityInsights(patterns: ValuePatterns | null): PersonalityInsights | null {
    if (!patterns) return null;

    const { securityCount, socialCount, growthCount, achievementCount } = patterns;
    const total = securityCount + socialCount + growthCount + achievementCount;

    if (total === 0) return null;

    let mbtiType = '';
    let enneagramType = '';
    let coreTheme = '';

    // MBTI inference
    if (socialCount >= 2 && securityCount >= 1) {
      mbtiType = securityCount > growthCount ? 'ESFJ' : 'ENFJ';
    } else if (growthCount >= 2 && socialCount >= 1) {
      mbtiType = socialCount > securityCount ? 'ENFP' : 'ENTP';
    } else if (securityCount >= 2) {
      mbtiType = socialCount > 0 ? 'ISFJ' : 'ISTJ';
    } else if (achievementCount >= 2) {
      mbtiType = socialCount > 0 ? 'ENTJ' : 'ESTJ';
    } else {
      mbtiType = 'INFP';
    }

    // Enneagram inference
    if (securityCount >= 2) {
      enneagramType = 'Type 6 (Loyalist)';
    } else if (achievementCount >= 2) {
      enneagramType = 'Type 3 (Achiever)';
    } else if (socialCount >= 2) {
      enneagramType = 'Type 2 (Helper)';
    } else if (growthCount >= 2) {
      enneagramType = 'Type 4 (Individualist)';
    } else {
      enneagramType = 'Type 9 (Peacemaker)';
    }

    // Enhanced Core theme generation using position-based scoring
    const generateCoreThemeFromScoring = (): string => {
      const topValues = layout.very_important.slice(0, 3).map(id => byId[id]);
      if (topValues.length === 0) return 'Values Explorer';

      const themeAnalysis = analyzeValueThemes();
      if (themeAnalysis.mostImportantThemes.length === 0) return 'Values Explorer';

      const primaryTheme = themeAnalysis.mostImportantThemes[0].name;
      const secondaryTheme = themeAnalysis.mostImportantThemes[1]?.name;

      // Generate theme based on top scoring patterns
      if (primaryTheme.includes('Security') && secondaryTheme?.includes('Social')) {
        return 'Protective Community Leader';
      } else if (primaryTheme.includes('Growth') && secondaryTheme?.includes('Social')) {
        return 'Developmental Catalyst';
      } else if (primaryTheme.includes('Achievement') && secondaryTheme?.includes('Social')) {
        return 'Impactful Achiever';
      } else if (primaryTheme.includes('Freedom') && secondaryTheme?.includes('Growth')) {
        return 'Independent Innovator';
      } else if (primaryTheme.includes('Security') && secondaryTheme?.includes('Growth')) {
        return 'Stable Progress Builder';
      } else if (primaryTheme.includes('Relationships')) {
        return 'Connection-Centered Leader';
      } else if (primaryTheme.includes('Achievement')) {
        return 'Excellence-Driven Professional';
      } else if (primaryTheme.includes('Growth')) {
        return 'Continuous Learning Champion';
      } else if (primaryTheme.includes('Security')) {
        return 'Stability-Focused Guardian';
      } else if (primaryTheme.includes('Social')) {
        return 'Community Impact Maker';
      } else {
        return primaryTheme.replace(' & ', '-').replace(/\s+/g, ' ') + ' Advocate';
      }
    };

    coreTheme = generateCoreThemeFromScoring();

    return { mbtiType, enneagramType, coreTheme };
  }

  function getCareerInsights(patterns: ValuePatterns | null, personality: PersonalityInsights | null): CareerInsights | null {
    if (!patterns || !personality) return null;

    const { coreTheme } = personality;

    let careers: string[] = [];
    let workEnvironment = '';
    let leadershipStyle = '';

    if (coreTheme === 'Protective Community Leader') {
      careers = ['Government Administrator', 'Healthcare Manager', 'Non-profit Director', 'Education Coordinator'];
      workEnvironment = 'Stable organization with clear mission and social impact';
      leadershipStyle = 'Supportive and protective, ensuring team safety and growth';
    } else if (coreTheme === 'Developmental Catalyst') {
      careers = ['Executive Coach', 'University Professor', 'Organizational Development', 'Training Director'];
      workEnvironment = 'Learning-focused environment with opportunities for innovation';
      leadershipStyle = 'Transformational leader who empowers others to reach their potential';
    } else if (coreTheme === 'Impactful Achiever') {
      careers = ['Corporate Executive', 'Management Consultant', 'Policy Advisor', 'Entrepreneur'];
      workEnvironment = 'Fast-paced, results-oriented organization with measurable outcomes';
      leadershipStyle = 'Goal-driven leader who inspires teams through tangible achievements';
    } else if (coreTheme === 'Excellence-Driven Professional') {
      careers = ['Senior Analyst', 'Quality Director', 'Strategy Consultant', 'Program Manager'];
      workEnvironment = 'High-standards organization that rewards expertise and precision';
      leadershipStyle = 'Detail-oriented leader who sets high expectations and leads by example';
    } else if (coreTheme === 'Independent Innovator') {
      careers = ['Startup Founder', 'R&D Director', 'UX Researcher', 'Product Manager'];
      workEnvironment = 'Autonomous, creative workspace that values experimentation';
      leadershipStyle = 'Visionary leader who champions new ideas and creative freedom';
    } else if (coreTheme === 'Stable Progress Builder') {
      careers = ['Operations Manager', 'Quality Assurance Lead', 'Program Director', 'Civil Engineer'];
      workEnvironment = 'Structured organization with clear growth pathways and steady improvement';
      leadershipStyle = 'Methodical leader who builds sustainable systems and processes';
    } else if (coreTheme === 'Connection-Centered Leader') {
      careers = ['HR Director', 'Community Manager', 'Social Worker', 'Mediator'];
      workEnvironment = 'People-first culture with emphasis on collaboration and relationships';
      leadershipStyle = 'Empathetic leader who builds strong teams through trust and connection';
    } else if (coreTheme === 'Continuous Learning Champion') {
      careers = ['University Professor', 'Training Director', 'Curriculum Designer', 'Research Scientist'];
      workEnvironment = 'Knowledge-driven organization that invests in continuous development';
      leadershipStyle = 'Growth-minded leader who fosters curiosity and lifelong learning';
    } else if (coreTheme === 'Stability-Focused Guardian') {
      careers = ['Financial Analyst', 'Compliance Officer', 'Risk Manager', 'Healthcare Administrator'];
      workEnvironment = 'Well-established organization with strong protocols and reliability';
      leadershipStyle = 'Dependable leader who prioritizes consistency and risk management';
    } else if (coreTheme === 'Community Impact Maker') {
      careers = ['Non-profit Director', 'Public Policy Analyst', 'Social Enterprise Manager', 'Community Organizer'];
      workEnvironment = 'Mission-driven organization focused on social change and community benefit';
      leadershipStyle = 'Purpose-driven leader who mobilizes people around shared social goals';
    } else {
      // Fallback for dynamically generated '[Theme] Advocate' themes
      careers = ['Project Manager', 'Business Analyst', 'Consultant', 'Team Lead'];
      workEnvironment = 'Collaborative environment with room for professional growth';
      leadershipStyle = 'Collaborative and adaptive leadership approach';
    }

    return { careers, workEnvironment, leadershipStyle };
  }

  // Position-Based Scoring System
  function calculateValueScore(valueId: string): number {
    // Find which bucket and position the value is in
    let totalPosition = 0;

    // Calculate position considering all buckets in order of importance
    const bucketOrder: LayoutBucket[] = ['very_important', 'important', 'somewhat_important', 'not_important'];

    for (const bucket of bucketOrder) {
      const bucketValues = layout[bucket];
      const indexInBucket = bucketValues.indexOf(valueId);

      if (indexInBucket !== -1) {
        // Found the value in this bucket
        totalPosition = getTotalPositionsBefore(bucket) + indexInBucket;
        break;
      }
    }

    // If value is not placed, return 0
    if (totalPosition === 0 && !isValuePlaced(valueId)) return 0;

    // Convert position to score: 1st position = 100, 2nd = ~96, etc.
    // Using formula: 100 - (position * 4) to get distributed scores
    return Math.max(1, 100 - (totalPosition * 4));
  }

  function getTotalPositionsBefore(bucket: LayoutBucket): number {
    const bucketOrder: LayoutBucket[] = ['very_important', 'important', 'somewhat_important', 'not_important'];
    const bucketIndex = bucketOrder.indexOf(bucket);

    let totalBefore = 0;
    for (let i = 0; i < bucketIndex; i++) {
      totalBefore += layout[bucketOrder[i]].length;
    }
    return totalBefore;
  }

  function isValuePlaced(valueId: string): boolean {
    return layoutBucketIds.some(bucket => layout[bucket].includes(valueId));
  }

  function getAllValueScores(): Record<string, number> {
    const scores: Record<string, number> = {};
    VALUES.forEach(value => {
      scores[value.id] = calculateValueScore(value.id);
    });
    return scores;
  }

  // Enhanced Theme Analysis Functions with Position-Based Scoring
  function analyzeValueThemes(): ThemeAnalysis {
    const themes: Record<string, { keywords: string[]; values: ThemeValue[] }> = {
      'Security & Stability': { keywords: ['security', 'safety', 'stable', 'protection', 'family'], values: [] },
      'Personal Growth & Development': { keywords: ['growth', 'wisdom', 'learning', 'development', 'improvement', 'authentic'], values: [] },
      'Social Impact & Recognition': { keywords: ['social', 'global', 'community', 'recognition', 'justice', 'contribution'], values: [] },
      'Achievement & Success': { keywords: ['accomplishment', 'success', 'achievement', 'excellence', 'innovation'], values: [] },
      'Relationships & Love': { keywords: ['love', 'friendship', 'relationship', 'connection', 'intimacy'], values: [] },
      'Freedom & Autonomy': { keywords: ['freedom', 'autonomy', 'independence', 'choice', 'liberation'], values: [] },
      'Pleasure & Comfort': { keywords: ['pleasure', 'comfort', 'enjoyment', 'satisfying', 'ease'], values: [] },
      'Adventure & Excitement': { keywords: ['exciting', 'adventure', 'stimulation', 'challenge', 'variety'], values: [] },
      'Peace & Harmony': { keywords: ['peace', 'harmony', 'tranquility', 'balance', 'contentment'], values: [] },
      'Spirituality & Meaning': { keywords: ['spirituality', 'meaning', 'purpose', 'transcendent', 'beauty'], values: [] },
    };

    const valueScores = getAllValueScores();

    layoutBucketIds.forEach(bucket => {
      const bucketValues = layout[bucket].map(id => byId[id]);

      bucketValues.forEach((value, indexInBucket) => {
        Object.values(themes).forEach(theme => {
          const matches = theme.keywords.some(keyword =>
            value.name.toLowerCase().includes(keyword) ||
            value.description.toLowerCase().includes(keyword)
          );

          if (matches) {
            const score = valueScores[value.id] || 0;
            theme.values.push({
              id: value.id,
              name: value.name,
              bucket,
              priority: score, // Now using position-based score instead of bucket score
            });
          }
        });
      });
    });

    // Calculate theme scores and rankings with new 100-point scale
    const themeScores = Object.entries(themes).map(([themeName, theme]) => ({
      name: themeName,
      values: theme.values,
      count: theme.values.length,
      totalScore: theme.values.reduce((sum, v) => sum + v.priority, 0),
      averageScore: theme.values.length > 0 ? theme.values.reduce((sum, v) => sum + v.priority, 0) / theme.values.length : 0,
      highPriorityCount: theme.values.filter(v => v.priority >= 70).length, // High priority = score >= 70
    })).filter(theme => theme.count > 0);

    // Sort by total score (most important first)
    const mostImportantThemes = themeScores
      .filter(theme => theme.averageScore >= 50) // Above 50 points average
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 5);

    const leastImportantThemes = themeScores
      .filter(theme => theme.averageScore < 50 && theme.count > 0) // Below 50 points average
      .sort((a, b) => a.totalScore - b.totalScore)
      .slice(0, 5);

    return { mostImportantThemes, leastImportantThemes, allThemes: themeScores };
  }

  function getThemeInsights(themeAnalysis: ThemeAnalysis | null): ThemeInsights | null {
    if (!themeAnalysis || themeAnalysis.mostImportantThemes.length === 0) return null;

    const { mostImportantThemes, leastImportantThemes } = themeAnalysis;

    // Generate insights based on theme combinations
    let profileInsight = '';
    let balanceInsight = '';

    const topThemeNames = mostImportantThemes.slice(0, 3).map(t => t.name);

    if (topThemeNames.includes('Security & Stability') && topThemeNames.includes('Personal Growth & Development')) {
      profileInsight = 'You seek growth within a stable foundation - a "Progressive Traditionalist" who values both security and development.';
    } else if (topThemeNames.includes('Social Impact & Recognition') && topThemeNames.includes('Achievement & Success')) {
      profileInsight = 'You aim to make a meaningful impact while achieving personal success - an "Impactful Achiever" driven by both contribution and accomplishment.';
    } else if (topThemeNames.includes('Freedom & Autonomy') && topThemeNames.includes('Personal Growth & Development')) {
      profileInsight = 'You prioritize independent growth and self-direction - a "Free Spirit" who values autonomy and continuous learning.';
    } else if (topThemeNames.includes('Security & Stability')) {
      profileInsight = 'You value stability and protection above all - a "Guardian" who prioritizes safety and reliability.';
    } else if (topThemeNames.includes('Social Impact & Recognition')) {
      profileInsight = 'You focus on making a difference in the world - a "Change Agent" driven by social contribution and recognition.';
    } else {
      profileInsight = `You have a unique blend of ${topThemeNames[0]} and ${topThemeNames[1] || 'other values'} - creating your distinctive value profile.`;
    }

    // Balance insights
    const hasComfort = leastImportantThemes.some(t => t.name === 'Pleasure & Comfort');
    const hasAdventure = leastImportantThemes.some(t => t.name === 'Adventure & Excitement');

    if (hasComfort && hasAdventure) {
      balanceInsight = 'You prioritize meaningful pursuits over comfort and excitement, showing focus on deeper values.';
    } else if (hasComfort) {
      balanceInsight = 'You choose purpose over comfort, indicating a willingness to sacrifice ease for meaningful goals.';
    } else if (hasAdventure) {
      balanceInsight = 'You prefer stability over thrill-seeking, showing a preference for predictable growth.';
    } else {
      balanceInsight = 'Your value system shows a balanced approach to different life priorities.';
    }

    return { profileInsight, balanceInsight };
  }

  const valuePatterns = analyzeValuePatterns();
  const personalityInsights = getPersonalityInsights(valuePatterns);
  const careerInsights = getCareerInsights(valuePatterns, personalityInsights);
  const themeAnalysis = analyzeValueThemes();
  const themeInsights = getThemeInsights(themeAnalysis);

  async function exportBoardPNG() {
    if (!boardRef.current) return;
    const dataUrl = await htmlToImage.toPng(boardRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
    const a = document.createElement('a');
    a.href = dataUrl; a.download = `${routeSet}_values_board.png`; a.click();
  }

  async function saveToServer() {
    const userId = user?.id ?? user?.email ?? undefined;
    if (!userId) { alert('Please sign in to save.'); return; }

    // BUG FIX #5: Validate minimum 3 values in "Very Important" before saving
    if (layout.very_important.length < 3) {
      alert('Please place at least 3 values in "Very Important" before saving.');
      return;
    }

    const payload = { user_id: userId, set: routeSet, layout, top3 };
    const res = await fetch('/api/discover/values/results', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) { alert('Save failed'); return; }

    alert('Saved successfully');

    // BUG FIX #3 + #4: Check completion status and update progress with percentage
    try {
      const sessionRes = await fetch('/api/discover/values/session');
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();

        // Count completed sets (including current save which may not be reflected yet)
        const completedSets = [
          sessionData.terminal_completed,
          sessionData.instrumental_completed,
          sessionData.work_completed,
        ].filter(Boolean).length;

        // The current save might not be reflected in the session data yet,
        // so we ensure at least 1 set is counted
        const effectiveCompleted = Math.max(completedSets, 1);
        const percent = Math.min(100, Math.round((effectiveCompleted / 3) * 100));

        // Update stage with percentage
        await updateStage(routeSet, percent);

        // If all 3 sets completed, mark module as complete
        if (sessionData.terminal_completed && sessionData.instrumental_completed && sessionData.work_completed) {
          await completeModule();
        }
      }
    } catch (err) {
      console.error('[Values] Error checking completion status:', err);
      // Fallback: still update stage without percentage
      updateStage(routeSet);

      // Check if all 3 value types are now complete → auto-complete module
      try {
        const sessionRes = await fetch('/api/discover/values/session');
        const sessionData = await sessionRes.json();
        if (sessionData.terminal_completed && sessionData.instrumental_completed && sessionData.work_completed) {
          await completeModule();
        }
      } catch (e) {
        console.error('[Values Set] Error checking completion:', e);
      }
    }
  }

  function clearBoard() {
    if (confirm('Are you sure you want to clear all your value placements? This will reset the board to start fresh.')) {
      setLayout(emptyLayout);
      setPalette(VALUES.map(v => v.id));
    }
  }

  return (
    <div className="min-h-screen">
      <header className="glass-panel sticky top-0 z-10 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-3 py-3">
          {/* Mobile-optimized header for iPhone 16 Pro */}
          <div className="flex items-center justify-between mb-2 sm:mb-0">
            <Link href="/discover/values" className="flex items-center space-x-2 text-gray-800 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Values</span>
              <span className="sm:hidden">Back</span>
            </Link>

            {/* Auth button - always visible */}
            <div className="flex items-center">
              {!isAuthenticated ? (
                <button onClick={signInWithGoogle} disabled={loading} className="flex items-center gap-1 px-2 py-1.5 text-xs border rounded hover:bg-gray-50 disabled:opacity-50">
                  <LogIn className="w-3 h-3" />
                  <span className="hidden sm:inline">Sign in with Google</span>
                  <span className="sm:hidden">Sign in</span>
                </button>
              ) : (
                <button onClick={signOut} disabled={loading} className="flex items-center gap-1 px-2 py-1.5 text-xs border rounded hover:bg-gray-50 disabled:opacity-50">
                  <LogOut className="w-3 h-3" />
                  <span className="hidden sm:inline">Sign out</span>
                  <span className="sm:hidden">Out</span>
                </button>
              )}
            </div>
          </div>

          {/* Action buttons - mobile-optimized row */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 sm:justify-end">
            <button onClick={clearBoard} className="flex items-center gap-1 px-2 py-1.5 text-xs border border-orange-300 text-orange-700 rounded hover:bg-orange-50">
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Clear</span>
            </button>
            <button onClick={saveToServer} className="flex items-center gap-1 px-2 py-1.5 text-xs bg-blue-600 text-white rounded">
              <Save className="w-3 h-3" />
              <span className="hidden sm:inline">Save</span>
            </button>
            <button onClick={exportBoardPNG} className="flex items-center gap-1 px-2 py-1.5 text-xs border rounded hover:bg-gray-50">
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">PNG</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold capitalize bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent font-outfit">
              {routeSet} Values — Categorize
            </h1>
            {layout.very_important.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm self-start sm:self-auto border border-primary-200">
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                In Progress
              </div>
            )}
          </div>
          <p className="text-gray-600 text-sm sm:text-base">Drag and drop values to organize them by importance and priority order</p>
        </div>

        {/* Enhanced User Instructions - Mobile Optimized */}
        <div className="mb-4 sm:mb-6 space-y-2 sm:space-y-3">
          <div className="glass-card p-3 sm:p-4 rounded-2xl border border-white/40">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-secondary-100 rounded-full flex items-center justify-center">
                <span className="text-secondary-600 font-bold text-xs sm:text-sm">📋</span>
              </div>
              <div>
                <h3 className="font-bold text-secondary-900 mb-1 sm:mb-2 text-sm sm:text-base font-outfit">Position-Based Scoring System</h3>
                <div className="text-xs sm:text-sm text-secondary-800 space-y-1 sm:space-y-2">
                  <p><strong>Individual Scores:</strong> Each value receives a unique score (1-100) based on its exact position across all categories.</p>
                  <p><strong>Within Categories:</strong> Top position in each box gets the highest score, with gradients showing priority levels.</p>
                  <p><strong>Score Display:</strong> See your score for each value in the top-right corner of each card.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-3 sm:p-4 rounded-2xl border border-white/40">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-accent-100 rounded-full flex items-center justify-center">
                <span className="text-accent-600 font-bold text-xs sm:text-sm">🎯</span>
              </div>
              <div>
                <h3 className="font-bold text-accent-900 mb-1 sm:mb-2 text-sm sm:text-base font-outfit">Strategic Positioning Tips</h3>
                <div className="text-xs sm:text-sm text-accent-800 space-y-1">
                  <p>• <strong>Order matters:</strong> Arrange items within each category by true priority</p>
                  <p>• <strong>Golden rings:</strong> #1 items in each category get special highlighting</p>
                  <p>• <strong>Gradient intensity:</strong> Stronger colors = higher priority within category</p>
                  <p>• <strong>Use "Clear" button</strong> to start fresh on any value set</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-700 flex items-center gap-2 glass-panel p-2 sm:p-3 rounded-xl border border-white/40">
            <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4 text-primary-600 flex-shrink-0" />
            <span className="text-xs sm:text-sm">When saved, your values classification with position-based scores will be stored for comprehensive analysis across all LifeCraft modules.</span>
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div ref={boardRef} className="grid grid-cols-1 gap-3 sm:gap-4 lg:gap-6 lg:grid-cols-4">
            {(['very_important', 'important', 'somewhat_important', 'not_important'] as const).map((bucket, bucketIndex) => {
              const bucketStyles = [
                'glass-panel border-secondary-200/50 bg-secondary-50/30',
                'glass-panel border-primary-200/50 bg-primary-50/30',
                'glass-panel border-accent-200/50 bg-accent-50/30',
                'glass-panel border-gray-200/50 bg-gray-50/30'
              ];
              const headerColors = [
                'text-secondary-900',
                'text-primary-900',
                'text-accent-900',
                'text-gray-900'
              ];
              const countColors = [
                'bg-secondary-600 text-white',
                'bg-primary-600 text-white',
                'bg-accent-600 text-white',
                'bg-gray-600 text-white'
              ];
              const dragOverColors = [
                'ring-secondary-400 border-secondary-400 bg-secondary-50',
                'ring-primary-400 border-primary-400 bg-primary-50',
                'ring-accent-400 border-accent-400 bg-accent-50',
                'ring-gray-400 border-gray-400 bg-gray-50'
              ];
              return (
                <Droppable key={bucket} droppableId={bucket}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`order-1 ${bucketStyles[bucketIndex]} p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 min-h-[200px] sm:min-h-[240px] flex flex-col lg:order-1 transition-all duration-200 hover:shadow-lg ${snapshot.isDraggingOver
                          ? (layout[bucket] as string[]).length >= 7
                            ? 'ring-4 ring-red-400 border-red-400 bg-red-50 scale-105 shadow-2xl'
                            : `ring-4 ring-opacity-50 ${dragOverColors[bucketIndex]} scale-105 shadow-2xl`
                          : ''
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <h2 className={`font-bold text-sm sm:text-base ${headerColors[bucketIndex]}`}>
                          {bucket.replace('_', ' ').replace('_', ' ').replace(/^./, (c) => c.toUpperCase())}
                        </h2>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${countColors[bucketIndex]} ${(layout[bucket] as string[]).length >= 7 ? 'ring-2 ring-red-400' : ''
                          }`}>
                          {(layout[bucket] as string[]).length}/7
                        </span>
                      </div>
                      <div className="flex-1">
                        {(layout[bucket] as string[]).map((id, index) => {
                          // Position-based styling - higher position = stronger gradient
                          const totalPosition = getTotalPositionsBefore(bucket) + index;
                          const score = calculateValueScore(id);
                          const isTopRank = index === 0;

                          // Generate position-based styling
                          const positionStyles = [
                            // Very Important bucket gradients (Secondary - Violet)
                            ['bg-gradient-to-r from-secondary-100 to-secondary-200 border-secondary-300 shadow-secondary-100/50', 'bg-gradient-to-r from-secondary-50 to-secondary-100 border-secondary-200', 'bg-gradient-to-r from-secondary-50/50 to-secondary-50 border-secondary-100'],
                            // Important bucket gradients (Primary - Teal)
                            ['bg-gradient-to-r from-primary-100 to-primary-200 border-primary-300 shadow-primary-100/50', 'bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200', 'bg-gradient-to-r from-primary-50/50 to-primary-50 border-primary-100'],
                            // Somewhat Important gradients (Accent - Rose)
                            ['bg-gradient-to-r from-accent-100 to-accent-200 border-accent-300 shadow-accent-100/50', 'bg-gradient-to-r from-accent-50 to-accent-100 border-accent-200', 'bg-gradient-to-r from-accent-50/50 to-accent-50 border-accent-100'],
                            // Not Important gradients (Gray)
                            ['bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 shadow-gray-100/50', 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200', 'bg-gradient-to-r from-gray-25 to-gray-50 border-gray-100']
                          ];

                          const intensityLevel = index < 2 ? 0 : index < 4 ? 1 : 2;
                          const gradientStyle = positionStyles[bucketIndex]?.[intensityLevel] || 'bg-white border-gray-200';

                          return (
                            <Draggable key={id} draggableId={id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`${gradientStyle} rounded-md sm:rounded-lg p-2 sm:p-2.5 mb-1.5 sm:mb-2 shadow-sm hover:shadow-md transition-all duration-200 cursor-move relative ${isTopRank ? 'ring-2 ring-yellow-300 ring-opacity-70' : ''
                                    }`}
                                >
                                  {isTopRank && (
                                    <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                                      1
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="font-semibold text-xs sm:text-sm text-gray-900 leading-tight">{byId[id].name}</div>
                                    <div className="text-xs font-mono text-gray-500 bg-white/70 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded">
                                      {score}
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-600 leading-relaxed hidden sm:block">{byId[id].description}</div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              );
            })}

            <Droppable droppableId="palette">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`order-2 glass-panel p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 min-h-[280px] sm:min-h-[320px] lg:order-2 lg:col-span-4 shadow-lg transition-all duration-200 ${snapshot.isDraggingOver
                      ? 'border-primary-400 bg-primary-50/90 ring-4 ring-primary-300 ring-opacity-50 scale-105 shadow-2xl'
                      : 'border-white/40'
                    }`}
                >
                  <div className="mb-3 sm:mb-4">
                    <h2 className="font-bold text-base sm:text-lg text-gray-900 mb-1 sm:mb-2">Values Library</h2>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Drag any value into the importance buckets above. Rearrange cards whenever you change your mind.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2">
                    {palette.map((id, index) => (
                      <Draggable key={id} draggableId={id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`
                              border rounded-md sm:rounded-lg p-2 sm:p-2.5 bg-gradient-to-br from-white to-gray-50
                              hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-move
                              ${snapshot.isDragging ? 'shadow-2xl scale-105 rotate-2 opacity-90' : 'shadow-sm'}
                            `}
                          >
                            <div className="font-semibold text-xs sm:text-sm text-gray-900 mb-1">{byId[id].name}</div>
                            <div className="text-xs text-gray-600 line-clamp-2 hidden sm:block">{byId[id].description}</div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </DragDropContext>

        <section className="mt-8 bg-white/90 backdrop-blur-sm rounded-xl border-2 border-gray-200 p-6 shadow-lg">
          <h3 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              📊
            </span>
            Values Profile Analysis
          </h3>

          {layout.very_important.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg mb-2">Start categorizing your values to see your personalized analysis!</p>
              <p className="text-sm">Drag values from the library into the importance categories above.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Core Theme */}
              {personalityInsights && (
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
                  <h4 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2">
                    🎯 Your Core Value Theme
                  </h4>
                  <div className="text-2xl font-bold text-purple-800 mb-2">&ldquo;{personalityInsights.coreTheme}&rdquo;</div>
                  <p className="text-gray-700 text-sm">
                    Based on your value priorities, you embody the characteristics of a {personalityInsights.coreTheme.toLowerCase()}.
                  </p>
                </div>
              )}

              {/* Theme Analysis Section */}
              {themeAnalysis && themeAnalysis.mostImportantThemes.length > 0 && (
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {/* Most Important Themes */}
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                    <h4 className="font-bold mb-4 text-emerald-900 flex items-center gap-2">
                      📈 Most Important Value Themes
                    </h4>
                    <div className="space-y-3">
                      {themeAnalysis.mostImportantThemes.slice(0, 4).map((theme, index) => (
                        <div key={theme.name} className="flex items-start gap-3">
                          <span className="flex items-center justify-center w-8 h-8 bg-emerald-600 text-white rounded-full font-bold text-sm shrink-0">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <div className="font-semibold text-emerald-900 text-sm mb-1">{theme.name}</div>
                            <div className="text-xs text-emerald-700 mb-2">
                              {theme.count} value{theme.count > 1 ? 's' : ''} • Total: {Math.round(theme.totalScore)} • Avg: {Math.round(theme.averageScore)}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {theme.values.slice(0, 3).map((value) => (
                                <span key={value.id} className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs">
                                  {value.name}
                                </span>
                              ))}
                              {theme.values.length > 3 && (
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs">
                                  +{theme.values.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Least Important Themes */}
                  <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-6 border border-slate-200">
                    <h4 className="font-bold mb-4 text-slate-900 flex items-center gap-2">
                      📉 Least Important Value Themes
                    </h4>
                    {themeAnalysis.leastImportantThemes.length > 0 ? (
                      <div className="space-y-3">
                        {themeAnalysis.leastImportantThemes.slice(0, 4).map((theme, index) => (
                          <div key={theme.name} className="flex items-start gap-3">
                            <span className="flex items-center justify-center w-8 h-8 bg-slate-500 text-white rounded-full font-bold text-sm shrink-0">
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <div className="font-semibold text-slate-900 text-sm mb-1">{theme.name}</div>
                              <div className="text-xs text-slate-600 mb-2">
                                {theme.count} value{theme.count > 1 ? 's' : ''} • Total: {Math.round(theme.totalScore)} • Avg: {Math.round(theme.averageScore)}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {theme.values.slice(0, 3).map((value) => (
                                  <span key={value.id} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                                    {value.name}
                                  </span>
                                ))}
                                {theme.values.length > 3 && (
                                  <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                                    +{theme.values.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-600 text-sm italic">
                        All your themes are rated as important - you have a broad value appreciation.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Theme Insights */}
              {themeInsights && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200 mb-6">
                  <h4 className="font-bold mb-4 text-indigo-900 flex items-center gap-2">
                    🔍 Value Profile Insights
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-semibold text-indigo-800 mb-2">Your Unique Profile:</h5>
                      <p className="text-indigo-700 text-sm leading-relaxed">{themeInsights.profileInsight}</p>
                    </div>
                    <div>
                      <h5 className="font-semibold text-indigo-800 mb-2">Balance & Priorities:</h5>
                      <p className="text-indigo-700 text-sm leading-relaxed">{themeInsights.balanceInsight}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Career Alignment */}
              {careerInsights && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 mb-6">
                  <h4 className="font-bold mb-4 text-green-900 flex items-center gap-2">
                    💼 Career Alignment
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold text-green-800 block mb-2">Recommended Fields:</span>
                      <div className="flex flex-wrap gap-2">
                        {careerInsights.careers.slice(0, 4).map((career, index) => (
                          <span key={index} className="px-3 py-1 bg-green-100 rounded-lg text-green-900 text-sm">
                            {career}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="font-semibold text-green-800 block mb-2">Leadership Style:</span>
                      <p className="text-green-700">{careerInsights.leadershipStyle}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Growth Recommendations */}
              {valuePatterns && (
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                  <h4 className="font-bold mb-4 text-orange-900 flex items-center gap-2">
                    🌱 Growth Opportunities
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h5 className="font-semibold text-orange-800 mb-2">Leverage Your Strengths:</h5>
                      <ul className="space-y-1 text-orange-700">
                        {valuePatterns.securityCount > 0 && (
                          <li>• Build on your natural sense of responsibility and reliability</li>
                        )}
                        {valuePatterns.socialCount > 0 && (
                          <li>• Expand your network and social impact initiatives</li>
                        )}
                        {valuePatterns.growthCount > 0 && (
                          <li>• Pursue continuous learning and skill development</li>
                        )}
                        {valuePatterns.achievementCount > 0 && (
                          <li>• Set ambitious goals and track your progress</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-semibold text-orange-800 mb-2">Areas to Develop:</h5>
                      <ul className="space-y-1 text-orange-700">
                        {valuePatterns.securityCount === 0 && (
                          <li>• Consider building more stability in your approach</li>
                        )}
                        {valuePatterns.socialCount === 0 && (
                          <li>• Explore opportunities for community engagement</li>
                        )}
                        {valuePatterns.growthCount === 0 && (
                          <li>• Invest time in personal and professional development</li>
                        )}
                        <li>• Balance competing priorities with your core values</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
