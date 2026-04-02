-- Intentional Connections — initial schema (Supabase / Postgres)

-- Profiles (1:1 with auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '',
  birth_date date NOT NULL DEFAULT '2000-01-01',
  photo_url text,
  bio text CHECK (bio IS NULL OR char_length(bio) <= 140),
  city text,
  created_at timestamptz NOT NULL DEFAULT now(),
  gdpr_accepted_at timestamptz
);

CREATE TABLE public.share_codes (
  code text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  relationship_type text NOT NULL DEFAULT 'general'
    CHECK (relationship_type IN ('romantic','friend','family','work','general')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  UNIQUE (user_id)
);

CREATE TABLE public.connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  user_b uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  relationship_type_a text CHECK (relationship_type_a IS NULL OR relationship_type_a IN ('romantic','friend','family','work','general')),
  relationship_type_b text CHECK (relationship_type_b IS NULL OR relationship_type_b IN ('romantic','friend','family','work','general')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','declined','removed')),
  connected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_a < user_b),
  CHECK (inviter_id = user_a OR inviter_id = user_b),
  UNIQUE (user_a, user_b)
);

CREATE TABLE public.questions (
  id text PRIMARY KEY,
  question text NOT NULL,
  dimension text NOT NULL CHECK (dimension IN ('values','communication','emotional','lifestyle','individual')),
  match_type text NOT NULL CHECK (match_type IN ('S','I','C')),
  weight numeric NOT NULL DEFAULT 1.0,
  display_order int,
  variant_group text,
  is_primary boolean NOT NULL DEFAULT true
);

CREATE TABLE public.responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  question_id text NOT NULL REFERENCES public.questions (id) ON DELETE CASCADE,
  answer smallint CHECK (answer IS NULL OR (answer BETWEEN 1 AND 5)),
  answer_text text,
  answered_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz,
  is_stale boolean NOT NULL DEFAULT false,
  UNIQUE (user_id, question_id),
  CHECK (
    (answer IS NOT NULL AND answer_text IS NULL)
    OR (answer IS NULL AND answer_text IS NOT NULL AND length(trim(answer_text)) > 0)
  )
);

