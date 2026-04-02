# Intentional Connections — Full Product & Technical Spec

> **What it is:** A compatibility app for all relationship types — romantic, friendship, family, and work. Users answer questions privately. The app scores how well two people understand and complement each other, shown as a number out of 100. The score is never the point — the insight is.

---

## Table of Contents

1. [Vision](#1-vision)
2. [Core Concept](#2-core-concept)
3. [The Algorithm](#3-the-algorithm)
4. [Relationship Types & Match Modes](#4-relationship-types--match-modes)
5. [Question Library](#5-question-library)
6. [Scoring & Compatibility Display](#6-scoring--compatibility-display)
7. [User Flows & Screens](#7-user-flows--screens)
8. [Profile & Onboarding](#8-profile--onboarding)
9. [Groups & Multi-Person Mode](#9-groups--multi-person-mode)
10. [Privacy Model](#10-privacy-model)
11. [Database Schema](#11-database-schema)
12. [Key RPCs / API Design](#12-key-rpcs--api-design)
13. [MVP Build Plan (2-Day Sprint)](#13-mvp-build-plan-2-day-sprint)
14. [Phase 2 Roadmap](#14-phase-2-roadmap)
15. [Open Questions](#15-open-questions)

---

## 1. Vision

Most relationship apps try to match people before they know each other. 100 works differently: it helps people who already have (or want) a relationship understand each other more accurately.

The score is not a verdict. It's a conversation starter. A 62 between two friends says: "there are 38 points worth talking about." A 91 between colleagues says: "you probably work the same way — here's how."

**Three things 100 is not:**
- Not a dating app (though it works for that)
- Not a personality test (answers change, people change)
- Not a compatibility judge (low score ≠ bad relationship)

**One thing 100 always is:**
- A tool for genuine understanding between two or more people

---

## 2. Core Concept

### How It Works

1. User creates an account and sets up their profile
2. User answers a short daily question (1 per day, ~30 seconds)
3. User connects with someone else using a share code or link
4. When both have answered enough shared questions, a compatibility score appears
5. The score updates automatically as both answer more questions
6. Users can view which specific answers drove the score up or down
7. Optional: join a group to see group-level dynamics (family, friend group, team)

### The Core Promise

> "You'll understand the people in your life better than you did yesterday."

---

## 3. The Algorithm

### Fixed Scoring Formula

The original pilot used `score = 100 / |diff|` — this is broken. It gives a perfect 100 for diff=0 and diff=1 identically, inflates scores across the board, and breaks entirely at diff=0 (division by zero).

**Correct formula:**

```
score = 100 × (1 − |diff| / max_diff)
```

Where:
- `diff` = |user_A_answer − user_B_answer|
- `max_diff` = maximum possible difference on the scale = 4 (for a 1–5 scale)
- Score range: 0–100 (true floor and ceiling)

| Answer A | Answer B | diff | Score |
|----------|----------|------|-------|
| 3        | 3        | 0    | 100   |
| 3        | 4        | 1    | 75    |
| 3        | 5        | 2    | 50    |
| 2        | 5        | 3    | 25    |
| 1        | 5        | 4    | 0     |

### Match Types

Questions are categorised into three match types (from source research):

**Type S — Similarity** (categories C, D, E in original research)
Both users' answers should be close. High alignment = high score. Used for: values, communication style, lifestyle preferences, emotional needs.

```python
score = 100 × (1 − |diff| / 4)
```

**Type I — Individual** (categories F, G, H, I, J in original research)
No "correct" alignment. Answers are recorded for transparency and self-awareness, not scored against each other. Used for: personal habits, individual goals, solo preferences.

```
score = N/A  (answer shown to partner, not scored)
```

**Type C — Complementarity** (category K in original research — deferred to Phase 2)
Opposites score higher. Used for: role dynamics, decision-making style.

```python
score = |diff| × 25
```

### Overall Compatibility Score

```
overall_score = sum(question_score × question_weight) / sum(question_weight)
```

Only questions answered by BOTH users are included in the score. Minimum 3 shared answers required before a score is shown.

**Default weights by dimension:**

| Dimension        | Weight | Rationale                          |
|-----------------|--------|------------------------------------|
| Values & beliefs | 1.5    | Highest long-term impact           |
| Communication    | 1.3    | Direct day-to-day friction source  |
| Emotional style  | 1.2    | Key for conflict resolution        |
| Lifestyle        | 1.0    | Adaptable over time                |
| Individual pref  | 0.0    | Not scored, just shown             |

> **Note:** Weights are defaults only. They should be validated against real user data before treating them as fixed. Do not adjust weights without data to support the change.

### Score Bands

| Score | Label         | What it means                                              |
|-------|---------------|------------------------------------------------------------|
| 85–100 | Strong match  | High alignment on answered questions so far                |
| 65–84  | Good overlap  | More in common than not; some areas to explore             |
| 45–64  | Mixed         | Meaningful differences — worth understanding               |
| 25–44  | Low overlap   | Significant gaps — high effort, potentially high reward    |
| 0–24   | Very different | Major differences across most dimensions answered          |

---

## 4. Relationship Types & Match Modes

Users assign a relationship type when connecting with someone. This controls which question dimensions are scored and what language is used in the UI.

| Type          | Scored Dimensions              | Not Scored          | Label in UI     |
|---------------|-------------------------------|---------------------|-----------------|
| Romantic      | All (Values, Comms, Emotional, Lifestyle) | Individual | Partner         |
| Close Friend  | Values, Communication, Emotional | Lifestyle (shown, not scored) | Friend |
| Family        | Values, Emotional              | Communication style, Lifestyle | Family |
| Work          | Communication, Individual style | Emotional, Lifestyle | Colleague      |
| General       | Values only (until type is set) | All others          | Connection      |

### 1-on-1 vs Group Mode

**1-on-1:** Two users connected directly. Score is private to both of them.

**Group Mode:** 3–12 users in a named group. Score shown as:
- Individual pair scores (if both have answered enough)
- Group cohesion score = average of all pair scores
- Group radar chart showing which dimensions the group is strongest/weakest on

---

## 5. Question Library

### Scale

All scored questions use a 1–5 Likert scale:

```
1 = Strongly disagree / Never
2 = Disagree / Rarely
3 = Neutral / Sometimes
4 = Agree / Often
5 = Strongly agree / Always
```

### Answer Collection Rules

- One question per day per user
- Questions are served in randomised order within each dimension block
- Users can skip (skip counts as unanswered — does not count toward score)
- Users can edit a past answer — editing flags the question as `is_stale = true` and notifies connected users (not their answer, just that it changed)
- No time pressure — users tap to confirm when ready

### Question Set (v1)

All questions derived from the original pilot research file. Each question has a primary phrasing and 2 backup variants (to protect from copying and reduce response fatigue on re-use).

---

#### Dimension: Values & Beliefs (Match Type: S)

**VB-01**
> "I think honesty is more important than kindness when giving someone feedback."

Variants:
- "When someone asks for my opinion, I'd rather be truthful than protective of their feelings."
- "I value directness over diplomacy in close relationships."

---

**VB-02**
> "I feel strongly that people should keep their commitments, even when it's inconvenient."

Variants:
- "Following through on plans matters a lot to me, even small ones."
- "Reliability is one of the most important qualities a person can have."

---

**VB-03**
> "I believe personal growth should be an ongoing priority in life."

Variants:
- "Improving myself is something I actively think about and work on."
- "I'd rather grow slowly than stay comfortable."

---

**VB-04**
> "I think people are fundamentally good and trustworthy until proven otherwise."

Variants:
- "I tend to give people the benefit of the doubt in new relationships."
- "My default is to trust people before I have reason not to."

---

**VB-05**
> "Financial security is a top priority for me in how I make life decisions."

Variants:
- "I make most major life choices with financial stability as a key consideration."
- "I'd rather have financial security than take big financial risks."

---

#### Dimension: Communication Style (Match Type: S)

**CS-01**
> "When I'm upset, I prefer to talk about it straight away rather than wait."

Variants:
- "I find it easier to address conflict immediately rather than sit with it."
- "I'd rather bring something up as soon as it bothers me."

---

**CS-02**
> "I like to think through my feelings before sharing them."

Variants:
- "I usually need time to process before I can talk about how I feel."
- "I find it hard to express emotions in the moment — I need to reflect first."

---

**CS-03**
> "I express care through doing things for people more than through words."

Variants:
- "Acts of service feel more meaningful to me than verbal affirmations."
- "I show people I love them mostly through what I do, not what I say."

---

**CS-04**
> "I prefer straightforward conversations over hints and subtlety."

Variants:
- "I'd rather someone tell me directly what they want or need."
- "I find indirect communication frustrating — I prefer people to just say it."

---

**CS-05**
> "I check in on the people I care about often, even when nothing is wrong."

Variants:
- "Reaching out regularly — just to see how someone is — comes naturally to me."
- "Staying in touch without a specific reason is something I do a lot."

---

#### Dimension: Emotional Style (Match Type: S)

**ES-01**
> "I find it easy to identify and name my own emotions."

Variants:
- "I usually know what I'm feeling and can describe it clearly."
- "Emotional self-awareness comes naturally to me."

---

**ES-02**
> "I tend to feel other people's emotions strongly — their mood affects mine."

Variants:
- "I pick up on how others are feeling and it often influences how I feel."
- "I would describe myself as emotionally sensitive to the people around me."

---

**ES-03**
> "I recover from disappointment or conflict fairly quickly."

Variants:
- "Difficult emotions don't usually linger for me for very long."
- "I bounce back from setbacks faster than most people I know."

---

**ES-04**
> "I need regular reassurance in close relationships to feel secure."

Variants:
- "Check-ins and expressions of care from people close to me matter a lot."
- "I feel more settled in relationships when people express their feelings toward me."

---

**ES-05**
> "I find it easy to apologise when I've made a mistake."

Variants:
- "Saying sorry doesn't feel threatening or difficult to me."
- "I can admit I'm wrong without it feeling like a loss."

---

#### Dimension: Lifestyle (Match Type: S)

**LS-01**
> "I prefer a structured, planned lifestyle over a spontaneous one."

Variants:
- "I feel better when I know what's coming and have a plan."
- "Routines and predictability help me feel calm."

---

**LS-02**
> "I recharge by spending time alone rather than with others."

Variants:
- "After a busy social period, I need solo time to feel like myself again."
- "I'm more of an introvert — people energise me less than solitude does."

---

**LS-03**
> "Physical activity and health are central to how I live my life."

Variants:
- "Exercise and taking care of my body are a regular part of my week."
- "I prioritise being physically active on most days."

---

**LS-04**
> "I prefer to spend money on experiences rather than things."

Variants:
- "A trip or event feels more valuable to me than buying something new."
- "Memories matter more to me than possessions."

---

**LS-05**
> "I like my living and working spaces to be tidy and organised."

Variants:
- "A cluttered environment makes it harder for me to think or relax."
- "I feel more at ease when my space is clean and ordered."

---

#### Dimension: Individual Preferences (Match Type: I — shown, not scored)

**IP-01**
> "What's a snack or food that genuinely makes your day better?"

*Free text. Detail prompt: "What specifically about it? The taste, the ritual, a memory attached to it?"*

---

**IP-02**
> "How do you prefer to spend a completely free Saturday morning?"

*Free text. Detail prompt: "What does that actually look like — where are you, what are you doing?"*

---

**IP-03**
> "What's the best way someone could support you when you're stressed?"

*Free text. Detail prompt: "What does that support actually look like in practice?"*

---

**IP-04**
> "What's a small thing that you do regularly that brings you genuine comfort?"

*Free text. Detail prompt: "How often do you do it, and what does it feel like when you do?"*

---

**IP-05**
> "How do you like to celebrate good news — big or small?"

*Free text. Detail prompt: "Give an example of something that happened recently and how you marked it."*

---

### Total Questions (v1)

| Dimension           | Scored Questions | Individual Questions | Total |
|---------------------|-----------------|----------------------|-------|
| Values & Beliefs    | 5               | 0                    | 5     |
| Communication Style | 5               | 0                    | 5     |
| Emotional Style     | 5               | 0                    | 5     |
| Lifestyle           | 5               | 0                    | 5     |
| Individual Prefs    | 0               | 5                    | 5     |
| **Total**           | **20**          | **5**                | **25**|

Each scored question has 2 backup variants = 60 total scored phrasings in the bank.

---

## 6. Scoring & Compatibility Display

### What the User Sees

**Before minimum threshold (< 3 shared answers):**
> "You both need to answer a few more questions before your score appears. Come back tomorrow."

**At threshold (3+ shared answers):**
```
[Name]
──────────────────────
        72 / 100
──────────────────────
  Values ████████░░  78
  Comms  ██████░░░░  62
  Emotional ███████░  74
  Lifestyle  (3 more to unlock)
──────────────────────
  Based on 9 shared answers
```

**Dimension locked message:** "Answer 3 more questions in this area to unlock."

### What the Score Does NOT Say

The app never says:
- "You are a good match"
- "You are incompatible"
- "This person is wrong for you"

The app always frames as:
- "Based on what you've both shared so far..."
- "This reflects your answers on X dimension"
- "Your scores can change as you share more"

### Score Update Behaviour

- Score recalculates automatically every time either user submits a new answer
- If a user edits a past answer: score recalculates silently, no notification to partner (the answer changed, not the relationship)
- If score changes by more than 5 points: push notification — "Your compatibility with [Name] just updated."

---

## 7. User Flows & Screens

### Screen 1: Onboarding (First Open)

```
[Logo]

"Understand the people in your life."

[Create account]
[Log in]
```

No marketing copy about "matching" or "finding love." Neutral framing from day one.

---

### Screen 2: Account Setup

```
Your first name
[            ]

Your birthday (age is shown to connections, not full DOB)
[            ]

Continue →
```

Email + password or Apple/Google sign-in. No photos required at signup.

---

### Screen 3: First Question (Day 1)

Immediately after account creation. No tutorial. Drop them into the product.

```
[Question card]

"I prefer straightforward conversations over hints and subtlety."

  1    2    3    4    5
Never         Always

[Submit answer]
```

After submitting:

```
Your answer: 4

"People who score 4–5 here tend to value directness.
They find indirect communication exhausting and
prefer to know where they stand."

[That's me →]
```

This is the self-insight hook. They see value before they've connected with anyone.

---

### Screen 4: Home (after first answer)

```
[Your profile score card — partial, fills as you answer more]

Today's question →

[Your connections — empty state]
  "Share your code to connect with someone."
  Code: XK7-91R
  [Copy link]  [Share]
```

---

### Screen 5: Connection Flow

**Sender:**
```
[Choose how you know them]
  ○ Romantic partner
  ○ Close friend
  ○ Family
  ○ Work / Colleague
  ○ Not sure yet

[Send link / share code]
```

**Receiver (opening invite link):**
```
[Name] wants to connect with you on 100.

They've described your relationship as: Close Friend

[Accept]  [Decline]
```

Receiver can change the relationship type on their end before accepting.

---

### Screen 6: Connection Profile

```
[Name]  |  Close Friend  |  Since March 2026

        72 / 100

Values     ████████░░  78
Comms      ██████░░░░  62
Emotional  ███████░░░  74
Lifestyle  — (3 more)

[See what's different]
[See what you share]

Based on 9 shared answers. Updated 2 days ago.
```

---

### Screen 7: "See What's Different"

Shows only questions where diff ≥ 2 (meaningful gap):

```
On: "I prefer to talk when upset rather than wait"
  You: 4  |  Them: 1

  They tend to need processing time before talking.
  You tend to want to address things immediately.

  [Neither is wrong — this is just worth knowing.]
```

No judgement copy. No suggested fixes. Just the truth.

---

### Screen 8: Individual Preference Answers

```
[Name]'s answer to:
"What's a snack that genuinely makes your day better?"

"Salt and vinegar crisps — specifically the Tyrells ones.
It's the ritual of opening them more than anything else,
like a reward after a hard thing."

[Mark as read]
```

Acknowledgement mechanic: tapping "Mark as read" confirms you've seen this. If they update their answer later, your read mark is cleared and a dot appears on their profile.

---

### Screen 9: Self Profile

```
[Your name]  |  "Your answers so far"

Values
  VB-01  You answered: 4
  "Honesty over kindness in feedback"
  → You tend to value truth-telling in relationships

  VB-02  You answered: 5
  "Keeping commitments even when inconvenient"
  → Reliability is a core value for you

Communication
  CS-01  You answered: 4
  ...

[Answer more questions to reveal more of your profile →]
```

This is always visible to the user. No minimum answers required to see your own profile.

---

## 8. Profile & Onboarding

### Profile Fields

| Field          | Required | Visible To         |
|----------------|----------|--------------------|
| First name     | Yes      | All connections    |
| Age (not DOB)  | Yes      | All connections    |
| Profile photo  | No       | All connections    |
| Bio (140 chars)| No       | All connections    |
| City           | No       | All connections    |
| Answers        | Yes      | Only matched connections (by dimension) |

### Age Gating

Users under 16 are blocked from creating an account. This is enforced at account creation via DOB input, not self-declaration.

Users 16–17: romantic relationship type is disabled. Only friendship, family, and work types are available.

### Onboarding Sequence

| Day | Event |
|-----|-------|
| Day 0 | Sign up → first question → self insight → home screen |
| Day 1 | Second question → self profile begins to populate |
| Day 3 | Nudge to share code if no connections yet |
| Day 7 | First score available (if connected user has also answered 3+ shared questions) |

No forced tutorial. No onboarding checklist. The product teaches itself.

---

## 9. Groups & Multi-Person Mode

### Group Types

| Group Type  | Max Size | Score Shown         | Use Case                    |
|-------------|----------|---------------------|-----------------------------|
| Couple      | 2        | 1-on-1 only         | Partners                    |
| Friend Group | 2–8     | All pairs + group avg | Friend circles             |
| Family      | 2–12     | All pairs + group avg | Households, close family   |
| Team        | 2–12     | All pairs + group avg | Work teams, housemates     |

### Group Creation

```
[Create group]

Name this group: [          ]

Type:
  ○ Friend group
  ○ Family
  ○ Team

Invite members: [Share link / code]
```

Group creator sets the type. Members see the type before accepting.

### Group Cohesion Score

```
Group cohesion score = mean of all pair scores within the group

Example (4 members, 6 pairs):
  A-B: 78   A-C: 65   A-D: 70
  B-C: 82   B-D: 55   C-D: 88

  Group cohesion: (78+65+70+82+55+88) / 6 = 73
```

Only pairs with 3+ shared answers contribute to cohesion score. Pairs below threshold are excluded and noted: "2 members still need more shared answers."

### Group Radar View

Visual showing group strengths/weaknesses by dimension. Only shown when 60% of possible pairs have enough answers to score.

---

## 10. Privacy Model

### What Connections See

A connection can only see:
- Your answers on dimensions that match your relationship type (see Section 4)
- Whether you've updated an answer (not what the new answer is, just that it changed)
- Your individual preference answers (IP-01 to IP-05) — shown in full, not scored

A connection can NEVER see:
- Your answers on dimensions excluded for their relationship type
- Your answers in a different connection's relationship type
- Your email address, full DOB, or any other account field

### What Work/Colleague Connections See

Work connections are hardcoded to see Communication and Individual Preference answers only. Emotional and Lifestyle dimensions are never shown to work connections — this is enforced server-side, not a setting the user can change.

### Groups and Privacy

If you are in both a Friend Group and a Work Group with the same person:
- Their Friend Group view shows: Values, Communication, Emotional, Lifestyle
- Their Work Group view shows: Communication, Individual Prefs only
- Both scores are separate and do not bleed across group types

### Data Deletion

Users can delete their account at any time. Deletion:
- Removes all their answers from all shared scores immediately
- Removes them from all groups
- Notifies connections only that "[Name] has left 100" — no reason given
- All data is hard-deleted within 30 days (not soft-deleted)

### GDPR Disclosure (shown once at signup, stored as accepted_at timestamp)

> "Your answers are used only to calculate compatibility with people you choose to connect with. We do not share your answers with employers, advertisers, or any third party. You can delete your account and all your data at any time from Settings."

---

## 11. Database Schema

### `users`
```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  first_name  TEXT NOT NULL,
  birth_date  DATE NOT NULL,
  photo_url   TEXT,
  bio         TEXT CHECK (char_length(bio) <= 140),
  city        TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  gdpr_accepted_at TIMESTAMPTZ
);
```

### `share_codes`
```sql
CREATE TABLE share_codes (
  code        TEXT PRIMARY KEY,           -- e.g. "XK7-91R"
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  expires_at  TIMESTAMPTZ                 -- NULL = never expires
);
```

### `connections`
```sql
CREATE TABLE connections (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a           UUID REFERENCES users(id) ON DELETE CASCADE,
  user_b           UUID REFERENCES users(id) ON DELETE CASCADE,
  relationship_type_a TEXT CHECK (relationship_type_a IN ('romantic','friend','family','work','general')),
  relationship_type_b TEXT CHECK (relationship_type_b IN ('romantic','friend','family','work','general')),
  status           TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','declined','removed')),
  connected_at     TIMESTAMPTZ,
  UNIQUE(user_a, user_b)
);
```

> `relationship_type_a` is how user_a categorises user_b, and vice versa. They can differ.

### `questions`
```sql
CREATE TABLE questions (
  id           TEXT PRIMARY KEY,           -- e.g. "VB-01"
  question     TEXT NOT NULL,
  dimension    TEXT NOT NULL CHECK (dimension IN ('values','communication','emotional','lifestyle','individual')),
  match_type   TEXT NOT NULL CHECK (match_type IN ('S','I','C')),
  weight       NUMERIC DEFAULT 1.0,
  display_order INT,
  variant_group TEXT,                      -- groups all phrasings of the same construct
  is_primary   BOOLEAN DEFAULT true        -- false = backup variant
);
```

### `responses`
```sql
CREATE TABLE responses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id  TEXT REFERENCES questions(id),
  answer       SMALLINT CHECK (answer BETWEEN 1 AND 5),
  answer_text  TEXT,                       -- for Type I (free text) questions
  answered_at  TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ,
  is_stale     BOOLEAN DEFAULT false,      -- true when answer has been edited
  UNIQUE(user_id, question_id)
);
```

### `compatibility_scores` (cache)
```sql
CREATE TABLE compatibility_scores (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id    UUID REFERENCES connections(id) ON DELETE CASCADE,
  dimension        TEXT,                   -- NULL = overall score
  score            NUMERIC(5,2),
  questions_scored INT,
  calculated_at    TIMESTAMPTZ DEFAULT now()
);
```

### `groups`
```sql
CREATE TABLE groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('couple','friends','family','team')),
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

### `group_members`
```sql
CREATE TABLE group_members (
  group_id    UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','declined')),
  joined_at   TIMESTAMPTZ,
  PRIMARY KEY (group_id, user_id)
);
```

### Row-Level Security (RLS)

All tables have RLS enabled. Key policies:

```sql
-- Users can only read their own responses
CREATE POLICY "own_responses" ON responses
  FOR SELECT USING (user_id = auth.uid());

-- Users can read a connection's responses only for permitted dimensions
-- (enforced via RPC, not direct table access)
```

---

## 12. Key RPCs / API Design

### `get_next_question(p_user_id)`

Returns the next unanswered question for today. Returns NULL if user has already answered today's question.

```sql
CREATE OR REPLACE FUNCTION get_next_question(p_user_id UUID)
RETURNS TABLE (
  question_id TEXT,
  question    TEXT,
  dimension   TEXT,
  match_type  TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT q.id, q.question, q.dimension, q.match_type
  FROM questions q
  WHERE q.is_primary = true
    AND NOT EXISTS (
      SELECT 1 FROM responses r
      WHERE r.user_id = p_user_id
        AND r.question_id = q.id
    )
  ORDER BY q.display_order
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### `get_compatibility_score(p_user_id, p_other_user_id)`

Calculates and returns live compatibility score. Respects relationship type to determine which dimensions to include.

```sql
CREATE OR REPLACE FUNCTION get_compatibility_score(
  p_user_id       UUID,
  p_other_user_id UUID
)
RETURNS TABLE (
  overall_score      NUMERIC,
  questions_scored   INT,
  dimension_scores   JSONB
) AS $$
DECLARE
  v_rel_type  TEXT;
  v_dims      TEXT[];
BEGIN
  -- Get the relationship type user_a uses for user_b
  SELECT relationship_type_a INTO v_rel_type
  FROM connections
  WHERE user_a = p_user_id AND user_b = p_other_user_id
     OR user_a = p_other_user_id AND user_b = p_user_id
  LIMIT 1;

  -- Map relationship type to allowed dimensions
  v_dims := CASE v_rel_type
    WHEN 'romantic'  THEN ARRAY['values','communication','emotional','lifestyle']
    WHEN 'friend'    THEN ARRAY['values','communication','emotional']
    WHEN 'family'    THEN ARRAY['values','emotional']
    WHEN 'work'      THEN ARRAY['communication']
    ELSE                  ARRAY['values']
  END;

  RETURN QUERY
  SELECT
    ROUND(
      SUM((1 - ABS(r_a.answer - r_b.answer)::NUMERIC / 4) * 100 * q.weight)
      / NULLIF(SUM(q.weight), 0),
    1) AS overall_score,
    COUNT(*)::INT AS questions_scored,
    jsonb_object_agg(
      q.dimension,
      ROUND(AVG((1 - ABS(r_a.answer - r_b.answer)::NUMERIC / 4) * 100), 1)
    ) AS dimension_scores
  FROM responses r_a
  JOIN responses r_b ON r_a.question_id = r_b.question_id
  JOIN questions q   ON q.id = r_a.question_id
  WHERE r_a.user_id = p_user_id
    AND r_b.user_id = p_other_user_id
    AND q.match_type = 'S'
    AND q.dimension = ANY(v_dims)
    AND q.is_primary = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### `get_group_cohesion(p_group_id)`

Returns cohesion score + per-pair breakdown for a group.

```sql
CREATE OR REPLACE FUNCTION get_group_cohesion(p_group_id UUID)
RETURNS TABLE (
  user_a         UUID,
  user_b         UUID,
  pair_score     NUMERIC,
  questions_used INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gm1.user_id AS user_a,
    gm2.user_id AS user_b,
    (SELECT overall_score FROM get_compatibility_score(gm1.user_id, gm2.user_id)) AS pair_score,
    (SELECT questions_scored FROM get_compatibility_score(gm1.user_id, gm2.user_id)) AS questions_used
  FROM group_members gm1
  JOIN group_members gm2
    ON gm1.group_id = gm2.group_id AND gm1.user_id < gm2.user_id
  WHERE gm1.group_id = p_group_id
    AND gm1.status = 'active'
    AND gm2.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### `mark_answer_read(p_reader_id, p_owner_id, p_question_id)`

Records that a user has read their connection's individual preference answer.

```sql
CREATE OR REPLACE FUNCTION mark_answer_read(
  p_reader_id   UUID,
  p_owner_id    UUID,
  p_question_id TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO answer_reads (reader_id, owner_id, question_id, read_at)
  VALUES (p_reader_id, p_owner_id, p_question_id, now())
  ON CONFLICT (reader_id, owner_id, question_id)
  DO UPDATE SET read_at = now(), is_cleared = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 13. MVP Build Plan (2-Day Sprint)

### What to Ship on Day 1

| Feature                         | Notes                                    |
|--------------------------------|------------------------------------------|
| Auth (email + Apple/Google)    | Supabase Auth — 30 min                   |
| Account setup screen           | Name + DOB only                          |
| First question flow            | One question, one insight, done          |
| Home screen                    | Today's question card + share code       |
| Share code / connection invite  | Static code + deep link                  |
| Connection acceptance flow     | Choose relationship type, accept/decline |
| Answer submission              | Supabase insert to responses             |

### What to Ship on Day 2

| Feature                         | Notes                                    |
|--------------------------------|------------------------------------------|
| Compatibility score display    | Requires 3 shared answers — add gate    |
| Dimension breakdown            | Simple progress bars per dimension       |
| "What's different" screen      | Filter to diff ≥ 2 questions             |
| Self profile view              | Your own answers with insight text       |
| Individual preference answers  | Free text + "Mark as read"               |
| Push notifications             | New connection, score update             |

### What NOT to Build in MVP

- Groups (Phase 2)
- Complementarity (Type C) scoring (Phase 2)
- Profile photos (Phase 2)
- Group radar chart (Phase 2)
- Any discovery / browse / matching feature

### Tech Stack

| Layer       | Choice           | Reason                                    |
|-------------|-----------------|-------------------------------------------|
| Frontend    | Expo / React Native | Cross-platform, fast iteration        |
| Navigation  | Expo Router      | File-based routing, familiar             |
| State       | Zustand          | Lightweight, already used in VirWave     |
| Backend     | Supabase         | Auth + Postgres + RLS + Realtime built in |
| Push notifs | Expo Notifications + Supabase Edge Functions | Simple setup |
| Hosting     | Supabase cloud   | No separate server needed for MVP        |

### Files to Create

```
app/
  (auth)/
    sign-up.tsx
    log-in.tsx
  (tabs)/
    index.tsx           ← Home: today's question + connections
    profile.tsx         ← Self profile view
  connection/
    [id].tsx            ← Connection score + dimension breakdown
    invite.tsx          ← Accept/decline connection
  question/
    today.tsx           ← Daily question card + insight
  onboarding/
    name-dob.tsx

components/
  ScoreCard.tsx
  DimensionBar.tsx
  QuestionCard.tsx
  InsightCard.tsx
  IndividualAnswerCard.tsx

lib/
  supabase.ts
  store.ts             ← Zustand store
  scoring.ts           ← get_compatibility_score wrapper
  questions.ts         ← question library + insight text map

supabase/
  migrations/
    001_initial_schema.sql
  functions/
    get_next_question.sql
    get_compatibility_score.sql
    get_group_cohesion.sql
    mark_answer_read.sql
```

---

## 14. Phase 2 Roadmap

### Phase 2A — Groups (after 50 connected users)
- Group creation flow
- Group cohesion score
- Group radar chart
- Group invite link

### Phase 2B — Depth Features (after 200 active users)
- Complementarity (Type C) scoring
- "Understanding" questions — free text with detail prompts and active recall mechanic
- Answer history / how your answers have changed over time
- "Showing up" log — log when you've actively done something for a connection

### Phase 2C — Discovery (only if data supports it)
- Browse mode: see anonymous profiles of people in your city/university
- Connect requests to strangers (opt-in only, off by default)
- UCL / university cohort: share codes per institution

> **Important:** Do not build discovery until you have enough answer data to make it meaningful. A browse feature with 20 users is useless. A browse feature with 2,000 users with 10+ answers each is powerful.

### Phase 2D — Premium / Monetisation
- Free tier: 1-on-1 connections, basic score
- Premium tier (£3.99/month):
  - Unlimited connections
  - Groups
  - Full dimension breakdown
  - "What's different" detailed view
  - Answer history

---

## 15. Open Questions

| # | Question | Current Position | Needs |
|---|----------|-----------------|-------|
| 1 | Should users be able to see each other's scores before both have reached threshold? | No — both need 3+ shared answers | Confirm with user testing |
| 2 | Should relationship type be mutual or can each side categorise differently? | Each side sets their own — stored separately | May be confusing; watch UX |
| 3 | What happens when a romantic connection becomes a friendship? Can the type be changed? | Not in MVP — deferred | Design needed for Phase 2 |
| 4 | Do we show a score to someone who was invited but hasn't answered many questions yet? | No — threshold enforced | Confirm threshold (3 or 5?) |
| 5 | Should question variants be served randomly or sequenced? | Random within dimension block | A/B test in Phase 2 |
| 6 | How do we handle two users who both answer honestly and get a very low score? | App never says "bad match" — just shows gaps | Review copy carefully |
| 7 | Age gating for 16–17: is friendship/family still allowed for romantic relationship type? | Romantic disabled under 18 — others allowed | Legal review needed per jurisdiction |
| 8 | How does UCL cohort mode work — public codes, institution verification, or opt-in? | Deferred to Phase 2C | Needs discovery design |
| 9 | Should question weights be editable per relationship type, or fixed globally? | Fixed globally in MVP | Data-driven in Phase 2 |
| 10 | What is the minimum viable data for complementarity (Type C) questions to be trustworthy? | Unknown — defer to Phase 2B | Needs research |
