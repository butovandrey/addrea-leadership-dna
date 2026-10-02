"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SurveyClient } from "@/components/survey/survey-client";
import { getCurrentParticipantForSession, fetchSessionByCode } from "@/lib/api/participant";
import { normalizeDraft } from "@/lib/validation/survey-schema";
import type { SurveyDraft } from "@/types/survey";

export default function SurveyPage() {
  const params = useParams<{ sessionCode: string }>();
  const sessionCode = params.sessionCode;
  const router = useRouter();

  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; message: string }
    | {
        status: "ready";
        participantId: string;
        draft: SurveyDraft;
        currentStep: number;
      }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const session = await fetchSessionByCode(sessionCode);
      if (cancelled) return;
      if (!session.ok) {
        setState({ status: "error", message: session.error });
        return;
      }

      const current = await getCurrentParticipantForSession(sessionCode);
      if (cancelled) return;

      if (!current.ok) {
        setState({ status: "error", message: current.error });
        return;
      }

      if (!current.data) {
        router.replace(`/s/${sessionCode}`);
        return;
      }

      if (current.data.participant.completed_at) {
        router.replace(`/r/${current.data.participant.id}`);
        return;
      }

      setState({
        status: "ready",
        participantId: current.data.participant.id,
        draft: normalizeDraft(current.data.participant.draft),
        currentStep: current.data.participant.current_step,
      });
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router, sessionCode]);

  if (state.status === "loading") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-[var(--ink-muted)]">Загрузка…</div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto max-w-xl px-6 py-20">
        <p className="text-[var(--danger)]">{state.message}</p>
        <Link href={`/s/${sessionCode}`} className="mt-4 inline-block text-[var(--accent)]">
          Вернуться к началу
        </Link>
      </div>
    );
  }

  return (
    <SurveyClient
      participantId={state.participantId}
      sessionCode={sessionCode}
      draft={state.draft}
      currentStep={state.currentStep}
    />
  );
}
