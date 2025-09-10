export type Locale = 'en' | 'kr';

export interface EnneagramItem {
  id: string; // e.g., s1_01
  type: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  text: string;
}

const screener_en: EnneagramItem[] = [
  // Type 1
  { id: 's1_01', type: 1, text: 'I feel a strong inner pull to make things the “right” way.' },
  { id: 's1_02', type: 1, text: 'I notice errors and want to correct them promptly.' },
  { id: 's1_03', type: 1, text: 'I measure myself against high internal standards.' },
  { id: 's1_04', type: 1, text: 'When choices are unclear, I lean on principles to guide me.' },
  // Type 2
  { id: 's1_05', type: 2, text: 'I quickly sense what others might need from me.' },
  { id: 's1_06', type: 2, text: 'Offering support gives me a deep sense of purpose.' },
  { id: 's1_07', type: 2, text: 'I often prioritize others’ needs before my own.' },
  { id: 's1_08', type: 2, text: 'I pay close attention to appreciation in relationships.' },
  // Type 3
  { id: 's1_09', type: 3, text: 'I naturally set measurable goals and track progress.' },
  { id: 's1_10', type: 3, text: 'I adapt my presentation to align with what success requires.' },
  { id: 's1_11', type: 3, text: 'Achieving visible results energizes me.' },
  { id: 's1_12', type: 3, text: 'I focus on efficiency to reach outcomes quickly.' },
  // Type 4
  { id: 's1_13', type: 4, text: 'I strive to express an authentic, unique perspective.' },
  { id: 's1_14', type: 4, text: 'I often reflect on my deeper feelings and meanings.' },
  { id: 's1_15', type: 4, text: 'Feeling understood is essential for me to thrive.' },
  { id: 's1_16', type: 4, text: 'I sense what is missing and long to make it whole.' },
  // Type 5
  { id: 's1_17', type: 5, text: 'I conserve energy by limiting demands on my time and attention.' },
  { id: 's1_18', type: 5, text: 'I feel secure when I understand how things work.' },
  { id: 's1_19', type: 5, text: 'I prefer to gather information before engaging fully.' },
  { id: 's1_20', type: 5, text: 'Clear boundaries help me feel capable and resourced.' },
  // Type 6
  { id: 's1_21', type: 6, text: 'I regularly scan for risks and prepare backup plans.' },
  { id: 's1_22', type: 6, text: 'Trust builds slowly for me, then becomes steady.' },
  { id: 's1_23', type: 6, text: 'I seek guidance from reliable people or systems.' },
  { id: 's1_24', type: 6, text: 'I feel responsible to question uncertain assumptions.' },
  // Type 7
  { id: 's1_25', type: 7, text: 'I generate multiple options to keep possibilities open.' },
  { id: 's1_26', type: 7, text: 'Anticipating positive experiences keeps me motivated.' },
  { id: 's1_27', type: 7, text: 'I prefer to reframe difficulties to find what’s useful.' },
  { id: 's1_28', type: 7, text: 'I move on quickly when something feels limiting.' },
  // Type 8
  { id: 's1_29', type: 8, text: 'I step up to take charge when things feel unclear.' },
  { id: 's1_30', type: 8, text: 'I protect the people and causes I care about.' },
  { id: 's1_31', type: 8, text: 'I value directness and straightforward decisions.' },
  { id: 's1_32', type: 8, text: 'I dislike feeling controlled by others or systems.' },
  // Type 9
  { id: 's1_33', type: 9, text: 'I maintain calm by reducing internal and external conflict.' },
  { id: 's1_34', type: 9, text: 'I easily see multiple perspectives and common ground.' },
  { id: 's1_35', type: 9, text: 'I go with the flow to keep things steady.' },
  { id: 's1_36', type: 9, text: 'I defer decisions until I feel settled and at ease.' },
];

