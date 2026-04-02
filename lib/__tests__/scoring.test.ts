import {
  DIMENSION_UNLOCK_SHARED,
  MEANINGFUL_GAP,
  SCORE_THRESHOLD_SHARED,
  computeCompatibility,
  computeMeaningfulGaps,
  dimensionsForRelationship,
  questionScore,
  scoreBandLabel,
} from '@/lib/scoring';
import type { QuestionRow, ResponseRow } from '@/lib/types';

const q = (partial: Partial<QuestionRow> & Pick<QuestionRow, 'id' | 'dimension'>): QuestionRow => ({
  id: partial.id,
  question: partial.question ?? 'q',
  dimension: partial.dimension,
  match_type: partial.match_type ?? 'S',
  weight: partial.weight ?? 1,
  display_order: partial.display_order ?? 1,
  variant_group: partial.variant_group ?? null,
  is_primary: partial.is_primary ?? true,
});

describe('questionScore', () => {
  it('matches spec table (1–5 scale, max diff 4)', () => {
    expect(questionScore(3, 3)).toBe(100);
    expect(questionScore(3, 4)).toBe(75);
    expect(questionScore(3, 5)).toBe(50);
    expect(questionScore(2, 5)).toBe(25);
    expect(questionScore(1, 5)).toBe(0);
  });
});

describe('dimensionsForRelationship', () => {
  it('returns scored dimensions per relationship type', () => {
    expect(dimensionsForRelationship('romantic')).toEqual(['values', 'communication', 'emotional', 'lifestyle']);
    expect(dimensionsForRelationship('friend')).toEqual(['values', 'communication', 'emotional']);
    expect(dimensionsForRelationship('family')).toEqual(['values', 'emotional']);
    expect(dimensionsForRelationship('work')).toEqual(['communication']);
    expect(dimensionsForRelationship('general')).toEqual(['values']);
  });
});

describe('computeCompatibility', () => {
  const questions: QuestionRow[] = [
    q({ id: 'VB-01', dimension: 'values', weight: 1.5 }),
    q({ id: 'CS-01', dimension: 'communication', weight: 1.3 }),
    q({ id: 'ES-01', dimension: 'emotional', weight: 1.2 }),
  ];

  const likert = (question_id: string, answer: number): Pick<ResponseRow, 'question_id' | 'answer'> => ({
    question_id,
    answer,
  });

  it('returns null overall until shared scored answers reach threshold', () => {
    const mine = [likert('VB-01', 4), likert('CS-01', 4)];
    const theirs = [likert('VB-01', 4), likert('CS-01', 2)];
    const r = computeCompatibility(mine, theirs, questions, 'romantic');
    expect(r.questionsScored).toBe(2);
    expect(r.overall).toBeNull();
  });

  it('computes weighted overall when threshold met', () => {
    const mine = [likert('VB-01', 4), likert('CS-01', 4), likert('ES-01', 4)];
    const theirs = [likert('VB-01', 4), likert('CS-01', 4), likert('ES-01', 4)];
    const r = computeCompatibility(mine, theirs, questions, 'romantic');
    expect(r.questionsScored).toBeGreaterThanOrEqual(SCORE_THRESHOLD_SHARED);
    expect(r.overall).toBe(100);
  });

  it('respects relationship dimension filter (work)', () => {
    const wide = [
      q({ id: 'VB-01', dimension: 'values', weight: 1.5 }),
      q({ id: 'CS-01', dimension: 'communication', weight: 1.3 }),
    ];
    const mine = [likert('VB-01', 1), likert('CS-01', 5)];
    const theirs = [likert('VB-01', 5), likert('CS-01', 5)];
    const r = computeCompatibility(mine, theirs, wide, 'work');
    expect(r.questionsScored).toBe(1);
    expect(r.overall).toBeNull();
  });

  it('locks dimension scores until enough shared answers in that dimension', () => {
    const qs = [
      q({ id: 'VB-01', dimension: 'values', weight: 1.5 }),
      q({ id: 'VB-02', dimension: 'values', weight: 1.5 }),
      q({ id: 'CS-01', dimension: 'communication', weight: 1.3 }),
    ];
    const mine = [likert('VB-01', 4), likert('VB-02', 4), likert('CS-01', 4)];
    const theirs = [likert('VB-01', 4), likert('VB-02', 4), likert('CS-01', 4)];
    const r = computeCompatibility(mine, theirs, qs, 'romantic');
    expect(r.dimensionCounts.values).toBe(2);
    expect(r.dimensionScores.values).toBeNull();
    expect(DIMENSION_UNLOCK_SHARED).toBe(3);
  });
});

describe('computeMeaningfulGaps', () => {
  it('includes pairs with diff >= MEANINGFUL_GAP', () => {
    const questions: QuestionRow[] = [q({ id: 'CS-01', dimension: 'communication', weight: 1.3 })];
    const mine = [{ question_id: 'CS-01', answer: 5 }];
    const theirs = [{ question_id: 'CS-01', answer: 1 }];
    const gaps = computeMeaningfulGaps(mine, theirs, questions, 'romantic');
    expect(gaps).toHaveLength(1);
    expect(MEANINGFUL_GAP).toBe(2);
  });
});

describe('scoreBandLabel', () => {
  it('maps bands from spec', () => {
    expect(scoreBandLabel(90)).toBe('Strong match');
    expect(scoreBandLabel(70)).toBe('Good overlap');
    expect(scoreBandLabel(50)).toBe('Mixed');
    expect(scoreBandLabel(30)).toBe('Low overlap');
    expect(scoreBandLabel(10)).toBe('Very different');
  });
});
