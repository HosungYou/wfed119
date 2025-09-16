export type PairId = '1vs6' | '3vs7' | '4vs9' | '5vs1' | '2vs9' | '8vs3';
export type Choice = 'A' | 'B';
export type Locale = 'en' | 'kr';

export interface DiscriminatorItem {
  id: string; // d_[pair]_[nn]
  pair: PairId;
  leftType: number; // e.g., 1 if 1vs6
  rightType: number; // e.g., 6 if 1vs6
  prompt: string; // stem
  optionA: string; // maps to leftType
  optionB: string; // maps to rightType
}

const bank_en: Record<PairId, DiscriminatorItem[]> = {
  '1vs6': [
    {
      id: 'd_1vs6_01',
      pair: '1vs6',
      leftType: 1,
      rightType: 6,
      prompt: 'When rules conflict with new risks, I first…',
      optionA: 'apply principles',
      optionB: 'stress-test assumptions',
    },
    {
      id: 'd_1vs6_02',
      pair: '1vs6',
      leftType: 1,
      rightType: 6,
      prompt: 'Under uncertainty, I am more driven by…',
      optionA: 'what is right',
      optionB: 'what could go wrong',
    },
    {
      id: 'd_1vs6_03',
      pair: '1vs6',
      leftType: 1,
      rightType: 6,
      prompt: 'I feel calmer when…',
      optionA: 'standards are upheld',
      optionB: 'contingencies are in place',
    },
  ],
  '3vs7': [
    {
      id: 'd_3vs7_01',
      pair: '3vs7',
      leftType: 3,
      rightType: 7,
      prompt: 'I stay engaged by…',
      optionA: 'measurable progress',
      optionB: 'fresh options',
    },
    {
      id: 'd_3vs7_02',
      pair: '3vs7',
      leftType: 3,
      rightType: 7,
      prompt: 'When plans fail, I…',
      optionA: 'optimize execution',
      optionB: 'pivot to new opportunities',
    },
    {
      id: 'd_3vs7_03',
      pair: '3vs7',
      leftType: 3,
      rightType: 7,
      prompt: 'My attention goes to…',
      optionA: 'outcomes and status',
      optionB: 'experiences and variety',
    },
  ],
  '4vs9': [
    {
      id: 'd_4vs9_01',
      pair: '4vs9',
      leftType: 4,
      rightType: 9,
      prompt: 'In tension, I…',
      optionA: 'explore inner truth',
      optionB: 'diffuse and steady',
    },
    {
      id: 'd_4vs9_02',
      pair: '4vs9',
      leftType: 4,
      rightType: 9,
      prompt: 'I pursue…',
      optionA: 'authentic self-expression',
      optionB: 'shared ease and comfort',
    },
    {
      id: 'd_4vs9_03',
      pair: '4vs9',
      leftType: 4,
      rightType: 9,
      prompt: 'I notice…',
      optionA: 'what is missing inside',
      optionB: 'how to smooth the edges',
    },
  ],
  '5vs1': [
    {
      id: 'd_5vs1_01',
      pair: '5vs1',
      leftType: 5,
      rightType: 1,
      prompt: 'I rely on…',
      optionA: 'thorough comprehension',
      optionB: 'principled rightness',
    },
    {
      id: 'd_5vs1_02',
      pair: '5vs1',
      leftType: 5,
      rightType: 1,
      prompt: 'I push myself to…',
      optionA: 'master ideas',
      optionB: 'meet high standards',
    },
    {
      id: 'd_5vs1_03',
      pair: '5vs1',
      leftType: 5,
      rightType: 1,
      prompt: 'I withdraw to…',
      optionA: 'think and resource',
      optionB: 'avoid mistakes',
    },
  ],
  '2vs9': [
    {
      id: 'd_2vs9_01',
      pair: '2vs9',
      leftType: 2,
      rightType: 9,
      prompt: 'I seek…',
      optionA: 'closeness and helpfulness',
      optionB: 'peace and steadiness',
    },
    {
      id: 'd_2vs9_02',
      pair: '2vs9',
      leftType: 2,
      rightType: 9,
      prompt: 'When others need me, I…',
      optionA: 'lean in to support',
      optionB: 'keep balance and pace',
    },
    {
      id: 'd_2vs9_03',
      pair: '2vs9',
      leftType: 2,
      rightType: 9,
      prompt: 'I adjust to…',
      optionA: 'relational needs',
      optionB: 'overall calm',
    },
  ],
  '8vs3': [
    {
      id: 'd_8vs3_01',
      pair: '8vs3',
      leftType: 8,
      rightType: 3,
      prompt: 'I assert…',
      optionA: 'strength to protect/control',
      optionB: 'a winning image to succeed',
    },
    {
      id: 'd_8vs3_02',
      pair: '8vs3',
      leftType: 8,
      rightType: 3,
      prompt: 'I value…',
      optionA: 'direct power',
      optionB: 'recognized achievement',
    },
    {
      id: 'd_8vs3_03',
      pair: '8vs3',
      leftType: 8,
      rightType: 3,
      prompt: 'I move faster when…',
      optionA: 'stakes are high',
      optionB: 'metrics are visible',
    },
  ],
};