// Korean translations
const screener_kr: EnneagramItem[] = [
  // Type 1
  { id: 's1_01', type: 1, text: '저는 일을 “옳게” 만드는 강한 내적 끌림을 느낍니다.' },
  { id: 's1_02', type: 1, text: '저는 오류를 발견하면 즉시 바로잡고 싶습니다.' },
  { id: 's1_03', type: 1, text: '저는 높은 내부 기준으로 저를 평가합니다.' },
  { id: 's1_04', type: 1, text: '선택이 불명확할 때 원칙을 근거로 결정합니다.' },
  // Type 2
  { id: 's1_05', type: 2, text: '저는 다른 사람에게 무엇이 필요할지 빠르게 감지합니다.' },
  { id: 's1_06', type: 2, text: '도움을 주는 일에서 깊은 목적감을 느낍니다.' },
  { id: 's1_07', type: 2, text: '저는 종종 제 필요보다 타인의 필요를 우선합니다.' },
  { id: 's1_08', type: 2, text: '관계에서 감사/인정을 세심히 살핉니다.' },
  // Type 3
  { id: 's1_09', type: 3, text: '저는 자연스럽게 측정 가능한 목표를 세우고 추적합니다.' },
  { id: 's1_10', type: 3, text: '성공에 필요한 모습에 맞게 제 표현을 조정합니다.' },
  { id: 's1_11', type: 3, text: '가시적인 성과를 내면 에너지가 납니다.' },
  { id: 's1_12', type: 3, text: '저는 효율을 중시하여 결과에 빠르게 도달하려 합니다.' },
  // Type 4
  { id: 's1_13', type: 4, text: '저는 진정성 있고 고유한 관점을 표현하려고 노력합니다.' },
  { id: 's1_14', type: 4, text: '깊은 감정과 의미에 대해 자주 성찰합니다.' },
  { id: 's1_15', type: 4, text: '이해받는 느낌은 제가 번성하는 데 필수적입니다.' },
  { id: 's1_16', type: 4, text: '저는 부족한 점을 감지하고 그것을 완성하고 싶어합니다.' },
  // Type 5
  { id: 's1_17', type: 5, text: '시간과 주의력을 보호하여 에너지를 아낍니다.' },
  { id: 's1_18', type: 5, text: '사물이 어떻게 작동하는지 이해할 때 안정감을 느낍니다.' },
  { id: 's1_19', type: 5, text: '완전히 참여하기 전에 정보를 모으는 편입니다.' },
  { id: 's1_20', type: 5, text: '분명한 경계가 있으면 유능하고 자원 충만함을 느낍니다.' },
  // Type 6
  { id: 's1_21', type: 6, text: '저는 위험을 정기적으로 점검하고 대비책을 준비합니다.' },
  { id: 's1_22', type: 6, text: '신뢰는 천천히 쌓이지만 한 번 쌓이면 꾸준합니다.' },
  { id: 's1_23', type: 6, text: '신뢰할 수 있는 사람이나 시스템의 지침을 찾습니다.' },
  { id: 's1_24', type: 6, text: '불확실한 가정을 비판적으로 검토해야 한다고 느낍니다.' },
  // Type 7
  { id: 's1_25', type: 7, text: '가능성을 열어두기 위해 여러 선택지를 만들어 둡니다.' },
  { id: 's1_26', type: 7, text: '긍정적 경험을 기대하는 마음이 저를 동기부여합니다.' },
  { id: 's1_27', type: 7, text: '어려움을 재구성하여 유용한 점을 찾으려 합니다.' },
  { id: 's1_28', type: 7, text: '제한을 느끼면 빠르게 다른 것으로 전환합니다.' },
  // Type 8
  { id: 's1_29', type: 8, text: '상황이 모호할 때 제가 나서서 방향을 잡는 편입니다.' },
  { id: 's1_30', type: 8, text: '소중한 사람과 대의를 보호하려고 합니다.' },
  { id: 's1_31', type: 8, text: '직설적이고 명확한 결정을 중요하게 여깁니다.' },
  { id: 's1_32', type: 8, text: '타인이나 시스템에 의해 통제되는 느낌을 싫어합니다.' },
  // Type 9
  { id: 's1_33', type: 9, text: '내외적 갈등을 줄여 평온함을 유지합니다.' },
  { id: 's1_34', type: 9, text: '여러 관점과 공통분모를 쉽게 봅니다.' },
  { id: 's1_35', type: 9, text: '안정을 위해 흐름에 따르는 편입니다.' },
  { id: 's1_36', type: 9, text: '마음이 가라앉을 때까지 결정을 미루곤 합니다.' },
];

export function getScreenerItems(locale: Locale = 'en'): EnneagramItem[] {
  return locale === 'kr' ? screener_kr : screener_en;
}

export function itemTypeMap(locale: Locale = 'en'): Record<string, number> {
  const map: Record<string, number> = {};
  for (const item of getScreenerItems(locale)) {
    map[item.id] = item.type;
  }
  return map;
}
