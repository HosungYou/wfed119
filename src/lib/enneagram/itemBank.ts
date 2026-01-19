export type Locale = 'en' | 'kr';

export interface EnneagramItem {
  id: string; // e.g., s1_01
  type: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  text: string;
}

// 45 items (5 per type × 9 types) - Based on textbook p.66-69
const screener_en: EnneagramItem[] = [
  // Type 1 - Perfectionist
  { id: 's1_01', type: 1, text: 'I always try to meet moral and ethical standards.' },
  { id: 's1_02', type: 1, text: 'I constantly check whether my actions are right and fair.' },
  { id: 's1_03', type: 1, text: 'I want to make the world a better place.' },
  { id: 's1_04', type: 1, text: 'I strongly dislike making mistakes or having my shortcomings exposed.' },
  { id: 's1_05', type: 1, text: 'Pursuing perfection is important to me.' },

  // Type 2 - Helper
  { id: 's1_06', type: 2, text: 'I enjoy helping others.' },
  { id: 's1_07', type: 2, text: 'I have a strong desire to be loved by others.' },
  { id: 's1_08', type: 2, text: 'I feel satisfaction when someone needs me.' },
  { id: 's1_09', type: 2, text: 'I try to strengthen relationships by helping others.' },
  { id: 's1_10', type: 2, text: 'I fear being unloved or not needed.' },

  // Type 3 - Achiever
  { id: 's1_11', type: 3, text: 'I always set goals and strive to achieve them.' },
  { id: 's1_12', type: 3, text: 'It is important to present a socially successful image.' },
  { id: 's1_13', type: 3, text: 'I want to be respected by others.' },
  { id: 's1_14', type: 3, text: 'I fear failing or appearing incompetent.' },
  { id: 's1_15', type: 3, text: 'I value achievement and image management highly.' },

  // Type 4 - Individualist
  { id: 's1_16', type: 4, text: 'I want to feel that I am a special and unique person.' },
  { id: 's1_17', type: 4, text: 'Deep and intense emotions are important in my life.' },
  { id: 's1_18', type: 4, text: 'Feeling ordinary is very uncomfortable for me.' },
  { id: 's1_19', type: 4, text: 'I strive to express my own uniqueness.' },
  { id: 's1_20', type: 4, text: 'Finding my true self is one of the most important goals in my life.' },

  // Type 5 - Investigator
  { id: 's1_21', type: 5, text: 'I enjoy learning and exploring new knowledge.' },
  { id: 's1_22', type: 5, text: 'I want to live an independent and self-sufficient life.' },
  { id: 's1_23', type: 5, text: 'I fear my energy and resources being depleted.' },
  { id: 's1_24', type: 5, text: 'I tend to think deeply about understanding how the world works.' },
  { id: 's1_25', type: 5, text: 'I try to protect myself through knowledge.' },

  // Type 6 - Loyalist
  { id: 's1_26', type: 6, text: 'I always seek trustworthy structures and stable environments.' },
  { id: 's1_27', type: 6, text: 'I try to be loyal to the community I belong to.' },
  { id: 's1_28', type: 6, text: 'I always want to prepare for potential future risks.' },
  { id: 's1_29', type: 6, text: 'I fear being betrayed or put in danger.' },
  { id: 's1_30', type: 6, text: 'Safety and trust are my most important values.' },

  // Type 7 - Enthusiast
  { id: 's1_31', type: 7, text: 'I always seek new experiences and interesting opportunities.' },
  { id: 's1_32', type: 7, text: 'I try to avoid pain and discomfort in life.' },
  { id: 's1_33', type: 7, text: 'I prefer positive and enjoyable environments.' },
  { id: 's1_34', type: 7, text: 'I value freedom and variety highly.' },
  { id: 's1_35', type: 7, text: 'I feel uncomfortable when life feels boring or limiting.' },

  // Type 8 - Challenger
  { id: 's1_36', type: 8, text: 'I believe maintaining power and autonomy is important.' },
  { id: 's1_37', type: 8, text: 'I strongly protect the rights of my people and my own rights.' },
  { id: 's1_38', type: 8, text: 'I want to avoid situations where I lack control.' },
  { id: 's1_39', type: 8, text: 'I fear exposing my vulnerabilities.' },
  { id: 's1_40', type: 8, text: 'I want to exert influence as a strong leader.' },

  // Type 9 - Peacemaker
  { id: 's1_41', type: 9, text: 'I always try to maintain inner and outer peace.' },
  { id: 's1_42', type: 9, text: 'Avoiding conflict and forming harmonious relationships is important.' },
  { id: 's1_43', type: 9, text: 'I try to avoid unnecessary friction as much as possible.' },
  { id: 's1_44', type: 9, text: 'I tend to adapt to my environment and find stability.' },
  { id: 's1_45', type: 9, text: 'I fear being ignored or considered unimportant.' },
];

