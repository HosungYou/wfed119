/**
 * Enneagram Type Profiles
 *
 * Comprehensive data for all 9 Enneagram types including:
 * - Core motivations, fears, and desires
 * - Growth and stress directions
 * - Subtype variations (sp/so/sx)
 * - Healthy and unhealthy traits
 */

export interface EnneagramTypeProfile {
  type: number;
  name: { en: string; ko: string };
  nickname: { en: string; ko: string };
  description: { en: string; ko: string };
  coreMotivation: { en: string; ko: string };
  coreFear: { en: string; ko: string };
  coreDesire: { en: string; ko: string };
  growthDirection: number;
  stressDirection: number;
  healthyTraits: { en: string[]; ko: string[] };
  unhealthyTraits: { en: string[]; ko: string[] };
  subtypes: {
    sp: { en: string; ko: string };
    so: { en: string; ko: string };
    sx: { en: string; ko: string };
  };
  wingDescriptions: {
    left: { en: string; ko: string };
    right: { en: string; ko: string };
  };
}

export const TYPE_PROFILES: Record<number, EnneagramTypeProfile> = {
  1: {
    type: 1,
    name: { en: 'The Reformer', ko: '개혁가' },
    nickname: { en: 'The Perfectionist', ko: '완벽주의자' },
    description: {
      en: 'Principled, purposeful, self-controlled, and perfectionistic. Ones are conscientious and ethical, with a strong sense of right and wrong. They are teachers, crusaders, and advocates for change.',
      ko: '원칙적이고, 목적의식이 강하며, 자기 통제력이 있고, 완벽주의적입니다. 1유형은 양심적이고 윤리적이며, 옳고 그름에 대한 강한 의식을 가지고 있습니다.'
    },
    coreMotivation: {
      en: 'To be right, to strive higher and improve everything, to be consistent with their ideals, to justify themselves, to be beyond criticism.',
      ko: '올바르게 되고, 더 높이 노력하고 모든 것을 개선하며, 이상과 일관성을 유지하고, 비판을 넘어서고자 합니다.'
    },
    coreFear: {
      en: 'Being corrupt, evil, defective, or imperfect',
      ko: '부패하거나, 악하거나, 결함이 있거나, 불완전한 것'
    },
    coreDesire: {
      en: 'To be good, to have integrity, to be balanced',
      ko: '선하고, 진실되며, 균형 잡힌 사람이 되는 것'
    },
    growthDirection: 7,
    stressDirection: 4,
    healthyTraits: {
      en: ['Wise', 'Discerning', 'Realistic', 'Noble', 'Morally heroic'],
      ko: ['지혜로운', '분별력 있는', '현실적인', '고귀한', '도덕적으로 영웅적인']
    },
    unhealthyTraits: {
      en: ['Judgmental', 'Inflexible', 'Dogmatic', 'Obsessive-compulsive', 'Punitive'],
      ko: ['비판적인', '융통성 없는', '독단적인', '강박적인', '처벌적인']
    },
    subtypes: {
      sp: {
        en: 'Self-Preservation One: Focuses on being correct and proper, often worried about material security and doing things "the right way."',
        ko: '자기보존 1유형: 올바르고 적절하게 되는 것에 집중하며, 물질적 안정과 "올바른 방식"으로 일하는 것에 대해 걱정합니다.'
      },
      so: {
        en: 'Social One: Focused on being a role model and teaching others the right way. Often seen as the "social reformer."',
        ko: '사회적 1유형: 롤모델이 되고 다른 사람들에게 올바른 길을 가르치는 것에 집중합니다. "사회 개혁가"로 여겨집니다.'
      },
      sx: {
        en: 'Sexual One: More intense and passionate about their ideals. Desires perfect intimate relationships and can be zealous reformers.',
        ko: '성적 1유형: 자신의 이상에 대해 더 강렬하고 열정적입니다. 완벽한 친밀한 관계를 원하며 열정적인 개혁가가 될 수 있습니다.'
      }
    },
    wingDescriptions: {
      left: {
        en: '1w9: More idealistic and detached, combining perfectionism with a desire for peace. Calmer but can be more stubborn.',
        ko: '1w9: 더 이상주의적이고 초연하며, 완벽주의와 평화에 대한 욕구를 결합합니다. 더 차분하지만 더 완고할 수 있습니다.'
      },
      right: {
        en: '1w2: More people-oriented and helpful. Combines reform with service to others. Warmer but can be more critical.',
        ko: '1w2: 더 사람 중심적이고 도움이 됩니다. 개혁과 타인에 대한 봉사를 결합합니다. 더 따뜻하지만 더 비판적일 수 있습니다.'
      }
    }
  },

  2: {
    type: 2,
    name: { en: 'The Helper', ko: '조력자' },
    nickname: { en: 'The Giver', ko: '베푸는 자' },
    description: {
      en: 'Generous, demonstrative, people-pleasing, and possessive. Twos are empathetic, sincere, and warm-hearted. They are friendly, generous, and self-sacrificing.',
      ko: '관대하고, 표현적이며, 사람을 기쁘게 하고, 소유욕이 있습니다. 2유형은 공감적이고, 진실되며, 따뜻합니다.'
    },
    coreMotivation: {
      en: 'To be loved, to express feelings for others, to be needed and appreciated, to get others to respond to them.',
      ko: '사랑받고, 다른 사람들에 대한 감정을 표현하며, 필요하고 감사받고, 다른 사람들이 반응하게 하는 것.'
    },
    coreFear: {
      en: 'Being unwanted, unworthy of being loved',
      ko: '원치 않거나, 사랑받을 가치가 없는 것'
    },
    coreDesire: {
      en: 'To feel loved and appreciated',
      ko: '사랑받고 감사받는 것을 느끼는 것'
    },
    growthDirection: 4,
    stressDirection: 8,
    healthyTraits: {
      en: ['Unconditionally loving', 'Humble', 'Altruistic', 'Nurturing', 'Empathetic'],
      ko: ['무조건적으로 사랑하는', '겸손한', '이타적인', '양육하는', '공감하는']
    },
    unhealthyTraits: {
      en: ['Manipulative', 'Possessive', 'Self-deceptive', 'Coercive', 'Entitled'],
      ko: ['조종적인', '소유욕이 강한', '자기기만적인', '강압적인', '자격이 있다고 느끼는']
    },
    subtypes: {
      sp: {
        en: 'Self-Preservation Two: More childlike and cute, seeks security through being lovable. Often the "Me First" type among Twos.',
        ko: '자기보존 2유형: 더 어린아이 같고 귀여우며, 사랑스러움을 통해 안정을 추구합니다.'
      },
      so: {
        en: 'Social Two: Focused on being influential and powerful through relationships. Often seeks positions of leadership.',
        ko: '사회적 2유형: 관계를 통해 영향력 있고 강력해지는 것에 집중합니다. 종종 리더십 위치를 추구합니다.'
      },
      sx: {
        en: 'Sexual Two: The most seductive and emotionally intense. Seeks deep one-on-one connections and can be very romantic.',
        ko: '성적 2유형: 가장 매혹적이고 감정적으로 강렬합니다. 깊은 일대일 연결을 추구하며 매우 로맨틱할 수 있습니다.'
      }
    },
    wingDescriptions: {
      left: {
        en: '2w1: More idealistic and principled. Combines helpfulness with a sense of duty. Can be critical while helping.',
        ko: '2w1: 더 이상주의적이고 원칙적입니다. 도움과 의무감을 결합합니다.'
      },
      right: {
        en: '2w3: More ambitious and image-conscious. Combines helping with achieving. Often seeks recognition for their service.',
        ko: '2w3: 더 야심차고 이미지를 의식합니다. 돕는 것과 성취를 결합합니다.'
      }
    }
  },

  3: {
    type: 3,
    name: { en: 'The Achiever', ko: '성취자' },
    nickname: { en: 'The Performer', ko: '수행자' },
    description: {
      en: 'Adaptable, excelling, driven, and image-conscious. Threes are self-assured, attractive, and charming. Ambitious, competent, and energetic.',
      ko: '적응력 있고, 탁월하며, 추진력 있고, 이미지를 의식합니다. 3유형은 자신감 있고, 매력적이며, 매혹적입니다.'
    },
    coreMotivation: {
      en: 'To be affirmed, to distinguish themselves from others, to have attention, to be admired, and to impress others.',
      ko: '인정받고, 다른 사람들과 구별되며, 주목받고, 존경받고, 다른 사람들에게 인상을 주는 것.'
    },
    coreFear: {
      en: 'Being worthless or without inherent value',
      ko: '가치 없거나 본질적인 가치가 없는 것'
    },
    coreDesire: {
      en: 'To feel valuable and worthwhile',
      ko: '가치 있고 보람 있다고 느끼는 것'
    },
    growthDirection: 6,
    stressDirection: 9,
    healthyTraits: {
      en: ['Authentic', 'Self-accepting', 'Inner-directed', 'Charitable', 'Genuine role models'],
      ko: ['진정한', '자기 수용적인', '내면 지향적인', '자선적인', '진정한 롤모델']
    },
    unhealthyTraits: {
      en: ['Deceptive', 'Narcissistic', 'Hostile', 'Exploitative', 'Opportunistic'],
      ko: ['기만적인', '자기도취적인', '적대적인', '착취적인', '기회주의적인']
    },
    subtypes: {
      sp: {
        en: 'Self-Preservation Three: Focused on material success and security. Works hard to create a comfortable, successful life.',
        ko: '자기보존 3유형: 물질적 성공과 안정에 집중합니다. 편안하고 성공적인 삶을 만들기 위해 열심히 일합니다.'
      },
      so: {
        en: 'Social Three: Focused on social status and prestige. Wants to be seen as successful in the eyes of others.',
        ko: '사회적 3유형: 사회적 지위와 명성에 집중합니다. 다른 사람들의 눈에 성공적으로 보이기를 원합니다.'
      },
      sx: {
        en: 'Sexual Three: Focused on being attractive and desirable. Wants to be seen as the ideal partner or person.',
        ko: '성적 3유형: 매력적이고 바람직하게 보이는 것에 집중합니다. 이상적인 파트너나 사람으로 보이기를 원합니다.'
      }
    },
    wingDescriptions: {
      left: {
        en: '3w2: More charming and people-oriented. Combines achievement with helping others. Often very charismatic.',
        ko: '3w2: 더 매력적이고 사람 중심적입니다. 성취와 타인 돕기를 결합합니다. 종종 매우 카리스마 있습니다.'
      },
      right: {
        en: '3w4: More introspective and artistic. Combines achievement with authenticity. Can be more emotionally sensitive.',
        ko: '3w4: 더 내성적이고 예술적입니다. 성취와 진정성을 결합합니다. 더 감정적으로 민감할 수 있습니다.'
      }
    }
  },

  4: {
    type: 4,
    name: { en: 'The Individualist', ko: '개인주의자' },
    nickname: { en: 'The Romantic', ko: '낭만주의자' },
    description: {
      en: 'Expressive, dramatic, self-absorbed, and temperamental. Fours are self-aware, sensitive, and reserved. They are emotionally honest, creative, and personal.',
      ko: '표현적이고, 극적이며, 자기몰입적이고, 변덕스럽습니다. 4유형은 자아 인식이 높고, 민감하며, 내성적입니다.'
    },
    coreMotivation: {
      en: 'To express themselves and their individuality, to create and surround themselves with beauty, to maintain certain moods and feelings.',
      ko: '자신과 개성을 표현하고, 아름다움을 창조하고 둘러싸며, 특정 기분과 감정을 유지하는 것.'
    },
    coreFear: {
      en: 'Having no identity or personal significance',
      ko: '정체성이나 개인적 중요성이 없는 것'
    },
    coreDesire: {
      en: 'To find themselves and their significance',
      ko: '자신과 자신의 중요성을 찾는 것'
    },
    growthDirection: 1,
    stressDirection: 2,
    healthyTraits: {
      en: ['Creative', 'Inspired', 'Self-renewing', 'Compassionate', 'Introspective'],
      ko: ['창의적인', '영감 받은', '자기 갱신적인', '자비로운', '내성적인']
    },
    unhealthyTraits: {
      en: ['Self-pitying', 'Envious', 'Melancholic', 'Alienated', 'Tormented'],
      ko: ['자기 연민적인', '질투하는', '우울한', '소외된', '고통받는']
    },
    subtypes: {
      sp: {
        en: 'Self-Preservation Four: More stoic and less openly dramatic. Often called "counter-type" because they suffer silently.',
        ko: '자기보존 4유형: 더 금욕적이고 덜 공개적으로 극적입니다. 조용히 고통받기 때문에 "반유형"이라고 불립니다.'
      },
      so: {
        en: 'Social Four: Focuses on comparing themselves to others and feeling shame or inferiority. Often feels like they do not belong.',
        ko: '사회적 4유형: 자신을 다른 사람들과 비교하고 수치심이나 열등감을 느끼는 것에 집중합니다.'
      },
      sx: {
        en: 'Sexual Four: The most intense and competitive. Expresses envy outwardly and can be demanding in relationships.',
        ko: '성적 4유형: 가장 강렬하고 경쟁적입니다. 질투를 외적으로 표현하며 관계에서 요구적일 수 있습니다.'
      }
    },
    wingDescriptions: {
      left: {
        en: '4w3: More ambitious and image-aware. Combines individuality with a desire for success. Can be more extroverted.',
        ko: '4w3: 더 야심차고 이미지를 인식합니다. 개성과 성공에 대한 욕구를 결합합니다.'
      },
      right: {
        en: '4w5: More withdrawn and intellectual. Combines emotional depth with analytical thinking. Often more private.',
        ko: '4w5: 더 내향적이고 지적입니다. 감정적 깊이와 분석적 사고를 결합합니다.'
      }
    }
  },

  5: {
    type: 5,
    name: { en: 'The Investigator', ko: '탐구자' },
    nickname: { en: 'The Observer', ko: '관찰자' },
    description: {
      en: 'Perceptive, innovative, secretive, and isolated. Fives are alert, insightful, and curious. They are able to concentrate and focus on developing complex ideas and skills.',
      ko: '통찰력 있고, 혁신적이며, 비밀스럽고, 고립적입니다. 5유형은 경계심 있고, 통찰력 있으며, 호기심이 많습니다.'
    },
    coreMotivation: {
      en: 'To possess knowledge, to understand the environment, to have everything figured out as a way of defending the self.',
      ko: '지식을 소유하고, 환경을 이해하며, 자아를 방어하는 방법으로 모든 것을 파악하는 것.'
    },
    coreFear: {
      en: 'Being useless, helpless, or incapable',
      ko: '쓸모없거나, 무력하거나, 능력이 없는 것'
    },
    coreDesire: {
      en: 'To be capable and competent',
      ko: '능력 있고 유능한 것'
    },
    growthDirection: 8,
    stressDirection: 7,
    healthyTraits: {
      en: ['Visionary', 'Pioneering', 'Objective', 'Perceptive', 'Self-contained'],
      ko: ['비전 있는', '선구적인', '객관적인', '통찰력 있는', '자족적인']
    },
    unhealthyTraits: {
      en: ['Eccentric', 'Nihilistic', 'Isolated', 'Detached', 'Paranoid'],
      ko: ['괴짜의', '허무주의적인', '고립된', '초연한', '편집증적인']
    },
    subtypes: {
      sp: {
        en: 'Self-Preservation Five: Most withdrawn and minimalist. Builds walls around themselves and their resources.',
        ko: '자기보존 5유형: 가장 내향적이고 미니멀리스트입니다. 자신과 자원 주위에 벽을 쌓습니다.'
      },
      so: {
        en: 'Social Five: Seeks to belong to groups with specialized knowledge. Often an expert in their field.',
        ko: '사회적 5유형: 전문 지식을 가진 그룹에 속하기를 추구합니다. 종종 자신의 분야에서 전문가입니다.'
      },
      sx: {
        en: 'Sexual Five: The most emotionally open Five. Seeks intense one-on-one connections through shared interests.',
        ko: '성적 5유형: 가장 감정적으로 개방적인 5유형입니다. 공유된 관심사를 통해 강렬한 일대일 연결을 추구합니다.'
      }
    },
    wingDescriptions: {
      left: {
        en: '5w4: More creative and emotionally sensitive. Combines investigation with artistic expression.',
        ko: '5w4: 더 창의적이고 감정적으로 민감합니다. 탐구와 예술적 표현을 결합합니다.'
      },
      right: {
        en: '5w6: More loyal and security-oriented. Combines knowledge-seeking with practical concerns.',
        ko: '5w6: 더 충성스럽고 안전 지향적입니다. 지식 추구와 실용적 관심사를 결합합니다.'
      }
    }
  },

  6: {
    type: 6,
    name: { en: 'The Loyalist', ko: '충성가' },
    nickname: { en: 'The Skeptic', ko: '회의론자' },
    description: {
      en: 'Engaging, responsible, anxious, and suspicious. Sixes are reliable, hard-working, responsible, and trustworthy. They are excellent troubleshooters.',
      ko: '참여적이고, 책임감 있으며, 불안하고, 의심이 많습니다. 6유형은 신뢰할 수 있고, 근면하며, 책임감 있고, 믿을 만합니다.'
    },
    coreMotivation: {
      en: 'To have security and support, to test the attitudes of others, to fight against anxiety and insecurity.',
      ko: '안전과 지원을 받고, 다른 사람들의 태도를 시험하며, 불안과 불안정에 맞서 싸우는 것.'
    },
    coreFear: {
      en: 'Being without support or guidance',
      ko: '지원이나 안내 없이 있는 것'
    },
    coreDesire: {
      en: 'To have security and support',
      ko: '안전과 지원을 받는 것'
    },
    growthDirection: 9,
    stressDirection: 3,
    healthyTraits: {
      en: ['Courageous', 'Self-affirming', 'Trusting', 'Reliable', 'Cooperative'],
      ko: ['용감한', '자기 긍정적인', '신뢰하는', '신뢰할 수 있는', '협력적인']
    },
    unhealthyTraits: {
      en: ['Anxious', 'Paranoid', 'Defensive', 'Divisive', 'Authoritarian'],
      ko: ['불안한', '편집증적인', '방어적인', '분열적인', '권위주의적인']
    },
    subtypes: {
      sp: {
        en: 'Self-Preservation Six: Most phobic and security-seeking. Looks for safety in personal warmth and alliances.',
        ko: '자기보존 6유형: 가장 공포증적이고 안전을 추구합니다. 개인적 따뜻함과 동맹에서 안전을 찾습니다.'
      },
      so: {
        en: 'Social Six: Seeks security through following rules and authorities. Often very dutiful and responsible.',
        ko: '사회적 6유형: 규칙과 권위를 따르는 것을 통해 안전을 추구합니다. 종종 매우 의무적이고 책임감 있습니다.'
      },
      sx: {
        en: 'Sexual Six: Counter-phobic, confronts fears head-on. Can be bold and intimidating to mask underlying anxiety.',
        ko: '성적 6유형: 반공포증적이며, 두려움에 정면으로 맞섭니다. 근본적인 불안을 숨기기 위해 대담하고 위협적일 수 있습니다.'
      }
    },
    wingDescriptions: {
      left: {
        en: '6w5: More introverted and analytical. Combines loyalty with intellectual independence.',
        ko: '6w5: 더 내향적이고 분석적입니다. 충성심과 지적 독립성을 결합합니다.'
      },
      right: {
        en: '6w7: More outgoing and optimistic. Combines security-seeking with enthusiasm and adventure.',
        ko: '6w7: 더 외향적이고 낙관적입니다. 안전 추구와 열정과 모험을 결합합니다.'
      }
    }
  },

  7: {
    type: 7,
    name: { en: 'The Enthusiast', ko: '열정가' },
    nickname: { en: 'The Adventurer', ko: '모험가' },
    description: {
      en: 'Spontaneous, versatile, acquisitive, and scattered. Sevens are extroverted, optimistic, versatile, and spontaneous. Playful, high-spirited, and practical.',
      ko: '자발적이고, 다재다능하며, 획득욕이 있고, 산만합니다. 7유형은 외향적이고, 낙관적이며, 다재다능하고, 자발적입니다.'
    },
    coreMotivation: {
      en: 'To maintain freedom and happiness, to avoid missing out on worthwhile experiences, to keep themselves excited and occupied.',
      ko: '자유와 행복을 유지하고, 가치 있는 경험을 놓치지 않으며, 흥분되고 바쁘게 유지하는 것.'
    },
    coreFear: {
      en: 'Being deprived, trapped in pain or boredom',
      ko: '박탈당하거나, 고통이나 지루함에 갇히는 것'
    },
    coreDesire: {
      en: 'To be satisfied, content, and fulfilled',
      ko: '만족하고, 흡족하며, 성취감을 느끼는 것'
    },
    growthDirection: 5,
    stressDirection: 1,
    healthyTraits: {
      en: ['Appreciative', 'Grateful', 'Satisfied', 'Profound', 'Focused'],
      ko: ['감사하는', '고마워하는', '만족하는', '심오한', '집중된']
    },
    unhealthyTraits: {
      en: ['Scattered', 'Impulsive', 'Escapist', 'Manic', 'Self-destructive'],
      ko: ['산만한', '충동적인', '도피적인', '조증적인', '자기 파괴적인']
    },
    subtypes: {
      sp: {
        en: 'Self-Preservation Seven: Focused on having enough resources and opportunities. Creates networks of practical support.',
        ko: '자기보존 7유형: 충분한 자원과 기회를 갖는 것에 집중합니다. 실용적인 지원 네트워크를 만듭니다.'
      },
      so: {
        en: 'Social Seven: Counter-type, more restrained and idealistic. Sacrifices for the group and postpones their own needs.',
        ko: '사회적 7유형: 반유형으로, 더 절제되고 이상주의적입니다. 그룹을 위해 희생하고 자신의 필요를 미룹니다.'
      },
      sx: {
        en: 'Sexual Seven: Most fantasy-oriented and idealistic. Seeks the ultimate experience and partner.',
        ko: '성적 7유형: 가장 환상 지향적이고 이상주의적입니다. 궁극적인 경험과 파트너를 추구합니다.'
      }
    },
    wingDescriptions: {
      left: {
        en: '7w6: More relationship-oriented and loyal. Combines enthusiasm with responsibility. Can be more anxious.',
        ko: '7w6: 더 관계 지향적이고 충성스럽습니다. 열정과 책임감을 결합합니다.'
      },
      right: {
        en: '7w8: More assertive and bold. Combines enthusiasm with power and intensity. Very action-oriented.',
        ko: '7w8: 더 단호하고 대담합니다. 열정과 권력과 강렬함을 결합합니다. 매우 행동 지향적입니다.'
      }
    }
  },

  8: {
    type: 8,
    name: { en: 'The Challenger', ko: '도전자' },
    nickname: { en: 'The Protector', ko: '보호자' },
    description: {
      en: 'Self-confident, decisive, willful, and confrontational. Eights are strong, assertive, resourceful, and decisive. They feel they must control their environment.',
      ko: '자신감 있고, 결단력 있으며, 의지가 강하고, 대립적입니다. 8유형은 강하고, 단호하며, 자원이 풍부하고, 결단력 있습니다.'
    },
    coreMotivation: {
      en: 'To be self-reliant, to prove their strength, to resist weakness, to be important in their world, to dominate the environment.',
      ko: '자립하고, 자신의 강함을 증명하며, 약함에 저항하고, 세상에서 중요해지며, 환경을 지배하는 것.'
    },
    coreFear: {
      en: 'Being harmed or controlled by others',
      ko: '다른 사람들에 의해 상처받거나 통제당하는 것'
    },
    coreDesire: {
      en: 'To protect themselves and those they care about',
      ko: '자신과 그들이 돌보는 사람들을 보호하는 것'
    },
    growthDirection: 2,
    stressDirection: 5,
    healthyTraits: {
      en: ['Magnanimous', 'Heroic', 'Self-mastering', 'Protective', 'Empowering'],
      ko: ['관대한', '영웅적인', '자기 통제적인', '보호적인', '힘을 주는']
    },
    unhealthyTraits: {
      en: ['Dominating', 'Ruthless', 'Vengeful', 'Destructive', 'Megalomaniacal'],
      ko: ['지배적인', '무자비한', '복수심에 불타는', '파괴적인', '과대망상적인']
    },
    subtypes: {
      sp: {
        en: 'Self-Preservation Eight: Most restrained Eight. Focused on survival and protecting resources. Can appear less aggressive.',
        ko: '자기보존 8유형: 가장 절제된 8유형입니다. 생존과 자원 보호에 집중합니다. 덜 공격적으로 보일 수 있습니다.'
      },
      so: {
        en: 'Social Eight: Focused on protecting groups and causes. Often seen as a protector of the underdog.',
        ko: '사회적 8유형: 그룹과 대의를 보호하는 것에 집중합니다. 종종 약자의 보호자로 여겨집니다.'
      },
      sx: {
        en: 'Sexual Eight: Most emotionally intense. Seeks to possess and control intimate relationships.',
        ko: '성적 8유형: 가장 감정적으로 강렬합니다. 친밀한 관계를 소유하고 통제하려고 합니다.'
      }
    },
    wingDescriptions: {
      left: {
        en: '8w7: More outgoing and energetic. Combines power with enthusiasm. Very entrepreneurial.',
        ko: '8w7: 더 외향적이고 에너지 넘칩니다. 권력과 열정을 결합합니다. 매우 기업가적입니다.'
      },
      right: {
        en: '8w9: More calm and receptive. Combines strength with peacefulness. Often a "gentle giant."',
        ko: '8w9: 더 차분하고 수용적입니다. 강함과 평화로움을 결합합니다. 종종 "부드러운 거인"입니다.'
      }
    }
  },

  9: {
    type: 9,
    name: { en: 'The Peacemaker', ko: '평화주의자' },
    nickname: { en: 'The Mediator', ko: '중재자' },
    description: {
      en: 'Receptive, reassuring, agreeable, and complacent. Nines are accepting, trusting, and stable. They are creative, optimistic, and supportive.',
      ko: '수용적이고, 안심시키며, 동의적이고, 안주합니다. 9유형은 수용적이고, 신뢰하며, 안정적입니다.'
    },
    coreMotivation: {
      en: 'To have inner stability and peace of mind, to create harmony in their environment, to avoid conflicts and tension.',
      ko: '내면의 안정과 마음의 평화를 갖고, 환경에서 조화를 만들며, 갈등과 긴장을 피하는 것.'
    },
    coreFear: {
      en: 'Loss, separation, fragmentation',
      ko: '상실, 분리, 분열'
    },
    coreDesire: {
      en: 'To have inner stability and peace of mind',
      ko: '내면의 안정과 마음의 평화를 갖는 것'
    },
    growthDirection: 3,
    stressDirection: 6,
    healthyTraits: {
      en: ['Self-possessed', 'Autonomous', 'Serene', 'Present', 'Inclusive'],
      ko: ['침착한', '자율적인', '평온한', '현재에 집중하는', '포용적인']
    },
    unhealthyTraits: {
      en: ['Disengaged', 'Neglectful', 'Dissociated', 'Obstinate', 'Resigned'],
      ko: ['무관심한', '태만한', '해리된', '완고한', '체념한']
    },
    subtypes: {
      sp: {
        en: 'Self-Preservation Nine: Seeks comfort through physical pleasures and routines. Can be the most stubborn.',
        ko: '자기보존 9유형: 신체적 즐거움과 루틴을 통해 편안함을 추구합니다. 가장 완고할 수 있습니다.'
      },
      so: {
        en: 'Social Nine: Merges with groups and communities. Sacrifices own agenda to belong and maintain harmony.',
        ko: '사회적 9유형: 그룹과 커뮤니티에 융합됩니다. 소속되고 조화를 유지하기 위해 자신의 의제를 희생합니다.'
      },
      sx: {
        en: 'Sexual Nine: Merges with significant others. Seeks connection through being like their partner.',
        ko: '성적 9유형: 중요한 타인과 융합됩니다. 파트너처럼 되는 것을 통해 연결을 추구합니다.'
      }
    },
    wingDescriptions: {
      left: {
        en: '9w8: More assertive and body-oriented. Combines peacemaking with strength. Can be more stubborn.',
        ko: '9w8: 더 단호하고 신체 지향적입니다. 평화 조성과 강함을 결합합니다.'
      },
      right: {
        en: '9w1: More idealistic and principled. Combines peacemaking with a sense of purpose.',
        ko: '9w1: 더 이상주의적이고 원칙적입니다. 평화 조성과 목적의식을 결합합니다.'
      }
    }
  }
};

/**
 * Get type profile by number
 */
export function getTypeProfile(type: number): EnneagramTypeProfile | null {
  return TYPE_PROFILES[type] || null;
}

/**
 * Get wing description
 */
export function getWingDescription(
  type: number,
  wing: number,
  locale: 'en' | 'ko' = 'en'
): string {
  const profile = TYPE_PROFILES[type];
  if (!profile) return '';

  // Determine if wing is left (type - 1) or right (type + 1)
  const leftWing = type === 1 ? 9 : type - 1;
  const rightWing = type === 9 ? 1 : type + 1;

  if (wing === leftWing) {
    return profile.wingDescriptions.left[locale];
  } else if (wing === rightWing) {
    return profile.wingDescriptions.right[locale];
  }

  return '';
}

/**
 * Get subtype description
 */
export function getSubtypeDescription(
  type: number,
  instinct: 'sp' | 'so' | 'sx',
  locale: 'en' | 'ko' = 'en'
): string {
  const profile = TYPE_PROFILES[type];
  if (!profile) return '';

  return profile.subtypes[instinct][locale];
}
