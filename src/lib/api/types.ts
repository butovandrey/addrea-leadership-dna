export type ApiResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

export function mapRpcError(error: { message?: string; code?: string } | null): string {
  const msg = error?.message ?? "";
  if (msg.includes("SESSION_NOT_FOUND")) return "Сессия не найдена или неактивна.";
  if (msg.includes("INVALID_NAME")) return "Введите имя.";
  if (msg.includes("PARTICIPANT_NOT_FOUND")) return "Участник не найден. Начните заново.";
  if (msg.includes("ALREADY_COMPLETED")) return "Ответы уже завершены и не могут быть изменены.";
  if (msg.includes("FORBIDDEN")) return "Нет доступа к этому результату.";
  if (msg.includes("NOT_COMPLETED")) return "Опрос ещё не завершён.";
  if (msg.includes("INVALID_")) return "Проверьте заполнение всех шагов перед завершением.";
  return msg || "Ошибка запроса.";
}
