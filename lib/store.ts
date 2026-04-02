import { create } from 'zustand';
import type { RelationshipType } from '@/lib/types';

type AppState = {
  inviteRelationship: RelationshipType;
  setInviteRelationship: (r: RelationshipType) => void;
};

export const useAppStore = create<AppState>((set) => ({
  inviteRelationship: 'general',
  setInviteRelationship: (inviteRelationship) => set({ inviteRelationship }),
}));
