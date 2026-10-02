import { mapRpcError, type ApiResult } from "@/lib/api/types";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { TeamDnaResult } from "@/types/survey";

export async function getTeamDna(sessionCode: string): Promise<ApiResult<TeamDnaResult>> {
  try {
    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase.rpc("get_team_dna", {
      p_session_code: sessionCode,
    });

    if (error) return { ok: false, error: mapRpcError(error) };

    const payload = data as TeamDnaResult;
    return {
      ok: true,
      data: {
        ...payload,
        insufficientSample: Boolean(payload.insufficientSample) || payload.completedCount < 3,
        topBeliefs: payload.topBeliefs ?? [],
        topPrinciples: payload.topPrinciples ?? [],
        worldviews: payload.worldviews ?? [],
        values: payload.values ?? [],
        topGaps: payload.topGaps ?? [],
        polarizing: payload.polarizing ?? [],
        openAnswers: payload.openAnswers ?? [],
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ошибка запроса." };
  }
}
