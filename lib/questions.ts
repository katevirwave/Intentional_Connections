/** Short labels for self profile list (primary construct). */
export const QUESTION_SHORT_LABELS: Record<string, string> = {
  'VB-01': 'Honesty vs kindness in feedback',
  'VB-02': 'Keeping commitments',
  'VB-03': 'Personal growth priority',
  'VB-04': 'Default trust in people',
  'VB-05': 'Financial security in decisions',
  'CS-01': 'Talk when upset vs wait',
  'CS-02': 'Process before sharing feelings',
  'CS-03': 'Care through actions vs words',
  'CS-04': 'Straight talk vs hints',
  'CS-05': 'Check-ins when nothing is wrong',
  'ES-01': 'Naming your own emotions',
  'ES-02': 'Picking up others moods',
  'ES-03': 'Bouncing back after conflict',
  'ES-04': 'Need for reassurance',
  'ES-05': 'Ease of apologising',
  'LS-01': 'Structure vs spontaneity',
  'LS-02': 'Recharge alone vs with people',
  'LS-03': 'Physical activity centrality',
  'LS-04': 'Experiences vs things',
  'LS-05': 'Tidy spaces',
  'IP-01': 'Snack that makes your day',
  'IP-02': 'Free Saturday morning',
  'IP-03': 'Support when stressed',
  'IP-04': 'Small comfort ritual',
  'IP-05': 'Celebrating good news',
};

const bands = {
  low: 'Scores on the lower end here often mean one approach; the higher end leans the other way.',
  mid: 'Mid scores can flex either way depending on context.',
  high: 'Scores on the higher end here often describe a clear preference.',
};

function bandFor(answer: number): 'low' | 'mid' | 'high' {
  if (answer <= 2) return 'low';
  if (answer === 3) return 'mid';
  return 'high';
}

/** Self-insight after answering (spec tone: descriptive, not judgmental). */
export function getSelfInsight(questionId: string, answer: number): string {
  const b = bandFor(answer);
  switch (questionId) {
    case 'CS-04':
      if (answer >= 4) {
        return 'People who score 4–5 here tend to value directness. They find indirect communication exhausting and prefer to know where they stand.';
      }
      if (answer <= 2) {
        return 'People who score 1–2 here often read between the lines well and may prefer subtlety over bluntness.';
      }
      return 'You may shift between direct and indirect communication depending on the situation.';
    case 'CS-01':
      if (answer >= 4) return 'You tend to want to address tension soon after it shows up.';
      if (answer <= 2) return 'You often need time before you are ready to talk things through.';
      return bands.mid;
    case 'VB-01':
      if (answer >= 4) return 'You tend to value truth-telling in relationships, even when it is uncomfortable.';
      if (answer <= 2) return 'You often prioritise kindness and care in how feedback lands.';
      return bands.mid;
    case 'VB-02':
      if (answer >= 4) return 'Reliability and follow-through feel core to how you relate to people.';
      if (answer <= 2) return 'You may be more flexible when plans or commitments shift.';
      return bands.high;
    default:
      return b === 'low' ? bands.low : b === 'high' ? bands.high : bands.mid;
  }
}

/** Copy for “what’s different” — light tendency lines (not verdicts). */
export function tendencyLine(questionId: string, role: 'you' | 'them', answer: number): string {
  const hi = answer >= 4;
  const lo = answer <= 2;
  const map: Record<string, { youHi: string; youLo: string }> = {
    'CS-01': {
      youHi: 'You tend to want to address things soon when you are upset.',
      youLo: 'You tend to need processing time before talking it through.',
    },
    'CS-04': {
      youHi: 'You tend to prefer people to say things plainly.',
      youLo: 'You may be more comfortable with nuance and indirect cues.',
    },
  };
  const entry = map[questionId];
  if (!entry) {
    return hi
      ? role === 'you'
        ? 'You lean toward the higher end of this scale.'
        : 'They lean toward the higher end of this scale.'
      : lo
        ? role === 'you'
          ? 'You lean toward the lower end of this scale.'
          : 'They lean toward the lower end of this scale.'
        : role === 'you'
          ? 'You are around the middle on this one.'
          : 'They are around the middle on this one.';
  }
  if (role === 'you') {
    return hi ? entry.youHi : lo ? entry.youLo : 'You sit toward the middle here.';
  }
  return hi ? entry.youHi.replace('You', 'They') : lo ? entry.youLo.replace('You', 'They') : 'They sit toward the middle here.';
}

export const RELATIONSHIP_LABELS: Record<string, string> = {
  romantic: 'Romantic partner',
  friend: 'Close friend',
  family: 'Family',
  work: 'Work / Colleague',
  general: 'Not sure yet',
};

export const CONNECTION_UI_LABEL: Record<string, string> = {
  romantic: 'Partner',
  friend: 'Friend',
  family: 'Family',
  work: 'Colleague',
  general: 'Connection',
};
