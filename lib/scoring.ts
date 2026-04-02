import type { Dimension, QuestionRow, RelationshipType, ResponseRow } from '@/lib/types';

type AnswerLike = Pick<ResponseRow, 'question_id' | 'answer'>;

const MAX_DIFF = 4;

export const SCORE_THRESHOLD_SHARED = 3;
export const DIMENSION_UNLOCK_SHARED = 3;
export const MEANINGFUL_GAP = 2;

export function dimensionsForRelationship(rel: RelationshipType | null): Dimension[] {
  switch (rel) {
    case 'romantic':
      return ['values', 'communication', 'emotional', 'lifestyle'];
    case 'friend':
      return ['values', 'communication', 'emotional'];
    case 'family':
      return ['values', 'emotional'];
    case 'work':
      return ['communication'];
    case 'general':
    default:
      return ['values'];
  }
}

/** Dimensions a connection may view (including non-scored shown answers). */
export function visibleDimensionsForRelationship(rel: RelationshipType | null): Dimension[] {
  switch (rel) {
    case 'romantic':
      return ['values', 'communication', 'emotional', 'lifestyle', 'individual'];
    case 'friend':
      return ['values', 'communication', 'emotional', 'lifestyle', 'individual'];
    case 'family':
      return ['values', 'emotional', 'individual'];
    case 'work':
      return ['communication', 'individual'];
    case 'general':
    default:
      return ['values', 'individual'];
  }
}

export function questionScore(a: number, b: number): number {
  const diff = Math.abs(a - b);
  return 100 * (1 - diff / MAX_DIFF);
}

export type CompatibilityResult = {
  overall: number | null;
  questionsScored: number;
  dimensionScores: Partial<Record<Dimension, number | null>>;
  dimensionCounts: Partial<Record<Dimension, number>>;
};

export function computeCompatibility(
  myResponses: AnswerLike[],
  theirResponses: AnswerLike[],
  questions: QuestionRow[],
  myRelationshipTowardThem: RelationshipType | null
): CompatibilityResult {
  const allowed = new Set(dimensionsForRelationship(myRelationshipTowardThem));
  const mine = new Map(myResponses.map((r) => [r.question_id, r]));
  const theirs = new Map(theirResponses.map((r) => [r.question_id, r]));

  let weighted = 0;
  let wSum = 0;
  let count = 0;
  const dimWeighted: Partial<Record<Dimension, { num: number; den: number; count: number }>> = {};

  for (const q of questions) {
    if (q.match_type !== 'S' || !q.is_primary) continue;
    if (!allowed.has(q.dimension)) continue;
    const ra = mine.get(q.id);
    const rb = theirs.get(q.id);
    if (!ra?.answer || !rb?.answer) continue;
    const s = questionScore(ra.answer, rb.answer);
    const w = Number(q.weight) || 1;
    weighted += s * w;
    wSum += w;
    count += 1;
    const acc = dimWeighted[q.dimension] ?? { num: 0, den: 0, count: 0 };
    acc.num += s * w;
    acc.den += w;
    acc.count += 1;
    dimWeighted[q.dimension] = acc;
  }

  const dimensionScores: Partial<Record<Dimension, number | null>> = {};
  const dimensionCounts: Partial<Record<Dimension, number>> = {};
  const dims = ['values', 'communication', 'emotional', 'lifestyle'] as const;
  for (const d of dims) {
    if (!allowed.has(d)) continue;
    const acc = dimWeighted[d];
    dimensionCounts[d] = acc?.count ?? 0;
    if (!acc || acc.count < DIMENSION_UNLOCK_SHARED) {
      dimensionScores[d] = null;
    } else {
      dimensionScores[d] = Math.round((acc.num / acc.den) * 10) / 10;
    }
  }

  const overall =
    count >= SCORE_THRESHOLD_SHARED && wSum > 0 ? Math.round((weighted / wSum) * 10) / 10 : null;

  return {
    overall,
    questionsScored: count,
    dimensionScores,
    dimensionCounts,
  };
}

export function scoreBandLabel(score: number): string {
  if (score >= 85) return 'Strong match';
  if (score >= 65) return 'Good overlap';
  if (score >= 45) return 'Mixed';
  if (score >= 25) return 'Low overlap';
  return 'Very different';
}

export type GapItem = {
  questionId: string;
  question: string;
  dimension: Dimension;
  you: number;
  them: number;
};

export function computeMeaningfulGaps(
  myResponses: AnswerLike[],
  theirResponses: AnswerLike[],
  questions: QuestionRow[],
  myRelationshipTowardThem: RelationshipType | null
): GapItem[] {
  const allowed = new Set(dimensionsForRelationship(myRelationshipTowardThem));
  const mine = new Map(myResponses.map((r) => [r.question_id, r]));
  const theirs = new Map(theirResponses.map((r) => [r.question_id, r]));
  const out: GapItem[] = [];

  for (const q of questions) {
    if (q.match_type !== 'S' || !q.is_primary) continue;
    if (!allowed.has(q.dimension)) continue;
    const ra = mine.get(q.id)?.answer;
    const rb = theirs.get(q.id)?.answer;
    if (ra == null || rb == null) continue;
    if (Math.abs(ra - rb) >= MEANINGFUL_GAP) {
      out.push({
        questionId: q.id,
        question: q.question,
        dimension: q.dimension,
        you: ra,
        them: rb,
      });
    }
  }
  return out;
}
