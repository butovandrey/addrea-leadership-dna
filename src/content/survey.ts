import type { SurveyDraft, SurveyOption, SurveyQuestion, WizardPhase } from "@/types/survey";

export const DEFAULT_SESSION_CODE = "addrea-top";
export const DEFAULT_SESSION_NAME = "ADDREA Leadership Team";
/** localStorage key for participant access token (static hosting). */
export const ACCESS_TOKEN_STORAGE_KEY = "ldna_access_token";
export const OPEN_ANSWER_MAX = 300;

export const WIZARD_PHASES: WizardPhase[] = [
  "beliefs_select",
  "beliefs_rating",
  "worldview_preferred",
  "worldview_current",
  "values",
  "principles_select",
  "principles_rating",
  "rules_select",
  "rules_rating",
  "skills_select",
  "skills_rating",
  "habits_select",
  "habits_rating",
  "open",
];

export function phaseToMajorStep(phase: WizardPhase): number {
  if (phase.startsWith("beliefs")) return 1;
  if (phase.startsWith("worldview")) return 2;
  if (phase === "values") return 3;
  if (phase.startsWith("principles")) return 4;
  if (phase.startsWith("rules")) return 5;
  if (phase.startsWith("skills")) return 6;
  if (phase.startsWith("habits")) return 7;
  return 7;
}

export function createEmptyDraft(): SurveyDraft {
  return {
    beliefs: { selected: [], ratings: {} },
    worldview: { preferred: [], current: [] },
    values: {},
    principles: { selected: [], ratings: {} },
    rules: { selected: [], ratings: {} },
    skills: { selected: [], ratings: {} },
    habits: { selected: [], ratings: {} },
    openAnswer: "",
  };
}

export const BELIEFS: SurveyOption[] = [
  { code: "b1", label: "Большинство людей хотят хорошо выполнять свою работу." },
  { code: "b2", label: "Система и среда влияют на результат сильнее отдельных героев." },
  { code: "b3", label: "Ответственность начинается с личного выбора, а не с должности." },
  { code: "b4", label: "Ошибка — естественная цена развития и эксперимента." },
  { code: "b5", label: "Сильная команда способна добиться большего, чем набор сильных индивидуальностей." },
  { code: "b6", label: "Без доверия невозможно построить зрелую организацию." },
  { code: "b7", label: "Компания должна постоянно меняться, даже когда всё работает хорошо." },
  { code: "b8", label: "Ценность для клиента в долгосрочной перспективе важнее краткосрочной выгоды." },
  { code: "b9", label: "Свобода эффективна только вместе с ответственностью." },
  { code: "b10", label: "Хороший руководитель создаёт систему, которая работает без его постоянного участия." },
];

export const WORLDVIEWS: SurveyOption[] = [
  {
    code: "w_system",
    label: "Компания как система",
    description: "Результат возникает из взаимодействия людей, процессов, данных, технологий и управления.",
  },
  {
    code: "w_team",
    label: "Компания как команда",
    description: "Решающим фактором являются сильные люди, отношения между ними и качество взаимодействия.",
  },
  {
    code: "w_organism",
    label: "Компания как живой организм",
    description: "Организация должна постоянно адаптироваться к меняющейся среде.",
  },
  {
    code: "w_entrepreneurial",
    label: "Компания как предпринимательская среда",
    description: "Главное преимущество — замечать возможности и действовать быстрее других.",
  },
  {
    code: "w_machine",
    label: "Компания как механизм",
    description: "Предсказуемый результат возникает благодаря ясным ролям, процессам, стандартам и контролю.",
  },
  {
    code: "w_network",
    label: "Компания как сеть автономных команд",
    description: "Решения должны приниматься максимально близко к месту возникновения информации.",
  },
];

