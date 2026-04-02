import type { ConnectionRow, Profile, QuestionRow, RelationshipType, ResponseRow, ShareCodeRow } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function upsertProfile(input: {
  id: string;
  first_name: string;
  birth_date: string;
  gdpr_accepted_at?: string;
}): Promise<void> {
  const { error } = await supabase.from('profiles').upsert(
    {
      id: input.id,
      first_name: input.first_name,
      birth_date: input.birth_date,
      gdpr_accepted_at: input.gdpr_accepted_at ?? new Date().toISOString(),
    },
    { onConflict: 'id' }
  );
  if (error) throw error;
}

function randomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const pick = () => alphabet[Math.floor(Math.random() * alphabet.length)];
  return `${pick()}${pick()}${pick()}-${pick()}${pick()}${pick()}`;
}

export async function ensureShareCode(
  userId: string,
  relationshipType: RelationshipType = 'general'
): Promise<ShareCodeRow> {
  const { data: existing } = await supabase.from('share_codes').select('*').eq('user_id', userId).maybeSingle();
  if (existing) {
    const row = existing as ShareCodeRow;
    if (row.relationship_type !== relationshipType) {
      const { data: updated, error } = await supabase
        .from('share_codes')
        .update({ relationship_type: relationshipType })
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return updated as ShareCodeRow;
    }
    return row;
  }
  for (let i = 0; i < 8; i++) {
    const code = randomCode();
    const { data, error } = await supabase
      .from('share_codes')
      .insert({ code, user_id: userId, relationship_type: relationshipType })
      .select()
      .single();
    if (!error && data) return data as ShareCodeRow;
  }
  throw new Error('Could not generate share code');
}

export async function updateShareRelationship(userId: string, relationshipType: RelationshipType): Promise<void> {
  const { error } = await supabase.from('share_codes').update({ relationship_type: relationshipType }).eq('user_id', userId);
  if (error) throw error;
}

export async function lookupShareCode(code: string): Promise<{ owner_id: string; relationship_type: RelationshipType } | null> {
  const { data, error } = await supabase.rpc('lookup_share_code', { p_code: code.trim().toUpperCase() });
  if (error) throw error;
  if (data == null) return null;
  const row = (Array.isArray(data) ? data[0] : data) as
    | { owner_id: string; relationship_type: RelationshipType }
    | undefined
    | null;
  if (!row?.owner_id) return null;
  return row;
}

export async function fetchQuestions(): Promise<QuestionRow[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('is_primary', true)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as QuestionRow[];
}

export async function fetchMyResponses(userId: string): Promise<ResponseRow[]> {
  const { data, error } = await supabase.from('responses').select('*').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []) as ResponseRow[];
}

export type PartnerResponseRow = {
  question_id: string;
  answer: number | null;
  answer_text: string | null;
  answered_at: string;
  updated_at: string | null;
  is_stale: boolean;
};

export async function fetchPartnerResponses(partnerId: string): Promise<PartnerResponseRow[]> {
  const { data, error } = await supabase.rpc('get_partner_visible_responses', { p_partner: partnerId });
  if (error) throw error;
  return (data ?? []) as PartnerResponseRow[];
}

