'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, ArrowLeft, Search, Sparkles, Target, Zap, Plus, X } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { ModuleShell, ModuleCard, ModuleButton, ActivitySidebar, createActivitiesFromSteps } from '@/components/modules';

const STEPS = [
  { id: 'step1', label: 'Values Summary', labelKo: '가치관 요약' },
  { id: 'step2', label: 'Mission Components', labelKo: '사명 구성요소' },
  { id: 'step3', label: 'Mission Drafting', labelKo: '사명 작성' },
  { id: 'step4', label: 'Reflection', labelKo: '성찰' },
];

const TARGET_WORDS = [
  'Education', 'Diversity', 'Public Policy', 'Cybersecurity', 'Accessibility',
  'Affordable Housing', 'Aging Population', 'Agriculture', 'AI Ethics',
  'Animal Rights', 'Anti-Bullying', 'Art', 'Bioethics', 'Childcare',
  "Children's Rights", 'Civil Liberties', 'Clean Energy', 'Climate Adaptation',
  'Climate Change', 'Climate Resilience', 'Community', 'Conservation',
  'Corporate Responsibility', 'Criminal Justice Reform', 'Culture',
  'Data Privacy', 'Democracy', 'Determination', 'Digital Divide',
  'Digital Literacy', 'Digital Rights', 'Drug Abuse', 'Economy',
  'Elder Care', 'Empowerment', 'Energy', 'Entrepreneurship', 'Environment',
  'Equality', 'Exploration', 'Family Support', 'Financial Literacy',
  'Food Security', 'Freedom', 'Gender Equality', 'Generosity', 'Global Health',
  'Green Infrastructure', 'Growth', 'Health', 'Homelessness', 'Human Rights',
  'Human Trafficking', 'Humanitarian Aid', 'Immigration', 'Inclusion',
  'Income Inequality', 'Indigenous Rights', 'Innovation', 'Internet Access',
  'Job Creation', 'Justice', 'LGBTQ+ Rights', 'Literacy', 'Maternal Health',
  'Media Literacy', 'Mental Health', 'Mental Wellness', 'National Defense',
  'Nutrition', 'Ocean Conservation', 'Patient Care', 'Peace',
  'Physical Fitness', 'Public Education', 'Public Health', 'Public Transit',
  'Racial Equality', 'Refugees', 'Renewable Energy', 'Reproductive Rights',
  'Research', 'Rural Development', 'Safety', 'Science',
  'Social Entrepreneurship', 'Social Services', 'Sports', 'Sustainability',
  'Technology', 'Trade', 'Urban Planning', 'Vaccine Equity', 'Veterans',
  'Water Conservation', 'Wildlife', "Women's Rights",
  'Workforce Development', 'Youth Empowerment',
];

const VERB_WORDS = [
  'Achieve', 'Accelerate', 'Advocate', 'Align', 'Analyze', 'Balance', 'Broaden',
  'Build', 'Catalyze', 'Challenge', 'Champion', 'Change', 'Clarify', 'Collaborate',
  'Commit', 'Communicate', 'Compare', 'Compete', 'Connect', 'Conserve',
  'Construct', 'Contribute', 'Coordinate', 'Create', 'Cultivate', 'Define',
  'Deliver', 'Demonstrate', 'Design', 'Develop', 'Direct', 'Discover', 'Drive',
  'Educate', 'Embrace', 'Empower', 'Encourage', 'Enhance', 'Ensure', 'Envision',
  'Establish', 'Evaluate', 'Exceed', 'Execute', 'Expand', 'Facilitate', 'Foster',
  'Generate', 'Guide', 'Harness', 'Improve', 'Increase', 'Influence', 'Innovate',
  'Inspire', 'Integrate', 'Lead', 'Learn', 'Leverage', 'Maintain', 'Manage',
  'Maximize', 'Measure', 'Motivate', 'Negotiate', 'Nurture', 'Optimize',
  'Organize', 'Participate', 'Perform', 'Promote', 'Provide', 'Pursue', 'Realize',
  'Recognize', 'Refine', 'Regulate', 'Reinforce', 'Relate', 'Represent', 'Respect',
  'Respond', 'Restore', 'Revolutionize', 'Serve', 'Share', 'Simplify', 'Solve',
  'Strengthen', 'Support', 'Sustain', 'Synthesize', 'Transform', 'Unify',
  'Utilize', 'Validate', 'Value', 'Verify', 'Work',
];

interface AIRecommendation {
  word: string;
  reason: string;
}

