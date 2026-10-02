"use client";

import { useEffect } from "react";
import { SurveyWizard } from "@/components/survey/survey-wizard";
import { normalizeDraft } from "@/lib/validation/survey-schema";
import { useSurveyStore } from "@/store/survey-store";
import type { SurveyDraft } from "@/types/survey";

type Props = {
  participantId: string;
  sessionCode: string;
  draft: SurveyDraft;
  currentStep: number;
};

export function SurveyClient({ participantId, sessionCode, draft, currentStep }: Props) {
  const hydrate = useSurveyStore((s) => s.hydrate);

  useEffect(() => {
    hydrate({
      participantId,
      sessionCode,
      draft: normalizeDraft(draft),
      currentStep,
    });
  }, [hydrate, participantId, sessionCode, draft, currentStep]);

  return <SurveyWizard />;
}
