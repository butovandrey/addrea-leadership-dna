import { getAccessToken, setAccessToken } from "@/lib/auth/participant-token";
import { mapRpcError, type ApiResult } from "@/lib/api/types";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { normalizeDraft } from "@/lib/validation/survey-schema";
import type { ParticipantRow, ResponseRow, SurveyDraft } from "@/types/survey";

export async function fetchSessionByCode(sessionCode: string): Promise<
  ApiResult<{ id: string; name: string; code: string; active: boolean }>
> {
  try {
    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase
      .from("sessions")
      .select("id, name, code, active")
      .eq("code", sessionCode)
      .eq("active", true)
      .maybeSingle();

    if (error) return { ok: false, error: mapRpcError(error) };
    if (!data) return { ok: false, error: "Сессия не найдена или неактивна." };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ошибка запроса." };
  }
}

export async function startParticipant(input: {
  sessionCode: string;
  name: string;
}): Promise<ApiResult<{ participantId: string; sessionCode: string }>> {
  try {
    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase.rpc("start_participant", {
      p_session_code: input.sessionCode,
      p_name: input.name.trim(),
    });

    if (error) return { ok: false, error: mapRpcError(error) };

    const payload = data as {
      participantId: string;
      accessToken: string;
      sessionCode: string;
    };

    setAccessToken(payload.accessToken);
    return {
      ok: true,
      data: { participantId: payload.participantId, sessionCode: payload.sessionCode },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ошибка запроса." };
  }
}

export async function getCurrentParticipantForSession(
  sessionCode: string,
): Promise<ApiResult<{ participant: ParticipantRow; sessionCode: string } | null>> {
  try {
    const token = getAccessToken();
    if (!token) return { ok: true, data: null };

    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase.rpc("get_participant", {
      p_access_token: token,
      p_session_code: sessionCode,
    });

    if (error) return { ok: false, error: mapRpcError(error) };
    if (!data) return { ok: true, data: null };

    const row = data as ParticipantRow & { sessionCode: string };
    return {
      ok: true,
      data: {
        participant: {
          ...row,
          draft: normalizeDraft(row.draft),
        },
        sessionCode: row.sessionCode ?? sessionCode,
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ошибка запроса." };
  }
}

export async function saveDraft(input: {
  sessionCode: string;
  draft: SurveyDraft;
  currentStep: number;
}): Promise<ApiResult<{ participantId: string }>> {
  try {
    const token = getAccessToken();
    if (!token) return { ok: false, error: "Сессия участника не найдена. Начните заново." };

    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase.rpc("save_draft", {
      p_access_token: token,
      p_draft: input.draft,
      p_step: input.currentStep,
    });

    if (error) return { ok: false, error: mapRpcError(error) };
    return { ok: true, data: data as { participantId: string } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ошибка запроса." };
  }
}

export async function submitSurvey(input: {
  sessionCode: string;
  draft: SurveyDraft;
}): Promise<ApiResult<{ participantId: string }>> {
  try {
    const token = getAccessToken();
    if (!token) return { ok: false, error: "Сессия участника не найдена. Начните заново." };

    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase.rpc("submit_survey", {
      p_access_token: token,
      p_draft: input.draft,
    });

    if (error) return { ok: false, error: mapRpcError(error) };
    const payload = data as { participantId: string };
    return { ok: true, data: { participantId: payload.participantId } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ошибка запроса." };
  }
}

export async function getPersonalResult(participantId: string): Promise<
  ApiResult<{
    participantId: string;
    name: string;
    sessionCode: string;
    responses: ResponseRow[];
  }>
> {
  try {
    const token = getAccessToken();
    if (!token) return { ok: false, error: "Нет доступа к результату." };

    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase.rpc("get_personal_result", {
      p_access_token: token,
      p_participant_id: participantId,
    });

    if (error) return { ok: false, error: mapRpcError(error) };

    const payload = data as {
      participantId: string;
      name: string;
      sessionCode: string;
      responses: ResponseRow[];
    };

    return { ok: true, data: payload };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ошибка запроса." };
  }
}
