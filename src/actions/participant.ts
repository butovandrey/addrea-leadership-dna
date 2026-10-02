"use server";

import { createEmptyDraft, WIZARD_PHASES } from "@/content/survey";
import {
  getAccessTokenFromCookie,
  setAccessTokenCookie,
} from "@/lib/auth/participant-cookie";
import { draftToResponseRows } from "@/lib/responses/map-draft";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { normalizeDraft, startParticipantSchema, validateFullDraft } from "@/lib/validation/survey-schema";
import type { ParticipantRow, SurveyDraft } from "@/types/survey";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function getParticipantByToken(token: string): Promise<ParticipantRow | null> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("participants")
    .select("*")
    .eq("access_token", token)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    ...data,
    draft: normalizeDraft(data.draft),
  } as ParticipantRow;
}

export async function getSessionByCode(code: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("sessions")
    .select("id, name, code, active")
    .eq("code", code)
    .eq("active", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function startParticipant(input: {
  sessionCode: string;
  name: string;
}): Promise<ActionResult<{ participantId: string; sessionCode: string }>> {
  const parsed = startParticipantSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  try {
    const session = await getSessionByCode(parsed.data.sessionCode);
    if (!session) return { ok: false, error: "Сессия не найдена или неактивна." };

    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from("participants")
      .insert({
        session_id: session.id,
        name: parsed.data.name.trim(),
        draft: createEmptyDraft(),
        current_step: 0,
      })
      .select("id, access_token")
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "Не удалось создать участника." };
    }

    await setAccessTokenCookie(data.access_token);
    return {
      ok: true,
      data: { participantId: data.id, sessionCode: parsed.data.sessionCode },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ошибка сервера" };
  }
}

export async function getCurrentParticipantForSession(
  sessionCode: string,
): Promise<ActionResult<{
  participant: ParticipantRow;
  sessionCode: string;
} | null>> {
  try {
    const token = await getAccessTokenFromCookie();
    if (!token) return { ok: true, data: null };

    const participant = await getParticipantByToken(token);
    if (!participant) return { ok: true, data: null };

    const session = await getSessionByCode(sessionCode);
    if (!session || participant.session_id !== session.id) {
      return { ok: true, data: null };
    }

    return { ok: true, data: { participant, sessionCode } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ошибка сервера" };
  }
}

export async function saveDraft(input: {
  sessionCode: string;
  draft: SurveyDraft;
  currentStep: number;
}): Promise<ActionResult<{ participantId: string }>> {
  try {
    const token = await getAccessTokenFromCookie();
    if (!token) return { ok: false, error: "Сессия участника не найдена. Начните заново." };

    const participant = await getParticipantByToken(token);
    if (!participant) return { ok: false, error: "Участник не найден." };
    if (participant.completed_at) {
      return { ok: false, error: "Ответы уже завершены и не могут быть изменены." };
    }

    const session = await getSessionByCode(input.sessionCode);
    if (!session || participant.session_id !== session.id) {
      return { ok: false, error: "Неверная сессия." };
    }

    const step = Math.max(0, Math.min(input.currentStep, WIZARD_PHASES.length - 1));
    const draft = normalizeDraft(input.draft);

    const admin = createAdminSupabaseClient();
    const { error } = await admin
      .from("participants")
      .update({ draft, current_step: step })
      .eq("id", participant.id)
      .is("completed_at", null);

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: { participantId: participant.id } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ошибка сервера" };
  }
}

export async function submitSurvey(input: {
  sessionCode: string;
  draft: SurveyDraft;
}): Promise<ActionResult<{ participantId: string }>> {
  try {
    const token = await getAccessTokenFromCookie();
    if (!token) return { ok: false, error: "Сессия участника не найдена. Начните заново." };

    const participant = await getParticipantByToken(token);
    if (!participant) return { ok: false, error: "Участник не найден." };
    if (participant.completed_at) {
      return { ok: true, data: { participantId: participant.id } };
    }

    const session = await getSessionByCode(input.sessionCode);
    if (!session || participant.session_id !== session.id) {
      return { ok: false, error: "Неверная сессия." };
    }

    const draft = normalizeDraft(input.draft);
    const validationError = validateFullDraft(draft);
    if (validationError) return { ok: false, error: validationError };

    const rows = draftToResponseRows(participant.id, draft);
    const admin = createAdminSupabaseClient();

    const { error: deleteError } = await admin
      .from("responses")
      .delete()
      .eq("participant_id", participant.id);
    if (deleteError) return { ok: false, error: deleteError.message };

    const { error: insertError } = await admin.from("responses").insert(rows);
    if (insertError) return { ok: false, error: insertError.message };

    const { error: completeError } = await admin
      .from("participants")
      .update({
        draft,
        current_step: WIZARD_PHASES.length - 1,
        completed_at: new Date().toISOString(),
      })
      .eq("id", participant.id)
      .is("completed_at", null);

    if (completeError) return { ok: false, error: completeError.message };

    return { ok: true, data: { participantId: participant.id } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ошибка сервера" };
  }
}

export async function getPersonalResult(participantId: string): Promise<
  ActionResult<{
    participantId: string;
    name: string;
    sessionCode: string;
    responses: import("@/types/survey").ResponseRow[];
  }>
> {
  try {
    const token = await getAccessTokenFromCookie();
    if (!token) return { ok: false, error: "Нет доступа к результату." };

    const self = await getParticipantByToken(token);
    if (!self || self.id !== participantId) {
      return { ok: false, error: "Нет доступа к этому результату." };
    }
    if (!self.completed_at) {
      return { ok: false, error: "Опрос ещё не завершён." };
    }

    const admin = createAdminSupabaseClient();
    const { data: session } = await admin
      .from("sessions")
      .select("code")
      .eq("id", self.session_id)
      .single();

    const { data: responses, error } = await admin
      .from("responses")
      .select("id, participant_id, question_code, option_code, response_type, numeric_value, text_value")
      .eq("participant_id", participantId);

    if (error) return { ok: false, error: error.message };

    return {
      ok: true,
      data: {
        participantId,
        name: self.name,
        sessionCode: session?.code ?? "",
        responses: (responses ?? []) as import("@/types/survey").ResponseRow[],
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ошибка сервера" };
  }
}