export async function hasAnsweredToday(userId: string): Promise<boolean> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from('responses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('answered_at', start.toISOString());
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function getNextQuestionForUser(
  userId: string,
  questions: QuestionRow[],
  responses: ResponseRow[]
): Promise<QuestionRow | null> {
  const alreadyToday = await hasAnsweredToday(userId);
  if (alreadyToday) return null;
  const done = new Set(responses.map((r) => r.question_id));
  if (responses.length === 0) {
    const first = questions.find((q) => q.id === 'CS-04');
    if (first && !done.has(first.id)) return first;
  }
  const next = questions.find((q) => !done.has(q.id));
  return next ?? null;
}

export async function submitLikertResponse(userId: string, questionId: string, answer: number): Promise<void> {
  const { error } = await supabase.from('responses').upsert(
    {
      user_id: userId,
      question_id: questionId,
      answer,
      answer_text: null,
      answered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_stale: false,
    },
    { onConflict: 'user_id,question_id' }
  );
  if (error) throw error;
}

export async function submitTextResponse(userId: string, questionId: string, answerText: string): Promise<void> {
  const { error } = await supabase.from('responses').upsert(
    {
      user_id: userId,
      question_id: questionId,
      answer: null,
      answer_text: answerText,
      answered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_stale: false,
    },
    { onConflict: 'user_id,question_id' }
  );
  if (error) throw error;
}

function orderUserPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function createPendingConnection(params: {
  inviterId: string;
  inviteeId: string;
  inviterRelationship: RelationshipType;
}): Promise<ConnectionRow> {
  const [ua, ub] = orderUserPair(params.inviterId, params.inviteeId);
  const ra = params.inviterId === ua ? params.inviterRelationship : null;
  const rb = params.inviterId === ub ? params.inviterRelationship : null;
  const { data, error } = await supabase
    .from('connections')
    .insert({
      user_a: ua,
      user_b: ub,
      inviter_id: params.inviterId,
      relationship_type_a: ra,
      relationship_type_b: rb,
      status: 'pending',
    })
    .select()
    .single();
  if (error) throw error;
  return data as ConnectionRow;
}

export async function acceptConnection(
  connectionId: string,
  inviteeId: string,
  inviteeRelationship: RelationshipType
): Promise<void> {
  const { data: row, error: fetchErr } = await supabase.from('connections').select('*').eq('id', connectionId).single();
  if (fetchErr) throw fetchErr;
  const c = row as ConnectionRow;
  const ua = c.user_a;
  const ub = c.user_b;
  const ra: RelationshipType | null = inviteeId === ua ? inviteeRelationship : c.relationship_type_a;
  const rb: RelationshipType | null = inviteeId === ub ? inviteeRelationship : c.relationship_type_b;
  const { error } = await supabase
    .from('connections')
    .update({
      relationship_type_a: ra,
      relationship_type_b: rb,
      status: 'active',
      connected_at: new Date().toISOString(),
    })
    .eq('id', connectionId);
  if (error) throw error;
}

export async function declineConnection(connectionId: string): Promise<void> {
  const { error } = await supabase.from('connections').update({ status: 'declined' }).eq('id', connectionId);
  if (error) throw error;
}

export async function fetchConnectionById(id: string): Promise<ConnectionRow | null> {
  const { data, error } = await supabase.from('connections').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as ConnectionRow | null;
}

export async function fetchConnectionBetweenUsers(a: string, b: string): Promise<ConnectionRow | null> {
  const [ua, ub] = orderUserPair(a, b);
  const { data, error } = await supabase.from('connections').select('*').eq('user_a', ua).eq('user_b', ub).maybeSingle();
  if (error) throw error;
  return data as ConnectionRow | null;
}

export async function fetchMyConnections(userId: string): Promise<ConnectionRow[]> {
  const { data, error } = await supabase
    .from('connections')
    .select('*')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ConnectionRow[];
}

export function otherUserId(c: ConnectionRow, me: string): string {
  return c.user_a === me ? c.user_b : c.user_a;
}

export function myRelationshipToward(c: ConnectionRow, me: string): RelationshipType | null {
  if (c.user_a === me) return c.relationship_type_a;
  if (c.user_b === me) return c.relationship_type_b;
  return null;
}

export function theirRelationshipTowardMe(c: ConnectionRow, me: string): RelationshipType | null {
  if (c.user_a === me) return c.relationship_type_b;
  if (c.user_b === me) return c.relationship_type_a;
  return null;
}

/** How the inviter categorised the invitee (pending or active). */
export function inviterTowardInviteeType(c: ConnectionRow): RelationshipType | null {
  if (c.inviter_id === c.user_a) return c.relationship_type_a;
  return c.relationship_type_b;
}

export async function markAnswerRead(readerId: string, ownerId: string, questionId: string): Promise<void> {
  const { error } = await supabase.from('answer_reads').upsert(
    {
      reader_id: readerId,
      owner_id: ownerId,
      question_id: questionId,
      read_at: new Date().toISOString(),
    },
    { onConflict: 'reader_id,owner_id,question_id' }
  );
  if (error) throw error;
}

export async function fetchAnswerReads(readerId: string, ownerId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('answer_reads')
    .select('question_id')
    .eq('reader_id', readerId)
    .eq('owner_id', ownerId);
  if (error) throw error;
  return new Set((data ?? []).map((r: { question_id: string }) => r.question_id));
}
