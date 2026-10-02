"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PersonalDnaView } from "@/components/results/personal-dna-view";
import { getPersonalResult } from "@/lib/api/participant";
import type { ResponseRow } from "@/types/survey";

function resolveParticipantId(searchParams: URLSearchParams): string | null {
  const fromQuery = searchParams.get("participantId")?.trim();
  if (fromQuery) return fromQuery;
  return null;
}

function PersonalResultContent() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; message: string }
    | {
        status: "ready";
        name: string;
        sessionCode: string;
        responses: ResponseRow[];
      }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const participantId = resolveParticipantId(searchParams);
      if (!participantId) {
        if (!cancelled) {
          setState({ status: "error", message: "Результат не найден." });
        }
        return;
      }

      const result = await getPersonalResult(participantId);
      if (cancelled) return;
      if (!result.ok) {
        setState({ status: "error", message: result.error });
        return;
      }
      setState({
        status: "ready",
        name: result.data.name,
        sessionCode: result.data.sessionCode,
        responses: result.data.responses,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  if (state.status === "loading") {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-[var(--ink-muted)]">Загрузка…</div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto max-w-xl px-6 py-20">
        <h1 className="font-display text-3xl text-[var(--ink)]">Результат недоступен</h1>
        <p className="mt-3 text-[var(--ink-muted)]">{state.message}</p>
        <Link href="/" className="mt-6 inline-block text-[var(--accent)] hover:underline">
          Начать заново
        </Link>
      </div>
    );
  }

  return (
    <PersonalDnaView
      name={state.name}
      sessionCode={state.sessionCode}
      responses={state.responses}
    />
  );
}

export default function PersonalResultPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-xl px-6 py-20 text-[var(--ink-muted)]">Загрузка…</div>
      }
    >
      <PersonalResultContent />
    </Suspense>
  );
}
