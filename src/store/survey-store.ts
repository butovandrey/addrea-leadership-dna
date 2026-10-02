"use client";

import { createEmptyDraft, WIZARD_PHASES } from "@/content/survey";
import type { SurveyDraft, WizardPhase } from "@/types/survey";
import { create } from "zustand";

type SurveyStore = {
  hydrated: boolean;
  participantId: string | null;
  sessionCode: string;
  phaseIndex: number;
  draft: SurveyDraft;
  saving: boolean;
  error: string | null;
  hydrate: (input: {
    participantId: string;
    sessionCode: string;
    draft: SurveyDraft;
    currentStep: number;
  }) => void;
  setPhaseIndex: (index: number) => void;
  setDraft: (draft: SurveyDraft) => void;
  patchDraft: (updater: (draft: SurveyDraft) => SurveyDraft) => void;
  setSaving: (saving: boolean) => void;
  setError: (error: string | null) => void;
  phase: () => WizardPhase;
};

export const useSurveyStore = create<SurveyStore>((set, get) => ({
  hydrated: false,
  participantId: null,
  sessionCode: "",
  phaseIndex: 0,
  draft: createEmptyDraft(),
  saving: false,
  error: null,
  hydrate: ({ participantId, sessionCode, draft, currentStep }) =>
    set({
      hydrated: true,
      participantId,
      sessionCode,
      draft,
      phaseIndex: Math.max(0, Math.min(currentStep, WIZARD_PHASES.length - 1)),
      error: null,
    }),
  setPhaseIndex: (index) =>
    set({ phaseIndex: Math.max(0, Math.min(index, WIZARD_PHASES.length - 1)) }),
  setDraft: (draft) => set({ draft }),
  patchDraft: (updater) => set({ draft: updater(get().draft) }),
  setSaving: (saving) => set({ saving }),
  setError: (error) => set({ error }),
  phase: () => WIZARD_PHASES[get().phaseIndex] ?? "beliefs_select",
}));