export default function MissionStep2() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Target state
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [customTargets, setCustomTargets] = useState<string[]>([]);
  const [targetSearch, setTargetSearch] = useState('');
  const [newCustomTarget, setNewCustomTarget] = useState('');

  // Verb state
  const [selectedVerbs, setSelectedVerbs] = useState<string[]>([]);
  const [customVerbs, setCustomVerbs] = useState<string[]>([]);
  const [verbSearch, setVerbSearch] = useState('');
  const [newCustomVerb, setNewCustomVerb] = useState('');

  // AI recommendations
  const [aiTargets, setAiTargets] = useState<AIRecommendation[]>([]);
  const [aiVerbs, setAiVerbs] = useState<AIRecommendation[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTargetExplanation, setAiTargetExplanation] = useState('');
  const [aiVerbExplanation, setAiVerbExplanation] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch('/api/discover/mission/session');
      const data = await res.json();

      if (data.current_step < 2) {
        router.push('/discover/mission/step1');
        return;
      }

      // Restore selections
      if (data.selected_targets?.length) setSelectedTargets(data.selected_targets);
      if (data.selected_verbs?.length) setSelectedVerbs(data.selected_verbs);
      if (data.custom_targets?.length) setCustomTargets(data.custom_targets);
      if (data.custom_verbs?.length) setCustomVerbs(data.custom_verbs);

      setLoading(false);
      loadAIRecommendations();
    } catch (error) {
      console.error('[Mission Step 2] Error:', error);
      setLoading(false);
    }
  }

  async function loadAIRecommendations() {
    setAiLoading(true);
    try {
      // Get context for AI
      const contextRes = await fetch('/api/discover/mission/context');
      const context = await contextRes.json();

      const sessionRes = await fetch('/api/discover/mission/session');
      const session = await sessionRes.json();

      const res = await fetch('/api/discover/mission/ai-components', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          values: session.values_used || [],
          enneagram: context.enneagram,
          lifeThemes: context.lifeThemes?.themes || [],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.targets) setAiTargets(data.targets);
        if (data.verbs) setAiVerbs(data.verbs);
        if (data.targetExplanation) setAiTargetExplanation(data.targetExplanation);
        if (data.verbExplanation) setAiVerbExplanation(data.verbExplanation);
      }
    } catch (error) {
      console.error('[Mission Step 2] AI recommendations error:', error);
    } finally {
      setAiLoading(false);
    }
  }

  function toggleTarget(word: string) {
    setSelectedTargets(prev => {
      if (prev.includes(word)) return prev.filter(w => w !== word);
      if (prev.length + customTargets.length >= 5) return prev;
      return [...prev, word];
    });
  }

  function toggleVerb(word: string) {
    setSelectedVerbs(prev => {
      if (prev.includes(word)) return prev.filter(w => w !== word);
      if (prev.length + customVerbs.length >= 5) return prev;
      return [...prev, word];
    });
  }

  function addCustomTarget() {
    const trimmed = newCustomTarget.trim();
    if (!trimmed) return;
    if (selectedTargets.length + customTargets.length >= 5) return;
    if (customTargets.includes(trimmed)) return;
    setCustomTargets(prev => [...prev, trimmed]);
    setNewCustomTarget('');
  }

  function removeCustomTarget(word: string) {
    setCustomTargets(prev => prev.filter(w => w !== word));
  }

  function addCustomVerb() {
    const trimmed = newCustomVerb.trim();
    if (!trimmed) return;
    if (selectedVerbs.length + customVerbs.length >= 5) return;
    if (customVerbs.includes(trimmed)) return;
    setCustomVerbs(prev => [...prev, trimmed]);
    setNewCustomVerb('');
  }

  function removeCustomVerb(word: string) {
    setCustomVerbs(prev => prev.filter(w => w !== word));
  }

  const aiTargetWords = useMemo(() => aiTargets.map(t => t.word), [aiTargets]);
  const aiVerbWords = useMemo(() => aiVerbs.map(v => v.word), [aiVerbs]);

  const filteredTargets = useMemo(() => {
    if (!targetSearch.trim()) return TARGET_WORDS;
    const search = targetSearch.toLowerCase();
    return TARGET_WORDS.filter(w => w.toLowerCase().includes(search));
  }, [targetSearch]);

  const filteredVerbs = useMemo(() => {
    if (!verbSearch.trim()) return VERB_WORDS;
    const search = verbSearch.toLowerCase();
    return VERB_WORDS.filter(w => w.toLowerCase().includes(search));
  }, [verbSearch]);

  const totalTargets = selectedTargets.length + customTargets.length;
  const totalVerbs = selectedVerbs.length + customVerbs.length;

  async function handleNext() {
    if (totalTargets < 3) {
      alert(language === 'ko' ? '기여 대상을 최소 3개 선택해주세요.' : 'Please select at least 3 contribution targets.');
      return;
    }
    if (totalVerbs < 3) {
      alert(language === 'ko' ? '행동 동사를 최소 3개 선택해주세요.' : 'Please select at least 3 action verbs.');
      return;
    }

    setSaving(true);
    try {
      await fetch('/api/discover/mission/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: 3,
          selected_targets: selectedTargets,
          selected_verbs: selectedVerbs,
          custom_targets: customTargets,
          custom_verbs: customVerbs,
        }),
      });
      router.push('/discover/mission/step3');
    } catch (error) {
      console.error('[Mission Step 2] Save error:', error);
      alert(language === 'ko' ? '저장 실패' : 'Save failed');
      setSaving(false);
    }
  }

  const activities = createActivitiesFromSteps(STEPS, '/discover/mission', 2, [1]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <ModuleShell
      moduleId="mission"
      currentStep={2}
      totalSteps={4}
      title={language === 'ko' ? '사명 구성요소' : 'Mission Components'}
      sidebar={<ActivitySidebar activities={activities} title="Steps" titleKo="단계" />}
    >
      <div className="space-y-8">
        {/* Section A: Contribution Targets */}
        <div>
          <ModuleCard padding="normal">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-teal-600" />
              <h2 className="text-xl font-bold text-gray-900">
                {language === 'ko' ? 'A. 기여 대상 선택' : 'A. Select Contribution Targets'}
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              {language === 'ko'
                ? '당신이 열정적으로 기여하고 싶은 영역이나 분야를 대표하는 단어를 3~5개 선택하세요.'
                : 'Select 3-5 words that represent the areas or fields you are passionate about contributing to.'}
            </p>

            {/* AI Recommendation Banner */}
            {aiTargetExplanation && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">
                    {language === 'ko' ? 'AI 추천' : 'AI Recommendations'}
                  </span>
                  {aiLoading && <Loader2 className="w-3 h-3 animate-spin text-purple-500" />}
                </div>
                <p className="text-sm text-purple-700">{aiTargetExplanation}</p>
              </div>
            )}

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={targetSearch}
                onChange={(e) => setTargetSearch(e.target.value)}
                placeholder={language === 'ko' ? '검색...' : 'Search...'}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Chip Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[400px] overflow-y-auto p-1">
              {filteredTargets.map((word) => {
                const isSelected = selectedTargets.includes(word);
                const isAiRecommended = aiTargetWords.includes(word);
                const isDisabled = !isSelected && totalTargets >= 5;
                return (
                  <button
                    key={word}
                    onClick={() => !isDisabled && toggleTarget(word)}
                    disabled={isDisabled}
                    className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-md'
                        : isDisabled
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isAiRecommended
                        ? 'bg-purple-50 text-purple-800 border-2 border-purple-300 hover:bg-purple-100'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-teal-400 hover:bg-teal-50'
                    }`}
                  >
                    {word}
                    {isAiRecommended && !isSelected && (
                      <Sparkles className="absolute top-1 right-1 w-3 h-3 text-purple-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Targets */}
            <div className="mt-4 border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                {language === 'ko' ? '직접 추가 (최대 2개)' : 'Add Custom (max 2)'}
              </p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newCustomTarget}
                  onChange={(e) => setNewCustomTarget(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomTarget()}
                  placeholder={language === 'ko' ? '기여 대상 입력...' : 'Enter target...'}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  disabled={customTargets.length >= 2}
                />
                <button
                  onClick={addCustomTarget}
                  disabled={customTargets.length >= 2 || !newCustomTarget.trim()}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {customTargets.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {customTargets.map((word) => (
                    <span key={word} className="inline-flex items-center gap-1 px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm">
                      {word}
                      <button onClick={() => removeCustomTarget(word)} className="hover:text-teal-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Count */}
            <div className={`mt-4 p-3 rounded-lg text-center ${totalTargets >= 3 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
              <p className={`text-sm font-medium ${totalTargets >= 3 ? 'text-green-700' : 'text-amber-700'}`}>
                {totalTargets}/5 {language === 'ko' ? `선택됨 (최소 3개)` : `selected (min 3)`}
              </p>
            </div>
          </ModuleCard>
        </div>

        {/* Section B: Action Verbs */}
        <div>
          <ModuleCard padding="normal">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-teal-600" />
              <h2 className="text-xl font-bold text-gray-900">
                {language === 'ko' ? 'B. 행동 동사 선택' : 'B. Select Action Verbs'}
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              {language === 'ko'
                ? '당신이 취하고 싶은 행동이나 기여 방식을 대표하는 동사를 3~5개 선택하세요.'
                : 'Select 3-5 verbs that represent the actions or ways you want to contribute.'}
            </p>

            {/* AI Recommendation Banner */}
            {aiVerbExplanation && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">
                    {language === 'ko' ? 'AI 추천' : 'AI Recommendations'}
                  </span>
                </div>
                <p className="text-sm text-purple-700">{aiVerbExplanation}</p>
              </div>
            )}

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={verbSearch}
                onChange={(e) => setVerbSearch(e.target.value)}
                placeholder={language === 'ko' ? '검색...' : 'Search...'}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Chip Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[400px] overflow-y-auto p-1">
              {filteredVerbs.map((word) => {
                const isSelected = selectedVerbs.includes(word);
                const isAiRecommended = aiVerbWords.includes(word);
                const isDisabled = !isSelected && totalVerbs >= 5;
                return (
                  <button
                    key={word}
                    onClick={() => !isDisabled && toggleVerb(word)}
                    disabled={isDisabled}
                    className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-md'
                        : isDisabled
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isAiRecommended
                        ? 'bg-purple-50 text-purple-800 border-2 border-purple-300 hover:bg-purple-100'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-teal-400 hover:bg-teal-50'
                    }`}
                  >
                    {word}
                    {isAiRecommended && !isSelected && (
                      <Sparkles className="absolute top-1 right-1 w-3 h-3 text-purple-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Verbs */}
            <div className="mt-4 border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                {language === 'ko' ? '직접 추가 (최대 2개)' : 'Add Custom (max 2)'}
              </p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newCustomVerb}
                  onChange={(e) => setNewCustomVerb(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomVerb()}
                  placeholder={language === 'ko' ? '동사 입력...' : 'Enter verb...'}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  disabled={customVerbs.length >= 2}
                />
                <button
                  onClick={addCustomVerb}
                  disabled={customVerbs.length >= 2 || !newCustomVerb.trim()}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {customVerbs.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {customVerbs.map((word) => (
                    <span key={word} className="inline-flex items-center gap-1 px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm">
                      {word}
                      <button onClick={() => removeCustomVerb(word)} className="hover:text-teal-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Count */}
            <div className={`mt-4 p-3 rounded-lg text-center ${totalVerbs >= 3 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
              <p className={`text-sm font-medium ${totalVerbs >= 3 ? 'text-green-700' : 'text-amber-700'}`}>
                {totalVerbs}/5 {language === 'ko' ? `선택됨 (최소 3개)` : `selected (min 3)`}
              </p>
            </div>
          </ModuleCard>
        </div>

        {/* Summary of Selections */}
        {(totalTargets > 0 || totalVerbs > 0) && (
          <ModuleCard padding="normal" className="bg-teal-50 border-teal-200">
            <h3 className="font-semibold text-teal-900 mb-3">
              {language === 'ko' ? '선택 요약' : 'Selection Summary'}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-teal-700 mb-2">
                  {language === 'ko' ? '기여 대상' : 'Targets'} ({totalTargets})
                </p>
                <div className="flex flex-wrap gap-1">
                  {[...selectedTargets, ...customTargets].map((w) => (
                    <span key={w} className="px-2 py-1 bg-white text-teal-700 rounded text-xs border border-teal-200">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-teal-700 mb-2">
                  {language === 'ko' ? '행동 동사' : 'Verbs'} ({totalVerbs})
                </p>
                <div className="flex flex-wrap gap-1">
                  {[...selectedVerbs, ...customVerbs].map((w) => (
                    <span key={w} className="px-2 py-1 bg-white text-teal-700 rounded text-xs border border-teal-200">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </ModuleCard>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <ModuleButton
            onClick={() => router.push('/discover/mission/step1')}
            variant="secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'ko' ? '이전' : 'Back'}
          </ModuleButton>
          <ModuleButton
            onClick={handleNext}
            disabled={saving || totalTargets < 3 || totalVerbs < 3}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {language === 'ko' ? '다음: 사명 작성' : 'Next: Mission Drafting'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </ModuleButton>
        </div>
      </div>
    </ModuleShell>
  );
}
