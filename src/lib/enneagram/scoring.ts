import { itemTypeMap, type Locale } from './itemBank';

export type Likert = 1 | 2 | 3 | 4 | 5;

export interface Stage1Response {
  itemId: string;
  value: Likert;
}

export interface TypeScores {
  raw: Record<string, number>; // '1'..'9' sums
  probabilities: Record<string, number>; // normalized to sum=1
}

export function scoreStage1(
  responses: Stage1Response[],
  locale: Locale = 'en'
): TypeScores {
  const typeMap = itemTypeMap(locale);
  const raw: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0, '9': 0 };

  const seen = new Set<string>();
  for (const r of responses) {
    if (seen.has(r.itemId)) continue; // ignore duplicates
    const t = typeMap[r.itemId];
    if (!t) continue;
    raw[String(t)] += r.value;
    seen.add(r.itemId);
  }

  const total = Object.values(raw).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return {
      raw,
      probabilities: Object.fromEntries(Object.keys(raw).map((k) => [k, 1 / 9])) as Record<string, number>,
    };
  }

  const probabilities: Record<string, number> = {};
  for (const k of Object.keys(raw)) {
    probabilities[k] = raw[k] / total;
  }

  return { raw, probabilities };
}

export function confidenceBand(probabilities: Record<string, number>): 'high' | 'medium' | 'low' {
  const sorted = Object.values(probabilities).sort((a, b) => b - a);
  if (sorted.length < 2) return 'low';
  const lead = sorted[0] - sorted[1];
  if (lead >= 0.20) return 'high';
  if (lead >= 0.07) return 'medium';
  return 'low';
}

export function primaryType(probabilities: Record<string, number>): string {
  let best: string = '1';
  let score = -Infinity;
  for (const [k, v] of Object.entries(probabilities)) {
    if (v > score) {
      best = k;
      score = v;
    }
  }
  return best;
}

