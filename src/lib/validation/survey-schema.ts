import { z } from "zod";
import {
  HABITS,
  OPEN_ANSWER_MAX,
  PRINCIPLES,
  RULES,
  SKILLS,
  VALUE_PAIRS,
  WORLDVIEWS,
  BELIEFS,
  createEmptyDraft,
} from "@/content/survey";
import type { SurveyDraft, WizardPhase } from "@/types/survey";

const ratingSchema = z.number().int().min(1).max(5);
const bipolarSchema = z.number().int().min(1).max(7);

function codesOf(options: { code: string }[]) {
  return options.map((o) => o.code);
}

export function normalizeDraft(raw: unknown): SurveyDraft {
  const empty = createEmptyDraft();
  if (!raw || typeof raw !== "object") return empty;
  const d = raw as Partial<SurveyDraft>;
  return {
    beliefs: {
      selected: Array.isArray(d.beliefs?.selected) ? d.beliefs.selected : [],
      ratings: d.beliefs?.ratings && typeof d.beliefs.ratings === "object" ? d.beliefs.ratings : {},
    },
    worldview: {
      preferred: Array.isArray(d.worldview?.preferred) ? d.worldview.preferred : [],
      current: Array.isArray(d.worldview?.current) ? d.worldview.current : [],
    },
    values: d.values && typeof d.values === "object" ? d.values : {},
    principles: {
      selected: Array.isArray(d.principles?.selected) ? d.principles.selected : [],
      ratings: d.principles?.ratings && typeof d.principles.ratings === "object" ? d.principles.ratings : {},
    },
    rules: {
      selected: Array.isArray(d.rules?.selected) ? d.rules.selected : [],
      ratings: d.rules?.ratings && typeof d.rules.ratings === "object" ? d.rules.ratings : {},
    },
    skills: {
      selected: Array.isArray(d.skills?.selected) ? d.skills.selected : [],
      ratings: d.skills?.ratings && typeof d.skills.ratings === "object" ? d.skills.ratings : {},
    },
    habits: {
      selected: Array.isArray(d.habits?.selected) ? d.habits.selected : [],
      ratings: d.habits?.ratings && typeof d.habits.ratings === "object" ? d.habits.ratings : {},
    },
    openAnswer: typeof d.openAnswer === "string" ? d.openAnswer : "",
  };
}

function validateSelectWithRatings(
  selected: string[],
  ratings: Record<string, number>,
  allowed: string[],
  min: number,
  max: number,
  requireRatings: boolean,
): string | null {
  if (selected.length < min || selected.length > max) {
    return `Выберите от ${min} до ${max}.`;
  }
  if (selected.some((c) => !allowed.includes(c))) {
    return "Выбран недопустимый вариант.";
  }
  if (requireRatings) {
    for (const code of selected) {
      const r = ratings[code];
      if (r === undefined || !ratingSchema.safeParse(r).success) {
        return "Оцените каждый выбранный пункт по шкале 1–5.";
      }
    }
  }
  return null;
}

export function validatePhase(phase: WizardPhase, draft: SurveyDraft): string | null {
  switch (phase) {
    case "beliefs_select":
      return validateSelectWithRatings(draft.beliefs.selected, draft.beliefs.ratings, codesOf(BELIEFS), 1, 4, false);
    case "beliefs_rating":
      return validateSelectWithRatings(draft.beliefs.selected, draft.beliefs.ratings, codesOf(BELIEFS), 1, 4, true);
    case "worldview_preferred": {
      const n = draft.worldview.preferred.length;
      if (n < 1 || n > 2) return "Выберите от 1 до 2 моделей.";
      if (draft.worldview.preferred.some((c) => !codesOf(WORLDVIEWS).includes(c))) return "Недопустимый вариант.";
      return null;
    }
    case "worldview_current": {
      const n = draft.worldview.current.length;
      if (n < 1 || n > 2) return "Выберите от 1 до 2 моделей.";
      if (draft.worldview.current.some((c) => !codesOf(WORLDVIEWS).includes(c))) return "Недопустимый вариант.";
      return null;
    }
    case "values": {
      for (const pair of VALUE_PAIRS) {
        const v = draft.values[pair.code];
        if (v === undefined || !bipolarSchema.safeParse(v).success) {
          return "Отметьте позицию на каждой шкале.";
        }
      }
      return null;
    }
    case "principles_select":
      return validateSelectWithRatings(draft.principles.selected, draft.principles.ratings, codesOf(PRINCIPLES), 1, 5, false);
    case "principles_rating":
      return validateSelectWithRatings(draft.principles.selected, draft.principles.ratings, codesOf(PRINCIPLES), 1, 5, true);
    case "rules_select":
      return validateSelectWithRatings(draft.rules.selected, draft.rules.ratings, codesOf(RULES), 1, 6, false);
    case "rules_rating":
      return validateSelectWithRatings(draft.rules.selected, draft.rules.ratings, codesOf(RULES), 1, 6, true);
    case "skills_select":
      return validateSelectWithRatings(draft.skills.selected, draft.skills.ratings, codesOf(SKILLS), 5, 5, false);
    case "skills_rating":
      return validateSelectWithRatings(draft.skills.selected, draft.skills.ratings, codesOf(SKILLS), 5, 5, true);
    case "habits_select":
      return validateSelectWithRatings(draft.habits.selected, draft.habits.ratings, codesOf(HABITS), 1, 6, false);
    case "habits_rating":
      return validateSelectWithRatings(draft.habits.selected, draft.habits.ratings, codesOf(HABITS), 1, 6, true);
    case "open": {
      const text = draft.openAnswer.trim();
      if (!text) return "Пожалуйста, ответьте на вопрос.";
      if (text.length > OPEN_ANSWER_MAX) return `Не более ${OPEN_ANSWER_MAX} символов.`;
      return null;
    }
    default:
      return null;
  }
}

export function validateFullDraft(draft: SurveyDraft): string | null {
  const phases: WizardPhase[] = [
    "beliefs_rating",
    "worldview_preferred",
    "worldview_current",
    "values",
    "principles_rating",
    "rules_rating",
    "skills_rating",
    "habits_rating",
    "open",
  ];
  for (const phase of phases) {
    const err = validatePhase(phase, draft);
    if (err) return err;
  }
  return null;
}

export const startParticipantSchema = z.object({
  sessionCode: z.string().min(1),
  name: z.string().trim().min(1, "Введите имя").max(80),
});
