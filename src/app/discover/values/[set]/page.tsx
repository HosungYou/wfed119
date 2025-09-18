'use client';

import React, { useMemo, useRef, useState, useEffect, use } from 'react';
import Link from 'next/link';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { ArrowLeft, Save, Download, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import * as htmlToImage from 'html-to-image';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

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

  const { data: session, status } = useSession();
  const [palette, setPalette] = useState<string[]>([]);
  const [layout, setLayout] = useState<Layout>(emptyLayout);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setPalette(VALUES.map(v => v.id)); setLayout(emptyLayout); }, [VALUES]);

  // Load saved from server if available
  useEffect(() => {
    const userId = session?.user?.email || (session as any)?.user?.id;
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
      .catch(() => {});
  }, [session, routeSet, VALUES]);

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
    } else {
      const arr = (nextLayout[sourceId as keyof Layout] as string[]).filter(x => x !== draggableId);
      (nextLayout[sourceId as keyof Layout] as string[]) = arr;
    }

    // Add to dest
    if (destId === 'palette') {
      setPalette(prev => { const arr = [...prev]; arr.splice(destination.index, 0, draggableId); return arr; });
      // Ensure layout reflects removal from the source bucket
      setLayout(nextLayout);
    } else {
      // Check if destination bucket has room (max 7 items)
      const destArray = nextLayout[destId as keyof Layout] as string[];
      if (destArray.length >= 7) {
        // Bucket is full, don't allow the drop
        return;
      }

      const arr = [...destArray];
      arr.splice(destination.index, 0, draggableId);
      (nextLayout[destId as keyof Layout] as string[]) = arr;
      setLayout(nextLayout);
    }
  }

  const counts = [layout.very_important.length, layout.important.length, layout.somewhat_important.length, layout.not_important.length];
  const top3 = layout.very_important.slice(0, 3).map(id => byId[id]?.name || id);
  const chartData = { labels: ['Very Important', 'Important', 'Somewhat Important', 'Not Important'], datasets: [{ label: 'Count', data: counts, backgroundColor: ['#7c3aed', '#2563eb', '#10b981', '#9ca3af'] }] };

  // Value Analysis Functions
  function analyzeValuePatterns() {
    const veryImportantValues = layout.very_important.map(id => byId[id]);
    const notImportantValues = layout.not_important.map(id => byId[id]);

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

  function getPersonalityInsights(patterns: any) {
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

    // Core theme
    if (securityCount > 0 && socialCount > 0) {
      coreTheme = 'Responsible Guardian';
    } else if (socialCount > 0 && growthCount > 0) {
      coreTheme = 'Inspiring Mentor';
    } else if (achievementCount > 0 && socialCount > 0) {
      coreTheme = 'Influential Leader';
    } else if (growthCount > 0 && securityCount > 0) {
      coreTheme = 'Thoughtful Strategist';
    } else if (securityCount >= 2) {
      coreTheme = 'Reliable Protector';
    } else if (socialCount >= 2) {
      coreTheme = 'Community Builder';
    } else if (growthCount >= 2) {
      coreTheme = 'Independent Learner';
    } else {
      coreTheme = 'Balanced Individual';
    }

    return { mbtiType, enneagramType, coreTheme };
  }

  function getCareerInsights(patterns: any, personality: any) {
    if (!patterns || !personality) return null;

    const { securityCount, socialCount, growthCount, achievementCount } = patterns;
    const { coreTheme } = personality;

    let careers: string[] = [];
    let workEnvironment = '';
    let leadershipStyle = '';

    if (coreTheme === 'Responsible Guardian') {
      careers = ['Government Administrator', 'Healthcare Manager', 'Non-profit Director', 'Education Coordinator'];
      workEnvironment = 'Stable organization with clear mission and social impact';
      leadershipStyle = 'Supportive and protective, ensuring team safety and growth';
    } else if (coreTheme === 'Inspiring Mentor') {
      careers = ['Executive Coach', 'University Professor', 'Organizational Development', 'Training Director'];
      workEnvironment = 'Learning-focused environment with opportunities for innovation';
      leadershipStyle = 'Transformational leader who empowers others to reach their potential';
    } else if (coreTheme === 'Influential Leader') {
      careers = ['Corporate Executive', 'Management Consultant', 'Policy Advisor', 'Entrepreneur'];
      workEnvironment = 'Fast-paced, results-oriented organization with public recognition';
      leadershipStyle = 'Visionary leader focused on achieving ambitious goals';
    } else {
      careers = ['Project Manager', 'Business Analyst', 'Consultant', 'Team Lead'];
      workEnvironment = 'Collaborative environment with room for professional growth';
      leadershipStyle = 'Collaborative and adaptive leadership approach';
    }

    return { careers, workEnvironment, leadershipStyle };
  }

  // Enhanced Theme Analysis Functions
  function analyzeValueThemes() {
    const allBuckets = ['very_important', 'important', 'somewhat_important', 'not_important'] as const;

    const themes = {
      'Security & Stability': {
        keywords: ['security', 'safety', 'stable', 'protection', 'family'],
        values: [] as { id: string; name: string; bucket: string; priority: number }[]
      },
      'Personal Growth & Development': {
        keywords: ['growth', 'wisdom', 'learning', 'development', 'improvement', 'authentic'],
        values: [] as { id: string; name: string; bucket: string; priority: number }[]
      },
      'Social Impact & Recognition': {
        keywords: ['social', 'global', 'community', 'recognition', 'justice', 'contribution'],
        values: [] as { id: string; name: string; bucket: string; priority: number }[]
      },
      'Achievement & Success': {
        keywords: ['accomplishment', 'success', 'achievement', 'excellence', 'innovation'],
        values: [] as { id: string; name: string; bucket: string; priority: number }[]
      },
      'Relationships & Love': {
        keywords: ['love', 'friendship', 'relationship', 'connection', 'intimacy'],
        values: [] as { id: string; name: string; bucket: string; priority: number }[]
      },
      'Freedom & Autonomy': {
        keywords: ['freedom', 'autonomy', 'independence', 'choice', 'liberation'],
        values: [] as { id: string; name: string; bucket: string; priority: number }[]
      },
      'Pleasure & Comfort': {
        keywords: ['pleasure', 'comfort', 'enjoyment', 'satisfying', 'ease'],
        values: [] as { id: string; name: string; bucket: string; priority: number }[]
      },
      'Adventure & Excitement': {
        keywords: ['exciting', 'adventure', 'stimulation', 'challenge', 'variety'],
        values: [] as { id: string; name: string; bucket: string; priority: number }[]
      },
      'Peace & Harmony': {
        keywords: ['peace', 'harmony', 'tranquility', 'balance', 'contentment'],
        values: [] as { id: string; name: string; bucket: string; priority: number }[]
      },
      'Spirituality & Meaning': {
        keywords: ['spirituality', 'meaning', 'purpose', 'transcendent', 'beauty'],
        values: [] as { id: string; name: string; bucket: string; priority: number }[]
      }
    };

    // Priority mapping (higher number = more important)
    const priorityMap = { very_important: 4, important: 3, somewhat_important: 2, not_important: 1 };

    // Analyze each bucket
    allBuckets.forEach(bucket => {
      const bucketValues = layout[bucket].map(id => byId[id]);

      bucketValues.forEach(value => {
        // Find matching themes for this value
        Object.entries(themes).forEach(([themeName, theme]) => {
          const matches = theme.keywords.some(keyword =>
            value.name.toLowerCase().includes(keyword) ||
            value.description.toLowerCase().includes(keyword)
          );

          if (matches) {
            theme.values.push({
              id: value.id,
              name: value.name,
              bucket,
              priority: priorityMap[bucket]
            });
          }
        });
      });
    });

    // Calculate theme scores and rankings
    const themeScores = Object.entries(themes).map(([themeName, theme]) => ({
      name: themeName,
      values: theme.values,
      count: theme.values.length,
      totalScore: theme.values.reduce((sum, v) => sum + v.priority, 0),
      averageScore: theme.values.length > 0 ? theme.values.reduce((sum, v) => sum + v.priority, 0) / theme.values.length : 0,
      highPriorityCount: theme.values.filter(v => v.priority >= 3).length
    })).filter(theme => theme.count > 0); // Only include themes with values

    // Sort by total score (most important first)
    const mostImportantThemes = themeScores
      .filter(theme => theme.averageScore >= 2.5)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 5);

    const leastImportantThemes = themeScores
      .filter(theme => theme.averageScore < 2.5)
      .sort((a, b) => a.totalScore - b.totalScore)
      .slice(0, 5);

    return { mostImportantThemes, leastImportantThemes, allThemes: themeScores };
  }

  function getThemeInsights(themeAnalysis: any) {
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
  const chartRef = useRef<any>(null);

  function exportChartPNG() {
    const chart = chartRef.current;
    if (!chart) return;
    const url = chart.toBase64Image();
    const a = document.createElement('a');
    a.href = url; a.download = `${routeSet}_values_summary.png`; a.click();
  }

  async function exportBoardPNG() {
    if (!boardRef.current) return;
    const dataUrl = await htmlToImage.toPng(boardRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
    const a = document.createElement('a');
    a.href = dataUrl; a.download = `${routeSet}_values_board.png`; a.click();
  }

  async function saveToServer() {
    const userId = (session as any)?.user?.id || session?.user?.email;
    if (!userId) { alert('Please sign in to save.'); return; }
    const payload = { user_id: userId, set: routeSet, layout, top3 };
    const res = await fetch('/api/discover/values/results', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) alert('Save failed'); else alert('Saved successfully');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/discover/values" className="flex items-center space-x-2 text-gray-800 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Values</span>
          </Link>
          <div className="flex items-center gap-2">
            {status !== 'authenticated' ? (
              <button onClick={() => signIn('google')} className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-50"><LogIn className="w-4 h-4"/>Sign in with Google</button>
            ) : (
              <button onClick={() => signOut()} className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-50"><LogOut className="w-4 h-4"/>Sign out</button>
            )}
            <button onClick={saveToServer} className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg"><Save className="w-4 h-4"/>Save</button>
            <button onClick={exportChartPNG} className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-50"><Download className="w-4 h-4"/>Chart PNG</button>
            <button onClick={exportBoardPNG} className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-50"><Download className="w-4 h-4"/>Board PNG</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 capitalize bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {routeSet} Values — Categorize
          </h1>
          <p className="text-gray-600">Drag and drop values to organize them by importance</p>
        </div>

        <div className="mb-4 text-xs text-gray-700 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <ShieldCheck className="w-4 h-4 text-blue-600"/>
          When saved, your values classification (set, placements, Top 3) will be stored in the database for future module analysis.
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div ref={boardRef} className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {(['very_important','important','somewhat_important','not_important'] as const).map((bucket, bucketIndex) => {
              const bucketStyles = [
                'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300',
                'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300',
                'bg-gradient-to-br from-green-50 to-green-100 border-green-300',
                'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300'
              ];
              const headerColors = [
                'text-purple-900',
                'text-blue-900',
                'text-green-900',
                'text-gray-900'
              ];
              const countColors = [
                'bg-purple-600 text-white',
                'bg-blue-600 text-white',
                'bg-green-600 text-white',
                'bg-gray-600 text-white'
              ];
              const dragOverColors = [
                'ring-purple-400 border-purple-400 bg-purple-50',
                'ring-blue-400 border-blue-400 bg-blue-50',
                'ring-green-400 border-green-400 bg-green-50',
                'ring-gray-400 border-gray-400 bg-gray-50'
              ];
              return (
              <Droppable key={bucket} droppableId={bucket}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`order-2 ${bucketStyles[bucketIndex]} p-4 rounded-xl border-2 min-h-[240px] flex flex-col lg:order-1 transition-all duration-200 hover:shadow-lg ${
                      snapshot.isDraggingOver
                        ? (layout[bucket] as string[]).length >= 7
                          ? 'ring-4 ring-red-400 border-red-400 bg-red-50 scale-105 shadow-2xl'
                          : `ring-4 ring-opacity-50 ${dragOverColors[bucketIndex]} scale-105 shadow-2xl`
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h2 className={`font-bold ${headerColors[bucketIndex]}`}>
                        {bucket.replace('_',' ').replace('_',' ').replace(/^./, (c) => c.toUpperCase())}
                      </h2>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${countColors[bucketIndex]} ${
                        (layout[bucket] as string[]).length >= 7 ? 'ring-2 ring-red-400' : ''
                      }`}>
                        {(layout[bucket] as string[]).length}/7
                      </span>
                    </div>
                    <div className="flex-1">
                      {(layout[bucket] as string[]).map((id, index) => (
                        <Draggable key={id} draggableId={id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="border border-gray-200 rounded-lg p-2.5 mb-2 bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-move"
                            >
                              <div className="font-semibold text-sm text-gray-900 mb-1">{byId[id].name}</div>
                              <div className="text-xs text-gray-600 leading-relaxed">{byId[id].description}</div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            );})}

            <Droppable droppableId="palette">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`order-1 bg-white/90 backdrop-blur-sm p-4 rounded-xl border-2 min-h-[320px] lg:order-2 lg:col-span-4 shadow-lg transition-all duration-200 ${
                    snapshot.isDraggingOver
                      ? 'border-blue-400 bg-blue-50/90 ring-4 ring-blue-300 ring-opacity-50 scale-105 shadow-2xl'
                      : 'border-gray-300'
                  }`}
                >
                  <div className="mb-4">
                    <h2 className="font-bold text-lg text-gray-900 mb-2">Values Library</h2>
                    <p className="text-sm text-gray-600">
                      Drag any value into the importance buckets above. Rearrange cards whenever you change your mind.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {palette.map((id, index) => (
                      <Draggable key={id} draggableId={id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`
                              border rounded-lg p-2.5 bg-gradient-to-br from-white to-gray-50
                              hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-move
                              ${snapshot.isDragging ? 'shadow-2xl scale-105 rotate-2 opacity-90' : 'shadow-sm'}
                            `}
                          >
                            <div className="font-semibold text-sm text-gray-900 mb-1">{byId[id].name}</div>
                            <div className="text-xs text-gray-600 line-clamp-2">{byId[id].description}</div>
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
                  <div className="text-2xl font-bold text-purple-800 mb-2">"{personalityInsights.coreTheme}"</div>
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
                              {theme.count} value{theme.count > 1 ? 's' : ''} • Score: {theme.totalScore}
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
                                {theme.count} value{theme.count > 1 ? 's' : ''} • Score: {theme.totalScore}
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

              <div className="grid md:grid-cols-2 gap-6">
                {/* Personality Insights */}
                <div className="space-y-4">
                  {personalityInsights && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-bold mb-3 text-blue-900 flex items-center gap-2">
                        🧠 Personality Insights
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="font-semibold text-blue-800">MBTI Tendency:</span>
                          <span className="ml-2 px-2 py-1 bg-blue-100 rounded text-blue-900 font-medium">
                            {personalityInsights.mbtiType}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-blue-800">Enneagram:</span>
                          <span className="ml-2 px-2 py-1 bg-blue-100 rounded text-blue-900 font-medium">
                            {personalityInsights.enneagramType}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {careerInsights && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                      <h4 className="font-bold mb-3 text-green-900 flex items-center gap-2">
                        💼 Career Alignment
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="font-semibold text-green-800 block mb-1">Recommended Fields:</span>
                          <div className="flex flex-wrap gap-1">
                            {careerInsights.careers.slice(0, 3).map((career, index) => (
                              <span key={index} className="px-2 py-1 bg-green-100 rounded text-green-900 text-xs">
                                {career}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="font-semibold text-green-800 block mb-1">Leadership Style:</span>
                          <p className="text-green-700">{careerInsights.leadershipStyle}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

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
