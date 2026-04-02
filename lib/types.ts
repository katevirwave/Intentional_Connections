export type RelationshipType = 'romantic' | 'friend' | 'family' | 'work' | 'general';

export type Dimension =
  | 'values'
  | 'communication'
  | 'emotional'
  | 'lifestyle'
  | 'individual';

export type ConnectionStatus = 'pending' | 'active' | 'declined' | 'removed';

export type Profile = {
  id: string;
  first_name: string;
  birth_date: string;
  bio: string | null;
  city: string | null;
  photo_url: string | null;
  gdpr_accepted_at: string | null;
  created_at: string;
};

export type QuestionRow = {
  id: string;
  question: string;
  dimension: Dimension;
  match_type: 'S' | 'I' | 'C';
  weight: number;
  display_order: number;
  variant_group: string | null;
  is_primary: boolean;
};

export type ResponseRow = {
  id: string;
  user_id: string;
  question_id: string;
  answer: number | null;
  answer_text: string | null;
  answered_at: string;
  updated_at: string | null;
  is_stale: boolean;
};

export type ConnectionRow = {
  id: string;
  user_a: string;
  user_b: string;
  relationship_type_a: RelationshipType | null;
  relationship_type_b: RelationshipType | null;
  inviter_id: string;
  status: ConnectionStatus;
  connected_at: string | null;
  created_at: string;
};

export type ShareCodeRow = {
  code: string;
  user_id: string;
  relationship_type: RelationshipType;
  created_at: string;
  expires_at: string | null;
};
