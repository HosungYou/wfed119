export type Locale = 'en' | 'kr';

export interface InstinctItem {
  id: string; // i_[nn]
  instinct: 'sp' | 'so' | 'sx';
  text: string;
}

// Display names for instincts (updated per Dr. Yoon feedback: sx -> Intimate)
export const INSTINCT_DISPLAY_NAMES: Record<'sp' | 'so' | 'sx', { en: string; ko: string; short: string }> = {
  sp: { en: 'Self Preservation', ko: '자기보존', short: 'SP' },
  so: { en: 'Social', ko: '사회적', short: 'SO' },
  sx: { en: 'Intimate', ko: '친밀', short: 'SX' }, // Changed from "Sexual" to "Intimate"
};

export function getInstinctDisplayName(instinct: 'sp' | 'so' | 'sx', locale: Locale = 'en'): string {
  return locale === 'kr' ? INSTINCT_DISPLAY_NAMES[instinct].ko : INSTINCT_DISPLAY_NAMES[instinct].en;
}

const items_en: InstinctItem[] = [
  { id: 'i_01', instinct: 'sp', text: 'I continuously optimize my daily resources (time, money, energy).' },
  { id: 'i_02', instinct: 'so', text: 'I notice shifts in group mood and adjust my role.' },
  { id: 'i_03', instinct: 'sx', text: 'I pursue compelling connections/projects with strong intensity.' },
  { id: 'i_04', instinct: 'sx', text: 'I express myself more boldly with a trusted few than with groups.' },
  { id: 'i_05', instinct: 'sp', text: 'I feel settled when practical needs are handled first.' },
  { id: 'i_06', instinct: 'so', text: 'I think in terms of “we”—how we function together.' },
  { id: 'i_07', instinct: 'sp', text: 'I curate environments that feel safe and replenishing.' },
  { id: 'i_08', instinct: 'so', text: 'I track status, influence, or positioning in groups.' },
  { id: 'i_09', instinct: 'sx', text: 'I’m energized by deep, focused exchanges over breadth.' },
  { id: 'i_10', instinct: 'sp', text: 'I plan around comfort, maintenance, and reliability.' },
  { id: 'i_11', instinct: 'so', text: 'I naturally host, convene, or coordinate people.' },
  { id: 'i_12', instinct: 'sx', text: 'I follow sparks even if it means narrowing focus.' },
];

const items_kr: InstinctItem[] = [
  { id: 'i_01', instinct: 'sp', text: '저는 일상 자원을(시간, 돈, 에너지) 지속적으로 최적화합니다.' },
  { id: 'i_02', instinct: 'so', text: '그룹 분위기의 변화를 알아차리고 제 역할을 조정합니다.' },
  { id: 'i_03', instinct: 'sx', text: '강하게 끌리는 연결/프로젝트를 높은 집중도로 추구합니다.' },
  { id: 'i_04', instinct: 'sx', text: '신뢰하는 소수와 함께일 때 더 대담하게 표현합니다.' },
  { id: 'i_05', instinct: 'sp', text: '실용적 필요가 먼저 해결되면 마음이 안정됩니다.' },
  { id: 'i_06', instinct: 'so', text: '“우리” 관점으로 함께 어떻게 기능하는지 생각합니다.' },
  { id: 'i_07', instinct: 'sp', text: '안전하고 회복되는 환경을 만드는 데 신경 씁니다.' },
  { id: 'i_08', instinct: 'so', text: '그룹 내 지위, 영향력, 위치 변화를 살핉니다.' },
  { id: 'i_09', instinct: 'sx', text: '넓이보다 깊고 집중된 교류에서 에너지를 얻습니다.' },
  { id: 'i_10', instinct: 'sp', text: '편안함, 유지관리, 신뢰성을 기준으로 계획합니다.' },
  { id: 'i_11', instinct: 'so', text: '자연스럽게 사람들을 모으고 조정하는 편입니다.' },
  { id: 'i_12', instinct: 'sx', text: '집중을 좁히더라도 “불꽃”을 따라갑니다.' },
];

export function getInstinctItems(locale: Locale = 'en'): InstinctItem[] {
  return locale === 'kr' ? items_kr : items_en;
}

export function scoreInstincts(
  responses: { itemId: string; value: 1 | 2 | 3 | 4 | 5 }[],
  locale: Locale = 'en'
): { sp: number; so: number; sx: number; dominant: 'sp' | 'so' | 'sx' } {
  const items = getInstinctItems(locale);
  const map = new Map(items.map((i) => [i.id, i] as const));
  const scores = { sp: 0, so: 0, sx: 0 } as { [k in 'sp' | 'so' | 'sx']: number };
  const seen = new Set<string>();
  for (const r of responses) {
    if (seen.has(r.itemId)) continue;
    const it = map.get(r.itemId);
    if (!it) continue;
    scores[it.instinct] += r.value;
    seen.add(r.itemId);
  }
  const dominant = (Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0] ?? 'sp') as 'sp' | 'so' | 'sx';
  return { sp: scores.sp, so: scores.so, sx: scores.sx, dominant };
}