CREATE TABLE public.answer_reads (
  reader_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  question_id text NOT NULL REFERENCES public.questions (id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (reader_id, owner_id, question_id)
);

CREATE INDEX responses_user_id_idx ON public.responses (user_id);
CREATE INDEX connections_users_idx ON public.connections (user_a, user_b);

-- Seed primary questions (v1)
INSERT INTO public.questions (id, question, dimension, match_type, weight, display_order, variant_group, is_primary) VALUES
('VB-01', 'I think honesty is more important than kindness when giving someone feedback.', 'values', 'S', 1.5, 1, 'VB-01', true),
('VB-02', 'I feel strongly that people should keep their commitments, even when it''s inconvenient.', 'values', 'S', 1.5, 2, 'VB-02', true),
('VB-03', 'I believe personal growth should be an ongoing priority in life.', 'values', 'S', 1.5, 3, 'VB-03', true),
('VB-04', 'I think people are fundamentally good and trustworthy until proven otherwise.', 'values', 'S', 1.5, 4, 'VB-04', true),
('VB-05', 'Financial security is a top priority for me in how I make life decisions.', 'values', 'S', 1.5, 5, 'VB-05', true),
('CS-01', 'When I''m upset, I prefer to talk about it straight away rather than wait.', 'communication', 'S', 1.3, 6, 'CS-01', true),
('CS-02', 'I like to think through my feelings before sharing them.', 'communication', 'S', 1.3, 7, 'CS-02', true),
('CS-03', 'I express care through doing things for people more than through words.', 'communication', 'S', 1.3, 8, 'CS-03', true),
('CS-04', 'I prefer straightforward conversations over hints and subtlety.', 'communication', 'S', 1.3, 9, 'CS-04', true),
('CS-05', 'I check in on the people I care about often, even when nothing is wrong.', 'communication', 'S', 1.3, 10, 'CS-05', true),
('ES-01', 'I find it easy to identify and name my own emotions.', 'emotional', 'S', 1.2, 11, 'ES-01', true),
('ES-02', 'I tend to feel other people''s emotions strongly — their mood affects mine.', 'emotional', 'S', 1.2, 12, 'ES-02', true),
('ES-03', 'I recover from disappointment or conflict fairly quickly.', 'emotional', 'S', 1.2, 13, 'ES-03', true),
('ES-04', 'I need regular reassurance in close relationships to feel secure.', 'emotional', 'S', 1.2, 14, 'ES-04', true),
('ES-05', 'I find it easy to apologise when I''ve made a mistake.', 'emotional', 'S', 1.2, 15, 'ES-05', true),
('LS-01', 'I prefer a structured, planned lifestyle over a spontaneous one.', 'lifestyle', 'S', 1.0, 16, 'LS-01', true),
('LS-02', 'I recharge by spending time alone rather than with others.', 'lifestyle', 'S', 1.0, 17, 'LS-02', true),
('LS-03', 'Physical activity and health are central to how I live my life.', 'lifestyle', 'S', 1.0, 18, 'LS-03', true),
('LS-04', 'I prefer to spend money on experiences rather than things.', 'lifestyle', 'S', 1.0, 19, 'LS-04', true),
('LS-05', 'I like my living and working spaces to be tidy and organised.', 'lifestyle', 'S', 1.0, 20, 'LS-05', true),
('IP-01', 'What''s a snack or food that genuinely makes your day better?', 'individual', 'I', 0, 21, 'IP-01', true),
('IP-02', 'How do you prefer to spend a completely free Saturday morning?', 'individual', 'I', 0, 22, 'IP-02', true),
('IP-03', 'What''s the best way someone could support you when you''re stressed?', 'individual', 'I', 0, 23, 'IP-03', true),
('IP-04', 'What''s a small thing that you do regularly that brings you genuine comfort?', 'individual', 'I', 0, 24, 'IP-04', true),
('IP-05', 'How do you like to celebrate good news — big or small?', 'individual', 'I', 0, 25, 'IP-05', true);

-- RPC: resolve invite code
CREATE OR REPLACE FUNCTION public.lookup_share_code(p_code text)
RETURNS TABLE (owner_id uuid, relationship_type text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sc.user_id, sc.relationship_type::text
  FROM public.share_codes sc
  WHERE sc.code = upper(trim(p_code))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.lookup_share_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_share_code(text) TO anon, authenticated;

-- RPC: partner answers visible to viewer based on viewer''s relationship type toward partner
CREATE OR REPLACE FUNCTION public.get_partner_visible_responses(p_partner uuid)
RETURNS TABLE (
  question_id text,
  answer smallint,
  answer_text text,
  answered_at timestamptz,
  updated_at timestamptz,
  is_stale boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me uuid := auth.uid();
  v_rel text;
BEGIN
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT
    CASE
      WHEN c.user_a = v_me THEN c.relationship_type_a::text
      WHEN c.user_b = v_me THEN c.relationship_type_b::text
      ELSE NULL
    END
  INTO v_rel
  FROM public.connections c
  WHERE c.status = 'active'
    AND (
      (c.user_a = v_me AND c.user_b = p_partner)
      OR (c.user_b = v_me AND c.user_a = p_partner)
    )
  LIMIT 1;

  IF v_rel IS NULL THEN
    RAISE EXCEPTION 'not connected';
  END IF;

  RETURN QUERY
  SELECT r.question_id, r.answer, r.answer_text, r.answered_at, r.updated_at, r.is_stale
  FROM public.responses r
  INNER JOIN public.questions q ON q.id = r.question_id
  WHERE r.user_id = p_partner
    AND (
      (v_rel = 'romantic' AND q.dimension = ANY (ARRAY['values','communication','emotional','lifestyle','individual']::text[]))
      OR (v_rel = 'friend' AND q.dimension = ANY (ARRAY['values','communication','emotional','lifestyle','individual']::text[]))
      OR (v_rel = 'family' AND q.dimension = ANY (ARRAY['values','emotional','individual']::text[]))
      OR (v_rel = 'work' AND q.dimension = ANY (ARRAY['communication','individual']::text[]))
      OR (v_rel = 'general' AND q.dimension = ANY (ARRAY['values','individual']::text[]))
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_partner_visible_responses(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_partner_visible_responses(uuid) TO authenticated;

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY share_codes_own ON public.share_codes
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY questions_read ON public.questions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY connections_participant ON public.connections
  FOR ALL USING (auth.uid() IN (user_a, user_b)) WITH CHECK (auth.uid() IN (user_a, user_b, inviter_id));

CREATE POLICY responses_own ON public.responses
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY answer_reads_own ON public.answer_reads
  FOR ALL USING (reader_id = auth.uid()) WITH CHECK (reader_id = auth.uid());

CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY profiles_select ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.connections c
      WHERE c.status IN ('active', 'pending')
        AND (
          (c.user_a = auth.uid() AND c.user_b = profiles.id)
          OR (c.user_b = auth.uid() AND c.user_a = profiles.id)
        )
    )
  );
