import { DEMO_USER_ID } from '@/lib/demoData';
import type { RelationshipType, ResponseRow } from '@/lib/types';
import { create } from 'zustand';

type AppState = {
  inviteRelationship: RelationshipType;
  setInviteRelationship: (r: RelationshipType) => void;
  demoMode: boolean;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  demoResponses: ResponseRow[];
  addDemoLikertResponse: (questionId: string, answer: number) => void;
  addDemoTextResponse: (questionId: string, answerText: string) => void;
};

export const useAppStore = create<AppState>((set) => ({
  inviteRelationship: 'general',
  setInviteRelationship: (inviteRelationship) => set({ inviteRelationship }),
  demoMode: false,
  enterDemoMode: () => set({ demoMode: true, demoResponses: [] }),
  exitDemoMode: () => set({ demoMode: false, demoResponses: [] }),
  demoResponses: [],
  addDemoLikertResponse: (questionId, answer) =>
    set((s) => {
      const ts = new Date().toISOString();
      const row: ResponseRow = {
        id: `demo-${questionId}`,
        user_id: DEMO_USER_ID,
        question_id: questionId,
        answer,
        answer_text: null,
        answered_at: ts,
        updated_at: ts,
        is_stale: false,
      };
      return {
        demoResponses: [...s.demoResponses.filter((r) => r.question_id !== questionId), row],
      };
    }),
  addDemoTextResponse: (questionId, answerText) =>
    set((s) => {
      const ts = new Date().toISOString();
      const row: ResponseRow = {
        id: `demo-${questionId}`,
        user_id: DEMO_USER_ID,
        question_id: questionId,
        answer: null,
        answer_text: answerText,
        answered_at: ts,
        updated_at: ts,
        is_stale: false,
      };
      return {
        demoResponses: [...s.demoResponses.filter((r) => r.question_id !== questionId), row],
      };
    }),
}));