const bank_kr: Record<PairId, DiscriminatorItem[]> = {
  '1vs6': bank_en['1vs6'].map((i) => ({
    ...i,
    prompt: '규칙과 새로운 위험이 충돌할 때, 저는 먼저…',
    optionA: '원칙을 적용합니다',
    optionB: '가정을 스트레스 테스트합니다',
  })),
  '3vs7': bank_en['3vs7'].map((i) => ({
    ...i,
    prompt: '저는 다음을 통해 몰입을 유지합니다…',
    optionA: '측정 가능한 진전',
    optionB: '새로운 선택지',
  })),
  '4vs9': bank_en['4vs9'].map((i) => ({
    ...i,
    prompt: '긴장 상황에서 저는…',
    optionA: '내면의 진실을 탐색합니다',
    optionB: '분위기를 누그러뜨리고 안정시킵니다',
  })),
  '5vs1': bank_en['5vs1'].map((i) => ({
    ...i,
    prompt: '저는 다음을 신뢰합니다…',
    optionA: '철저한 이해',
    optionB: '원칙에 맞는 옳음',
  })),
  '2vs9': bank_en['2vs9'].map((i) => ({
    ...i,
    prompt: '저는 다음을 추구합니다…',
    optionA: '친밀감과 도움 주기',
    optionB: '평화와 안정',
  })),
  '8vs3': bank_en['8vs3'].map((i) => ({
    ...i,
    prompt: '저는 다음을 주장합니다…',
    optionA: '보호/통제를 위한 힘',
    optionB: '성공을 위한 이미지',
  })),
};

export function getDiscriminatorPairsForTop(topTypes: number[]): PairId[] {
  const pairs: PairId[] = ['1vs6', '3vs7', '4vs9', '5vs1', '2vs9', '8vs3'];
  const selected: PairId[] = [];
  for (const p of pairs) {
    const [l, r] = p.split('vs').map((x) => Number(x));
    if (topTypes.includes(l) && topTypes.includes(r)) selected.push(p as PairId);
  }
  // Fallback: ensure at least two pairs include the top-1 type
  if (selected.length < 2 && topTypes.length > 0) {
    const top = topTypes[0];
    for (const p of pairs) {
      const [l, r] = p.split('vs').map(Number);
      if ((l === top || r === top) && !selected.includes(p as PairId)) selected.push(p as PairId);
      if (selected.length >= 3) break;
    }
  }
  return selected.slice(0, 3); // plan: 2–3 pairs
}

export function getDiscriminatorItems(locale: Locale, pairs: PairId[]): DiscriminatorItem[] {
  const bank = locale === 'kr' ? bank_kr : bank_en;
  const items: DiscriminatorItem[] = [];
  for (const p of pairs) {
    items.push(...(bank[p] ?? []).slice(0, 2)); // pick first 2 per pair (6 total)
  }
  return items;
}

export function itemById(locale: Locale, id: string): DiscriminatorItem | undefined {
  const bank = locale === 'kr' ? bank_kr : bank_en;
  for (const items of Object.values(bank)) {
    const found = items.find((x) => x.id === id);
    if (found) return found;
  }
  return undefined;
}

