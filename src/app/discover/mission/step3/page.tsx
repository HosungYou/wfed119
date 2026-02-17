'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, ArrowLeft, Sparkles, CheckCircle, Edit2, Target, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { ModuleShell, ModuleCard, ModuleButton, ActivitySidebar, createActivitiesFromSteps } from '@/components/modules';

const STEPS = [
  { id: 'step1', label: 'Values Summary', labelKo: '가치관 요약' },
  { id: 'step2', label: 'Mission Components', labelKo: '사명 구성요소' },
  { id: 'step3', label: 'Mission Drafting', labelKo: '사명 작성' },
  { id: 'step4', label: 'Reflection', labelKo: '성찰' },
];

interface Round3Analysis {
  clarity: { score: number; feedback: string };
  inspiration: { score: number; feedback: string };
  altruism: { score: number; feedback: string };
  conciseness: { score: number; feedback: string };
  overall: number;
  suggestions: string[];
}

export default function MissionStep3() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<any>(null);

  // Components from previous step
  const [selectedVerbs, setSelectedVerbs] = useState<string[]>([]);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [missionValues, setMissionValues] = useState<string[]>([]);

  // Current round (1, 2, or 3)
  const [currentRound, setCurrentRound] = useState(1);

  // Round 1 state
  const [r1Option, setR1Option] = useState<'option1' | 'option2' | 'freewrite'>('option1');
  const [r1AiOption1, setR1AiOption1] = useState('');
  const [r1AiOption2, setR1AiOption2] = useState('');
  const [r1Text, setR1Text] = useState('');
  const [r1Reason, setR1Reason] = useState('');
  const [r1Loading, setR1Loading] = useState(false);

  // Round 2 state
  const [r2Text, setR2Text] = useState('');
  const [r2AiSuggestion, setR2AiSuggestion] = useState('');
  const [r2AiTips, setR2AiTips] = useState<string[]>([]);
  const [r2Loading, setR2Loading] = useState(false);
  const [r2ChangeNote, setR2ChangeNote] = useState('');

  // Round 3 state
  const [r3Text, setR3Text] = useState('');
  const [r3Assessment, setR3Assessment] = useState({ clear: false, inspiring: false, altruistic: false, concise: false });
  const [r3Analysis, setR3Analysis] = useState<Round3Analysis | null>(null);
  const [r3AnalysisLoading, setR3AnalysisLoading] = useState(false);
  const [r3PolishLoading, setR3PolishLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch('/api/discover/mission/session');
      const data = await res.json();

      if (data.current_step < 3) {
        router.push(`/discover/mission/step${data.current_step}`);
        return;
      }

      setSession(data);

      // Load components
      const verbs = [...(data.selected_verbs || []), ...(data.custom_verbs || [])];
      const targets = [...(data.selected_targets || []), ...(data.custom_targets || [])];
      const values = data.top3_mission_values || [];
      setSelectedVerbs(verbs.slice(0, 3));
      setSelectedTargets(targets.slice(0, 3));
      setMissionValues(values.slice(0, 3));

      // Restore round data
      const r1 = data.round1_data || {};
      const r2 = data.round2_data || {};
      const r3 = data.round3_data || {};

      if (r1.text) {
        setR1Option(r1.selectedOption || 'option1');
        setR1Text(r1.text);
        setR1AiOption1(r1.aiOption1 || '');
        setR1AiOption2(r1.aiOption2 || '');
        if (r2.text) {
          setR2Text(r2.text);
          setR2AiSuggestion(r2.aiSuggestion || '');
          setCurrentRound(r3.text ? 3 : 2);
          if (r3.text) {
            setR3Text(r3.text);
            setR3Assessment(r3.selfAssessment || { clear: false, inspiring: false, altruistic: false, concise: false });
            setR3Analysis(r3.aiAnalysis || null);
          }
        } else {
          setCurrentRound(2);
        }
      } else {
        // Generate Round 1 templates
        generateR1Templates(verbs.slice(0, 3), targets.slice(0, 3), values.slice(0, 3));
      }

      setLoading(false);
    } catch (error) {
      console.error('[Mission Step 3] Error:', error);
      setLoading(false);
    }
  }

  async function generateR1Templates(verbs: string[], targets: string[], values: string[]) {
    setR1Loading(true);
    try {
      const res = await fetch('/api/discover/mission/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'mission_composer', verbs, targets, values }),
      });
      const data = await res.json();
      const suggestion = data.suggestion;
      if (suggestion?.option1) {
        setR1AiOption1(suggestion.option1);
        setR1Text(suggestion.option1);
      }
      if (suggestion?.option2) {
        setR1AiOption2(suggestion.option2);
      }
    } catch (error) {
      console.error('[Mission Step 3] Template error:', error);
      // Fallback templates
      const v = verbs.slice(0, 3);
      const t = targets.slice(0, 3);
      const val = values.slice(0, 3);
      const opt1 = `My mission is to ${v.join(', ')} for ${t.join(', ')} guided by ${val.join(', ')}.`;
      const opt2 = `My mission is to ${v[0]} and ${v[1]} in ${t[0]} and ${t[1]}, driven by ${val[0]}, so that I can ${v[2]} meaningful change in ${t[2]}.`;
      setR1AiOption1(opt1);
      setR1AiOption2(opt2);
      setR1Text(opt1);
    } finally {
      setR1Loading(false);
    }
  }

  function selectR1Option(opt: 'option1' | 'option2' | 'freewrite') {
    setR1Option(opt);
    if (opt === 'option1') setR1Text(r1AiOption1);
    else if (opt === 'option2') setR1Text(r1AiOption2);
    else if (opt === 'freewrite') setR1Text('');
  }

  async function saveRound1AndNext() {
    if (!r1Text.trim()) {
      alert(language === 'ko' ? 'Round 1 텍스트를 입력해주세요.' : 'Please enter Round 1 text.');
      return;
    }
    setSaving(true);
    try {
      await fetch('/api/discover/mission/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          round1_data: { selectedOption: r1Option, text: r1Text, aiOption1: r1AiOption1, aiOption2: r1AiOption2, reason: r1Reason },
        }),
      });
      setR2Text(r1Text);
      setCurrentRound(2);
    } catch (error) {
      console.error('[Mission Step 3] Save R1 error:', error);
    } finally {
      setSaving(false);
    }
  }

  async function getR2AiSuggestion() {
    setR2Loading(true);
    try {
      const res = await fetch('/api/discover/mission/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'sentence_refiner', currentDraft: r2Text, round1Text: r1Text }),
      });
      const data = await res.json();
      const suggestion = data.suggestion;
      if (suggestion?.refined) setR2AiSuggestion(suggestion.refined);
      if (suggestion?.tips) setR2AiTips(suggestion.tips);
    } catch (error) {
      console.error('[Mission Step 3] R2 AI error:', error);
    } finally {
      setR2Loading(false);
    }
  }

  async function saveRound2AndNext() {
    if (!r2Text.trim()) {
      alert(language === 'ko' ? 'Round 2 텍스트를 입력해주세요.' : 'Please enter Round 2 text.');
      return;
    }
    setSaving(true);
    try {
      await fetch('/api/discover/mission/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          round2_data: { text: r2Text, aiSuggestion: r2AiSuggestion, changeNote: r2ChangeNote },
        }),
      });
      setR3Text(r2Text);
      setCurrentRound(3);
    } catch (error) {
      console.error('[Mission Step 3] Save R2 error:', error);
    } finally {
      setSaving(false);
    }
  }

  async function analyzeR3() {
    if (!r3Text.trim()) return;
    setR3AnalysisLoading(true);
    try {
      const res = await fetch('/api/discover/mission/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'mission_analyst', missionText: r3Text }),
      });
      const data = await res.json();
      if (data.suggestion) setR3Analysis(data.suggestion);
    } catch (error) {
      console.error('[Mission Step 3] R3 analysis error:', error);
    } finally {
      setR3AnalysisLoading(false);
    }
  }

  async function polishR3() {
    setR3PolishLoading(true);
    try {
      const res = await fetch('/api/discover/mission/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'polish_suggest', missionText: r3Text, analysis: r3Analysis }),
      });
      const data = await res.json();
      if (data.suggestion && typeof data.suggestion === 'string') {
        setR3Text(data.suggestion);
      }
    } catch (error) {
      console.error('[Mission Step 3] R3 polish error:', error);
    } finally {
      setR3PolishLoading(false);
    }
  }

  async function handleNext() {
    if (!r3Text.trim()) {
      alert(language === 'ko' ? '최종 사명 선언문을 입력해주세요.' : 'Please enter your final mission statement.');
      return;
    }

    setSaving(true);
    try {
      // Build draft versions
      const draftVersions = [];
      if (r1Text) draftVersions.push({ version: 1, text: r1Text, createdAt: new Date().toISOString(), source: 'round1' as const });
      if (r2Text && r2Text !== r1Text) draftVersions.push({ version: 2, text: r2Text, createdAt: new Date().toISOString(), source: 'round2' as const });
      if (r3Text) draftVersions.push({ version: 3, text: r3Text, createdAt: new Date().toISOString(), source: 'round3' as const });

      await fetch('/api/discover/mission/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: 4,
          round3_data: { text: r3Text, selfAssessment: r3Assessment, aiAnalysis: r3Analysis },
          final_statement: r3Text,
          draft_versions: draftVersions,
        }),
      });
      router.push('/discover/mission/step4');
    } catch (error) {
      console.error('[Mission Step 3] Save error:', error);
      alert(language === 'ko' ? '저장 실패' : 'Save failed');
      setSaving(false);
    }
  }

  function getScoreColor(score: number) {
    if (score >= 8) return 'text-green-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-red-600';
  }

  function getScoreBg(score: number) {
    if (score >= 8) return 'bg-green-100';
    if (score >= 5) return 'bg-yellow-100';
    return 'bg-red-100';
  }

  const activities = createActivitiesFromSteps(STEPS, '/discover/mission', 3, [1, 2]);

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
      currentStep={3}
      totalSteps={4}
      title={language === 'ko' ? '사명 작성' : 'Mission Drafting'}
      sidebar={<ActivitySidebar activities={activities} title="Steps" titleKo="단계" />}
    >
      <div className="space-y-6">
        {/* Components Summary */}
        <ModuleCard padding="normal" className="bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            {language === 'ko' ? '선택된 구성요소' : 'Selected Components'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedVerbs.map(v => (
              <span key={v} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{v}</span>
            ))}
            {selectedTargets.map(t => (
              <span key={t} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">{t}</span>
            ))}
            {missionValues.map(v => (
              <span key={v} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">{v}</span>
            ))}
          </div>
        </ModuleCard>

        {/* Round Progress Indicator */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map(r => (
            <div key={r} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                currentRound > r ? 'bg-teal-500 text-white' :
                currentRound === r ? 'bg-teal-100 text-teal-700 border-2 border-teal-500' :
                'bg-gray-200 text-gray-500'
              }`}>
                {currentRound > r ? '✓' : r}
              </div>
              {r < 3 && <div className={`w-12 h-0.5 ${currentRound > r ? 'bg-teal-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* ============ ROUND 1 ============ */}
        {currentRound >= 1 && (
          <ModuleCard padding="normal" className={currentRound === 1 ? 'ring-2 ring-teal-500' : 'opacity-80'}>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs">1</span>
              {language === 'ko' ? 'Round 1: 기본 구조' : 'Round 1: Basic Structure'}
            </h2>

            {r1Loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">{language === 'ko' ? 'AI가 템플릿을 생성하고 있습니다...' : 'AI is generating templates...'}</p>
              </div>
            ) : (
              <>
                {/* Option Selection */}
                <div className="space-y-3 mb-4">
                  {/* Option 1 */}
                  <label className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${r1Option === 'option1' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" checked={r1Option === 'option1'} onChange={() => selectR1Option('option1')} className="text-teal-600" />
                      <span className="font-medium text-sm">{language === 'ko' ? '구조 1 (기본)' : 'Structure 1 (Standard)'}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 ml-7">{r1AiOption1 || '...'}</p>
                  </label>

                  {/* Option 2 */}
                  <label className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${r1Option === 'option2' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" checked={r1Option === 'option2'} onChange={() => selectR1Option('option2')} className="text-teal-600" />
                      <span className="font-medium text-sm">{language === 'ko' ? '구조 2 (통합)' : 'Structure 2 (Integrated)'}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 ml-7">{r1AiOption2 || '...'}</p>
                  </label>

                  {/* Freewrite */}
                  <label className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${r1Option === 'freewrite' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" checked={r1Option === 'freewrite'} onChange={() => selectR1Option('freewrite')} className="text-teal-600" />
                      <span className="font-medium text-sm">{language === 'ko' ? '자유 작성' : 'Free Write'}</span>
                    </div>
                  </label>
                </div>

                {/* Editable textarea */}
                <textarea
                  value={r1Text}
                  onChange={(e) => setR1Text(e.target.value)}
                  rows={4}
                  placeholder={language === 'ko' ? '사명 선언문을 작성하세요...' : 'Write your mission statement...'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-base"
                  disabled={currentRound !== 1}
                />

                {currentRound === 1 && (
                  <div className="flex justify-end mt-3">
                    <ModuleButton onClick={saveRound1AndNext} disabled={saving || !r1Text.trim()}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {language === 'ko' ? 'Round 2로 이동' : 'Go to Round 2'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </ModuleButton>
                  </div>
                )}
              </>
            )}
          </ModuleCard>
        )}

        {/* ============ ROUND 2 ============ */}
        {currentRound >= 2 && (
          <ModuleCard padding="normal" className={currentRound === 2 ? 'ring-2 ring-teal-500' : 'opacity-80'}>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs">2</span>
              {language === 'ko' ? 'Round 2: 완성된 문장' : 'Round 2: Complete Sentence'}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {language === 'ko'
                ? '순서를 바꾸고 동사와 명사를 결합하여 하나의 자연스러운 완성 문장을 만드세요.'
                : 'Rearrange and combine verbs and nouns to create one natural, complete sentence.'}
            </p>

            {/* Reference: Round 1 result */}
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 mb-4">
              <span className="font-medium">{language === 'ko' ? 'Round 1 결과: ' : 'Round 1 result: '}</span>
              {r1Text}
            </div>

            <textarea
              value={r2Text}
              onChange={(e) => setR2Text(e.target.value)}
              rows={4}
              placeholder={language === 'ko' ? '자연스러운 문장으로 다시 작성하세요...' : 'Rewrite as a natural sentence...'}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-base"
              disabled={currentRound !== 2}
            />
            <p className="text-xs text-gray-400 mt-1">{r2Text.length} {language === 'ko' ? '자' : 'chars'}</p>

            {currentRound === 2 && (
              <>
                {/* AI Suggestion */}
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={getR2AiSuggestion}
                    disabled={r2Loading || !r2Text.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-sm font-medium disabled:opacity-50"
                  >
                    {r2Loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {language === 'ko' ? 'AI 제안 받기' : 'Get AI Suggestion'}
                  </button>
                </div>

                {r2AiSuggestion && (
                  <div className="mt-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm font-medium text-purple-800 mb-2">AI {language === 'ko' ? '제안' : 'Suggestion'}:</p>
                    <p className="text-sm text-purple-900 mb-3">{r2AiSuggestion}</p>
                    {r2AiTips.length > 0 && (
                      <div className="space-y-1">
                        {r2AiTips.map((tip, i) => (
                          <p key={i} className="text-xs text-purple-600">- {tip}</p>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => setR2Text(r2AiSuggestion)}
                      className="mt-2 text-xs text-purple-700 hover:text-purple-900 underline"
                    >
                      {language === 'ko' ? 'AI 제안 채택' : 'Use AI suggestion'}
                    </button>
                  </div>
                )}

                <div className="flex justify-end mt-4">
                  <ModuleButton onClick={saveRound2AndNext} disabled={saving || !r2Text.trim()}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {language === 'ko' ? 'Round 3으로 이동' : 'Go to Round 3'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </ModuleButton>
                </div>
              </>
            )}
          </ModuleCard>
        )}

        {/* ============ ROUND 3 ============ */}
        {currentRound >= 3 && (
          <ModuleCard padding="normal" className={currentRound === 3 ? 'ring-2 ring-teal-500' : ''}>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs">3</span>
              {language === 'ko' ? 'Round 3: 최종 다듬기' : 'Round 3: Final Polish'}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {language === 'ko'
                ? '더 매력적이고 간결하게 만드세요. 아래 4가지 기준을 참고하세요.'
                : 'Make it more compelling and concise. Refer to the 4 criteria below.'}
            </p>

            {/* Reference: Round 2 result */}
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 mb-4">
              <span className="font-medium">{language === 'ko' ? 'Round 2 결과: ' : 'Round 2 result: '}</span>
              {r2Text}
            </div>

            <textarea
              value={r3Text}
              onChange={(e) => setR3Text(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-base"
              placeholder={language === 'ko' ? '최종 사명 선언문...' : 'Final mission statement...'}
            />
            <p className="text-xs text-gray-400 mt-1">{r3Text.length} {language === 'ko' ? '자' : 'chars'}</p>

            {/* Self-Assessment Checklist */}
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-medium text-amber-800 mb-3">
                {language === 'ko' ? '자기평가 체크리스트' : 'Self-Assessment Checklist'}
              </h4>
              <div className="space-y-2">
                {[
                  { key: 'clear' as const, ko: '10살 아이도 이해할 만큼 명확한가 (Clear)', en: 'Clear enough for a 10-year-old to understand' },
                  { key: 'inspiring' as const, ko: '나에게 에너지를 주는 영감이 있는가 (Inspiring)', en: 'Inspiring - gives you energy' },
                  { key: 'altruistic' as const, ko: '타인의 지지를 얻을 만큼 이타적인가 (Altruistic)', en: 'Altruistic - others would support it' },
                  { key: 'concise' as const, ko: '외울 수 있을 만큼 간결한가 (Concise)', en: 'Concise - can be memorized' },
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={r3Assessment[item.key]}
                      onChange={() => setR3Assessment(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm text-amber-900">{language === 'ko' ? item.ko : item.en}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* AI Analysis & Polish buttons */}
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={analyzeR3}
                disabled={r3AnalysisLoading || !r3Text.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-sm font-medium disabled:opacity-50"
              >
                {r3AnalysisLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                {language === 'ko' ? 'AI 분석' : 'AI Analyze'}
              </button>
              <button
                onClick={polishR3}
                disabled={r3PolishLoading || !r3Text.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 text-sm font-medium disabled:opacity-50"
              >
                {r3PolishLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {language === 'ko' ? 'AI로 다듬기' : 'AI Polish'}
              </button>
            </div>

            {/* AI Analysis Results */}
            {r3Analysis && (
              <div className="mt-4 p-4 bg-white border rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">
                  {language === 'ko' ? 'AI 분석 결과' : 'AI Analysis Results'}
                </h4>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { key: 'clarity', label: language === 'ko' ? '명확성' : 'Clarity' },
                    { key: 'inspiration', label: language === 'ko' ? '영감' : 'Inspiration' },
                    { key: 'altruism', label: language === 'ko' ? '이타성' : 'Altruism' },
                    { key: 'conciseness', label: language === 'ko' ? '간결성' : 'Conciseness' },
                  ].map(item => {
                    const data = r3Analysis[item.key as keyof Round3Analysis] as { score: number; feedback: string };
                    return (
                      <div key={item.key} className={`p-3 rounded-lg ${getScoreBg(data.score)}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{item.label}</span>
                          <span className={`font-bold ${getScoreColor(data.score)}`}>{data.score}/10</span>
                        </div>
                        <p className="text-xs text-gray-600">{data.feedback}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">{language === 'ko' ? '종합' : 'Overall'}: </span>
                  <span className={`text-lg font-bold ${getScoreColor(r3Analysis.overall)}`}>{r3Analysis.overall}/10</span>
                </div>
                {r3Analysis.suggestions?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">{language === 'ko' ? '개선 제안:' : 'Suggestions:'}</p>
                    {r3Analysis.suggestions.map((s, i) => (
                      <p key={i} className="text-xs text-gray-600">- {s}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Final Mission Highlight */}
            {r3Text.trim() && (
              <div className="mt-6 p-6 bg-gradient-to-br from-teal-50 to-emerald-50 border-2 border-teal-200 rounded-xl">
                <Target className="w-6 h-6 text-teal-600 mx-auto mb-2" />
                <p className="text-center text-lg font-medium text-gray-900 leading-relaxed">
                  &ldquo;{r3Text}&rdquo;
                </p>
              </div>
            )}
          </ModuleCard>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <ModuleButton
            onClick={() => {
              if (currentRound > 1) {
                setCurrentRound(currentRound - 1);
              } else {
                router.push('/discover/mission/step2');
              }
            }}
            variant="secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'ko' ? '이전' : 'Back'}
          </ModuleButton>
          {currentRound === 3 && (
            <ModuleButton
              onClick={handleNext}
              disabled={saving || !r3Text.trim()}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {language === 'ko' ? '다음: 성찰' : 'Next: Reflection'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </ModuleButton>
          )}
        </div>
      </div>
    </ModuleShell>
  );
}
