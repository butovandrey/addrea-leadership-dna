"use server";

import {
  BELIEFS,
  PRINCIPLES,
} from "@/content/survey";
import {
  getPolarizingTopics,
  getTeamValueStats,
  getTopGaps,
  getTopSelections,
  getWorldviewStats,
} from "@/lib/analytics";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { ResponseRow, TeamDnaResult } from "@/types/survey";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function getTeamDna(sessionCode: string): Promise<ActionResult<TeamDnaResult>> {
  try {
    const admin = createAdminSupabaseClient();

    const { data: session, error: sessionError } = await admin
      .from("sessions")
      .select("id, name, code, active")
      .eq("code", sessionCode)
      .eq("active", true)
      .maybeSingle();

    if (sessionError) return { ok: false, error: sessionError.message };
    if (!session) return { ok: false, error: "Сессия не найдена." };

    const { data: participants, error: pError } = await admin
      .from("participants")
      .select("id")
      .eq("session_id", session.id)
      .not("completed_at", "is", null);

    if (pError) return { ok: false, error: pError.message };

    const ids = (participants ?? []).map((p) => p.id);
    let responsesByParticipant: ResponseRow[][] = [];

    if (ids.length > 0) {
      const { data: responses, error: rError } = await admin
        .from("responses")
        .select("id, participant_id, question_code, option_code, response_type, numeric_value, text_value")
        .in("participant_id", ids);

      if (rError) return { ok: false, error: rError.message };

      const grouped = new Map<string, ResponseRow[]>();
      for (const id of ids) grouped.set(id, []);
      for (const row of responses ?? []) {
        const list = grouped.get(row.participant_id);
        if (list) list.push(row as ResponseRow);
      }
      responsesByParticipant = Array.from(grouped.values());
    }

    const openAnswers = responsesByParticipant
      .flatMap((rows) =>
        rows.filter((r) => r.response_type === "open_text" && r.text_value?.trim()),
      )
      .map((r) => r.text_value!.trim());

    const result: TeamDnaResult = {
      sessionCode: session.code,
      sessionName: session.name,
      completedCount: ids.length,
      topBeliefs: getTopSelections(
        responsesByParticipant,
        "beliefs",
        BELIEFS.map((b) => b.code),
        5,
      ),
      topPrinciples: getTopSelections(
        responsesByParticipant,
        "principles",
        PRINCIPLES.map((p) => p.code),
        5,
      ),
      worldviews: getWorldviewStats(responsesByParticipant),
      values: getTeamValueStats(responsesByParticipant),
      topGaps: getTopGaps(responsesByParticipant, 8),
      polarizing: getPolarizingTopics(responsesByParticipant, 5),
      openAnswers,
    };

    return { ok: true, data: result };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ошибка сервера" };
  }
}