export const VALUE_PAIRS: SurveyOption[] = [
  { code: "v_speed_accuracy", label: "Скорость ↔ Безошибочность", leftLabel: "Скорость", rightLabel: "Безошибочность" },
  { code: "v_freedom_control", label: "Свобода ↔ Контроль", leftLabel: "Свобода", rightLabel: "Контроль" },
  { code: "v_experiment_predictability", label: "Эксперимент ↔ Предсказуемость", leftLabel: "Эксперимент", rightLabel: "Предсказуемость" },
  { code: "v_team_individual", label: "Командный результат ↔ Индивидуальный результат", leftLabel: "Командный результат", rightLabel: "Индивидуальный результат" },
  { code: "v_openness_diplomacy", label: "Открытость ↔ Дипломатичность", leftLabel: "Открытость", rightLabel: "Дипломатичность" },
  { code: "v_client_efficiency", label: "Клиент ↔ Внутренняя эффективность", leftLabel: "Клиент", rightLabel: "Внутренняя эффективность" },
  { code: "v_long_short", label: "Долгосрочный результат ↔ Быстрый результат", leftLabel: "Долгосрочный результат", rightLabel: "Быстрый результат" },
  { code: "v_standard_flex", label: "Стандартизация ↔ Гибкость", leftLabel: "Стандартизация", rightLabel: "Гибкость" },
];

export const PRINCIPLES: SurveyOption[] = [
  { code: "p1", label: "Решение должно приниматься на максимально низком уровне, где достаточно информации." },
  { code: "p2", label: "Ответственность должна сопровождаться полномочиями." },
  { code: "p3", label: "Плохая новость должна подниматься наверх быстрее хорошей." },
  { code: "p4", label: "Несогласие до принятия решения нормально; после решения команда действует согласованно." },
  { code: "p5", label: "Лучше достаточно хорошее решение вовремя, чем идеальное слишком поздно." },
  { code: "p6", label: "Сначала разбираем систему, затем действия человека." },
  { code: "p7", label: "Проблему можно поднять, даже если пока не знаешь её решения." },
  { code: "p8", label: "Договорённость существует только тогда, когда она зафиксирована." },
  { code: "p9", label: "Повторяющийся ручной процесс — кандидат на стандартизацию или автоматизацию." },
  { code: "p10", label: "Руководитель отвечает не только за результат, но и за качество созданной им системы." },
];

export const RULES: SurveyOption[] = [
  { code: "r1", label: "У каждой задачи есть один конкретный owner." },
  { code: "r2", label: "Встреча заканчивается решением, следующим шагом и ответственным." },
  { code: "r3", label: "Существенное решение фиксируется письменно." },
  { code: "r4", label: "Риск поднимается сразу после обнаружения, а не когда стал проблемой." },
  { code: "r5", label: "Повторяющийся процесс должен иметь понятного владельца." },
  { code: "r6", label: "Решение пересматривается, если изменились исходные данные." },
  { code: "r7", label: "Руководитель не должен быть обязательной точкой согласования каждой операции." },
  { code: "r8", label: "Если задача делегирована — вместе с ней передаются необходимые полномочия." },
  { code: "r9", label: "После серьёзного сбоя проводится короткий разбор причин." },
  { code: "r10", label: "Если регулярную ручную работу разумно автоматизировать — её не оставляют ручной навсегда." },
];

export const SKILLS: SurveyOption[] = [
  { code: "s_systems", label: "системное мышление" },
  { code: "s_decisions", label: "принятие решений" },
  { code: "s_prioritization", label: "приоритизация" },
  { code: "s_uncertainty", label: "работа с неопределённостью" },
  { code: "s_finance", label: "финансовое мышление" },
  { code: "s_analytical", label: "аналитическое мышление" },
  { code: "s_data", label: "работа с данными" },
  { code: "s_change", label: "управление изменениями" },
  { code: "s_conflict", label: "управление конфликтами" },
  { code: "s_feedback", label: "обратная связь" },
  { code: "s_delegation", label: "делегирование" },
  { code: "s_people", label: "развитие людей" },
  { code: "s_crossfunc", label: "межфункциональная коммуникация" },
  { code: "s_strategy", label: "стратегическое мышление" },
  { code: "s_ai", label: "AI literacy" },
];

