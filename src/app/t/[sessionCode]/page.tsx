"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { TeamDnaView } from "@/components/team/team-dna-view";
import { getTeamDna } from "@/lib/api/team";
import type { TeamDnaResult } from "@/types/survey";

export default function TeamDnaPage() {
  const params = useParams<{ sessionCode: string }>();
  const sessionCode = params.sessionCode;

  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "ready"; data: TeamDnaResult }
  >({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const result = await getTeamDna(sessionCode);
    if (!result.ok) {
      setState({ status: "error", message: result.error });
      return;
    }
    setState({ status: "ready", data: result.data });
  }, [sessionCode]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const result = await getTeamDna(sessionCode);
      if (cancelled) return;
      if (!result.ok) {
        setState({ status: "error", message: result.error });
        return;
      }
      setState({ status: "ready", data: result.data });
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionCode]);

  if (state.status === "loading") {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-[var(--ink-muted)]">Загрузка…</div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto max-w-xl px-6 py-20">
        <h1 className="font-display text-3xl">Не удалось загрузить Team DNA</h1>
        <p className="mt-3 text-[var(--ink-muted)]">{state.message}</p>
      </div>
    );
  }

  return <TeamDnaView data={state.data} onRefresh={() => void load()} />;
}
