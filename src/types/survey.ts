export type QuestionCategory =
  | "beliefs"
  | "worldview"
  | "values"
  | "principles"
  | "rules"
  | "skills"
  | "habits"
  | "open";

export type ResponseType =
  | "selection"
  | "reality_rating"
  | "bipolar"
  | "worldview_preferred"
  | "worldview_current"
  | "open_text";

export type SurveyOption = {
  code: string;
  label: string;
  description?: string;
  leftLabel?: string;
  rightLabel?: string;
};

export type SurveyQuestion = {
  category: QuestionCategory;
  code: string;
  title: string;
  description?: string;
  maxChoices?: number;
  minChoices?: number;
  options: SurveyOption[];
};

export type SelectWithRatings = {
  selected: string[];
  ratings: Record<string, number>;
};

export type SurveyDraft = {
  beliefs: SelectWithRatings;
  worldview: {
    preferred: string[];
    current: string[];
  };
  values: Record<string, number>;
  principles: SelectWithRatings;
  rules: SelectWithRatings;
  skills: SelectWithRatings;
  habits: SelectWithRatings;
  openAnswer: string;
};

export type WizardPhase =
  | "beliefs_select"
  | "beliefs_rating"
  | "worldview_preferred"
  | "worldview_current"
  | "values"
  | "principles_select"
  | "principles_rating"
  | "rules_select"
  | "rules_rating"
  | "skills_select"
  | "skills_rating"
  | "habits_select"
  | "habits_rating"
  | "open";

export type ParticipantRow = {
  id: string;
  session_id: string;
  name: string;
  access_token: string;
  current_step: number;
  draft: SurveyDraft;
  completed_at: string | null;
  created_at: string;
};

export type ResponseRow = {
  id: string;
  participant_id: string;
  question_code: string;
  option_code: string | null;
  response_type: ResponseType;
  numeric_value: number | null;
  text_value: string | null;
};

export type CompletedParticipantData = {
  participantId: string;
  name: string;
  responses: ResponseRow[];
};

export type PersonalGap = {
  category: QuestionCategory;
  optionCode: string;
  label: string;
  realityRating: number;
  gap: number;
};

export type TeamSelectionStat = {
  optionCode: string;
  label: string;
  selectedCount: number;
  totalCompleted: number;
  share: number;
};

export type TeamWorldviewStat = {
  optionCode: string;
  label: string;
  preferredShare: number;
  currentShare: number;
  preferredCount: number;
  currentCount: number;
};

export type TeamValueStat = {
  optionCode: string;
  leftLabel: string;
  rightLabel: string;
  mean: number;
  min: number;
  max: number;
  sd: number;
  /** Optional; Team DNA RPC no longer returns individual values. */
  values?: number[];
};

export type TeamGapStat = {
  category: QuestionCategory;
  optionCode: string;
  label: string;
  selectedCount: number;
  selectionShare: number;
  importanceScore: number;
  realityScore: number;
  gap: number;
};

export type PolarizingTopic = {
  kind: "value" | "selection" | "worldview";
  category: QuestionCategory;
  optionCode: string;
  label: string;
  reason: string;
  metric: number;
};

export type TeamDnaResult = {
  sessionCode: string;
  sessionName: string;
  completedCount: number;
  insufficientSample?: boolean;
  topBeliefs: TeamSelectionStat[];
  topPrinciples: TeamSelectionStat[];
  worldviews: TeamWorldviewStat[];
  values: TeamValueStat[];
  topGaps: TeamGapStat[];
  polarizing: PolarizingTopic[];
  openAnswers: string[];
};