export const HABITS: SurveyOption[] = [
  { code: "h1", label: "Начинать обсуждение проблемы с фактов." },
  { code: "h2", label: "Поднимать проблему сразу после её обнаружения." },
  { code: "h3", label: "Фиксировать принятое решение." },
  { code: "h4", label: "Завершать встречу конкретными next steps." },
  { code: "h5", label: "Давать прямую обратную связь." },
  { code: "h6", label: "Проверять результат принятого решения спустя время." },
  { code: "h7", label: "Делать короткий postmortem после существенных ошибок." },
  { code: "h8", label: "Регулярно задавать вопрос: «Зачем мы это делаем?»" },
  { code: "h9", label: "Не делать вручную то, что разумно автоматизировать." },
  { code: "h10", label: "Перед новой инициативой определять ожидаемый результат." },
  { code: "h11", label: "Спрашивать мнение человека, который непосредственно работает с проблемой." },
  { code: "h12", label: "Не откладывать обратимое решение из-за недостатка идеальной информации." },
];

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    category: "beliefs",
    code: "beliefs",
    title: "Во что вы верите как руководитель?",
    description: "Выберите до 4 утверждений, которые наиболее близки вам лично.",
    minChoices: 1,
    maxChoices: 4,
    options: BELIEFS,
  },
  {
    category: "worldview",
    code: "worldview",
    title: "Как вы в первую очередь воспринимаете организацию?",
    description: "Выберите до двух моделей, которые вам наиболее близки.",
    minChoices: 1,
    maxChoices: 2,
    options: WORLDVIEWS,
  },
  {
    category: "values",
    code: "values",
    title: "Когда две хорошие вещи конфликтуют, куда вы скорее склоняетесь?",
    description: "Здесь нет правильной стороны шкалы.",
    options: VALUE_PAIRS,
  },
  {
    category: "principles",
    code: "principles",
    title: "Какие управленческие принципы вам наиболее близки?",
    description: "Выберите до 5.",
    minChoices: 1,
    maxChoices: 5,
    options: PRINCIPLES,
  },
  {
    category: "rules",
    code: "rules",
    title: "Какие правила работы были бы полезны нашей управленческой команде?",
    description: "Выберите до 6.",
    minChoices: 1,
    maxChoices: 6,
    options: RULES,
  },
  {
    category: "skills",
    code: "skills",
    title: "Какие способности особенно важны для нашей TOP-команды?",
    description: "Выберите ровно 5.",
    minChoices: 5,
    maxChoices: 5,
    options: SKILLS,
  },
  {
    category: "habits",
    code: "habits",
    title: "Какие модели поведения должны стать для нас естественными?",
    description: "Выберите до 6.",
    minChoices: 1,
    maxChoices: 6,
    options: HABITS,
  },
  {
    category: "open",
    code: "open_preserve",
    title: "И последний вопрос",
    description:
      "Какую одну черту нашей управленческой культуры вы ни в коем случае не хотели бы потерять по мере роста компании?",
    options: [],
  },
];

const ALL_OPTIONS = [...BELIEFS, ...WORLDVIEWS, ...VALUE_PAIRS, ...PRINCIPLES, ...RULES, ...SKILLS, ...HABITS];

export function getOptionLabel(code: string): string {
  return ALL_OPTIONS.find((o) => o.code === code)?.label ?? code;
}

export function getOption(code: string): SurveyOption | undefined {
  return ALL_OPTIONS.find((o) => o.code === code);
}

export function getOptionsByCategory(category: SurveyQuestion["category"]): SurveyOption[] {
  return SURVEY_QUESTIONS.find((q) => q.category === category)?.options ?? [];
}

export const REALITY_SCALE_LABELS = {
  1: "Совсем не похоже",
  5: "Полностью похоже",
} as const;