// Korean translations (교재 p.66-69 기반)
const screener_kr: EnneagramItem[] = [
  // Type 1 - 완벽주의자
  { id: 's1_01', type: 1, text: '나는 항상 도덕적이고 윤리적인 기준을 충족하려고 노력한다.' },
  { id: 's1_02', type: 1, text: '나의 행동이 옳고 공정한지를 계속해서 점검한다.' },
  { id: 's1_03', type: 1, text: '세상을 더 나은 곳으로 만들고 싶다.' },
  { id: 's1_04', type: 1, text: '나는 실수하거나 부족함이 드러나는 것을 매우 싫어한다.' },
  { id: 's1_05', type: 1, text: '완벽함을 추구하는 것이 내게 중요하다.' },

  // Type 2 - 조력가
  { id: 's1_06', type: 2, text: '나는 다른 사람을 돕는 것을 즐겨한다.' },
  { id: 's1_07', type: 2, text: '타인으로부터 사랑받고 싶다는 욕구가 크다.' },
  { id: 's1_08', type: 2, text: '내가 누군가에게 필요하다는 느낌을 받을 때 만족감을 느낀다.' },
  { id: 's1_09', type: 2, text: '타인에게 도움을 줌으로써 관계를 강화하려고 노력한다.' },
  { id: 's1_10', type: 2, text: '사랑받지 못하거나 필요하지 않은 존재가 되는 것이 두렵다.' },

  // Type 3 - 성취자
  { id: 's1_11', type: 3, text: '나는 항상 목표를 설정하고 그것을 달성하려 노력한다.' },
  { id: 's1_12', type: 3, text: '사회적으로 성공적인 이미지를 보여주는 것이 중요하다.' },
  { id: 's1_13', type: 3, text: '나는 타인에게 존경받기를 원한다.' },
  { id: 's1_14', type: 3, text: '나는 실패하거나 무능력하다는 인상을 주는 것을 두려워한다.' },
  { id: 's1_15', type: 3, text: '나는 성과와 이미지 관리를 중요하게 여긴다.' },

  // Type 4 - 개성추구자
  { id: 's1_16', type: 4, text: '나는 내가 특별하고 독창적인 존재라고 느끼고 싶다.' },
  { id: 's1_17', type: 4, text: '깊고 강렬한 감정이 내 삶에서 중요하다.' },
  { id: 's1_18', type: 4, text: '평범하게 느껴지는 것이 매우 불편하다.' },
  { id: 's1_19', type: 4, text: '나만의 독창성을 표현하려고 노력한다.' },
  { id: 's1_20', type: 4, text: '나는 진정한 자아를 찾는 것이 삶에서 가장 중요한 목표 중 하나다.' },

  // Type 5 - 탐구자
  { id: 's1_21', type: 5, text: '나는 새로운 지식을 배우고 탐구하는 것을 좋아한다.' },
  { id: 's1_22', type: 5, text: '스스로 독립적이고 자급자족하는 삶을 살고 싶다.' },
  { id: 's1_23', type: 5, text: '나의 에너지와 자원이 고갈되는 것이 두렵다.' },
  { id: 's1_24', type: 5, text: '세상의 원리를 이해하려고 깊이 생각하는 편이다.' },
  { id: 's1_25', type: 5, text: '지식을 통해 나 자신을 보호하려고 노력한다.' },

  // Type 6 - 충성가
  { id: 's1_26', type: 6, text: '나는 항상 신뢰할 수 있는 구조와 안정된 환경을 찾는다.' },
  { id: 's1_27', type: 6, text: '내가 속한 공동체에 충실하려고 노력한다.' },
  { id: 's1_28', type: 6, text: '미래에 일어날 수 있는 위험을 항상 대비하고 싶다.' },
  { id: 's1_29', type: 6, text: '나는 배신당하거나 위험에 처하는 것을 두려워한다.' },
  { id: 's1_30', type: 6, text: '안전과 신뢰가 나에게 가장 중요한 가치이다.' },

  // Type 7 - 열정가
  { id: 's1_31', type: 7, text: '나는 항상 새로운 경험과 흥미로운 기회를 찾는다.' },
  { id: 's1_32', type: 7, text: '삶의 고통과 불편함을 피하려고 노력한다.' },
  { id: 's1_33', type: 7, text: '긍정적이고 즐거운 환경을 선호한다.' },
  { id: 's1_34', type: 7, text: '나는 자유와 다양성을 매우 중요하게 여긴다.' },
  { id: 's1_35', type: 7, text: '삶이 지루하거나 제한적이라고 느끼면 불편하다.' },

  // Type 8 - 도전자
  { id: 's1_36', type: 8, text: '나는 힘과 자율성을 유지하는 것이 중요하다고 생각한다.' },
  { id: 's1_37', type: 8, text: '내 사람들의 권리와 나의 권리를 강력하게 보호하려고 한다.' },
  { id: 's1_38', type: 8, text: '통제권을 가지지 못하는 상황을 피하고 싶다.' },
  { id: 's1_39', type: 8, text: '나는 자신의 취약점을 노출하는 것이 두렵다.' },
  { id: 's1_40', type: 8, text: '나는 강력한 리더로서 영향력을 행사하고 싶다.' },

  // Type 9 - 중재자
  { id: 's1_41', type: 9, text: '나는 항상 내적·외적 평화를 유지하려고 노력한다.' },
  { id: 's1_42', type: 9, text: '갈등을 피하고 조화로운 관계를 형성하는 것이 중요하다.' },
  { id: 's1_43', type: 9, text: '나는 불필요한 마찰을 최대한 피하려고 한다.' },
  { id: 's1_44', type: 9, text: '주어진 환경에 순응하며 안정감을 찾는 편이다.' },
  { id: 's1_45', type: 9, text: '내가 무시당하거나 중요하지 않은 존재로 여겨지는 것이 두렵다.' },
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
