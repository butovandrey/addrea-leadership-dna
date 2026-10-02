import type {
  PersonalGap,
  PolarizingTopic,
  QuestionCategory,
  ResponseRow,
  TeamGapStat,
  TeamSelectionStat,
  TeamValueStat,
  TeamWorldviewStat,
} from "@/types/survey";
import {
  BELIEFS,
  getOptionLabel,
  HABITS,
  PRINCIPLES,
  RULES,
  SKILLS,
  VALUE_PAIRS,
  WORLDVIEWS,
} from "@/content/survey";

export function getSelectionFrequency(
  responsesByParticipant: ResponseRow[][],
  questionCode: string,
  optionCodes: string[],
): TeamSelectionStat[] {
  const total = responsesByParticipant.length;
  return optionCodes.map((optionCode) => {
    const selectedCount = responsesByParticipant.filter((rows) =>
      rows.some(
        (r) =>
          r.question_code === questionCode &&
          r.option_code === optionCode &&
          r.response_type === "selection",
      ),
    ).length;
    return {
      optionCode,
      label: getOptionLabel(optionCode),
      selectedCount,
      totalCompleted: total,
      share: total === 0 ? 0 : selectedCount / total,
    };
  });
}

export function getAverageRealityScore(
  responsesByParticipant: ResponseRow[][],
  questionCode: string,
  optionCode: string,
): number | null {
  const ratings: number[] = [];
  for (const rows of responsesByParticipant) {
    const selected = rows.some(
      (r) =>
        r.question_code === questionCode &&
        r.option_code === optionCode &&
        r.response_type === "selection",
    );
    if (!selected) continue;
    const rating = rows.find(
      (r) =>
        r.question_code === questionCode &&
        r.option_code === optionCode &&
        r.response_type === "reality_rating",
    );
    if (rating?.numeric_value != null) ratings.push(Number(rating.numeric_value));
  }
  if (ratings.length === 0) return null;
  return ratings.reduce((a, b) => a + b, 0) / ratings.length;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((acc, v) => acc + (v - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function getValuePairAverage(values: number[]): number {
  return mean(values);
}

export function getValuePairDispersion(values: number[]): { sd: number; min: number; max: number } {
  if (values.length === 0) return { sd: 0, min: 0, max: 0 };
  return {
    sd: stdDev(values),
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

export function getPersonalTopGaps(
  responses: ResponseRow[],
  limit = 3,
): PersonalGap[] {
  const categories: { category: QuestionCategory; questionCode: string }[] = [
    { category: "beliefs", questionCode: "beliefs" },
    { category: "principles", questionCode: "principles" },
    { category: "rules", questionCode: "rules" },
    { category: "skills", questionCode: "skills" },
    { category: "habits", questionCode: "habits" },
  ];

  const gaps: PersonalGap[] = [];
  for (const { category, questionCode } of categories) {
    const selections = responses.filter(
      (r) => r.question_code === questionCode && r.response_type === "selection" && r.option_code,
    );
    for (const sel of selections) {
      const optionCode = sel.option_code!;
      const ratingRow = responses.find(
        (r) =>
          r.question_code === questionCode &&
          r.option_code === optionCode &&
          r.response_type === "reality_rating",
      );
      const reality = ratingRow?.numeric_value != null ? Number(ratingRow.numeric_value) : 5;
      gaps.push({
        category,
        optionCode,
        label: getOptionLabel(optionCode),
        realityRating: reality,
        gap: 5 - reality,
      });
    }
  }

  return gaps
    .sort((a, b) => b.gap - a.gap || a.realityRating - b.realityRating)
    .filter((g) => g.gap > 0)
    .slice(0, limit);
}

export function getTopGaps(
  responsesByParticipant: ResponseRow[][],
  limit = 8,
): TeamGapStat[] {
  const blocks: { category: QuestionCategory; questionCode: string; options: { code: string }[] }[] = [
    { category: "beliefs", questionCode: "beliefs", options: BELIEFS },
    { category: "principles", questionCode: "principles", options: PRINCIPLES },
    { category: "rules", questionCode: "rules", options: RULES },
    { category: "skills", questionCode: "skills", options: SKILLS },
    { category: "habits", questionCode: "habits", options: HABITS },
  ];

  const stats: TeamGapStat[] = [];

  for (const block of blocks) {
    for (const opt of block.options) {
      const freq = getSelectionFrequency(responsesByParticipant, block.questionCode, [opt.code])[0];
      const reality = getAverageRealityScore(responsesByParticipant, block.questionCode, opt.code);
      if (freq.selectedCount === 0 || reality == null) continue;
      const importanceScore = 1 + 4 * freq.share;
      stats.push({
        category: block.category,
        optionCode: opt.code,
        label: getOptionLabel(opt.code),
        selectedCount: freq.selectedCount,
        selectionShare: freq.share,
        importanceScore,
        realityScore: reality,
        gap: importanceScore - reality,
      });
    }
  }

  return stats.sort((a, b) => b.gap - a.gap).slice(0, limit);
}

export function getWorldviewStats(responsesByParticipant: ResponseRow[][]): TeamWorldviewStat[] {
  const total = responsesByParticipant.length || 1;
  return WORLDVIEWS.map((w) => {
    const preferredCount = responsesByParticipant.filter((rows) =>
      rows.some(
        (r) =>
          r.question_code === "worldview" &&
          r.option_code === w.code &&
          r.response_type === "worldview_preferred",
      ),
    ).length;
    const currentCount = responsesByParticipant.filter((rows) =>
      rows.some(
        (r) =>
          r.question_code === "worldview" &&
          r.option_code === w.code &&
          r.response_type === "worldview_current",
      ),
    ).length;
    return {
      optionCode: w.code,
      label: w.label,
      preferredCount,
      currentCount,
      preferredShare: preferredCount / total,
      currentShare: currentCount / total,
    };
  });
}

export function getTeamValueStats(responsesByParticipant: ResponseRow[][]): TeamValueStat[] {
  return VALUE_PAIRS.map((pair) => {
    const values: number[] = [];
    for (const rows of responsesByParticipant) {
      const row = rows.find(
        (r) =>
          r.question_code === "values" &&
          r.option_code === pair.code &&
          r.response_type === "bipolar",
      );
      if (row?.numeric_value != null) values.push(Number(row.numeric_value));
    }
    const dispersion = getValuePairDispersion(values);
    return {
      optionCode: pair.code,
      leftLabel: pair.leftLabel ?? "",
      rightLabel: pair.rightLabel ?? "",
      mean: getValuePairAverage(values),
      min: dispersion.min,
      max: dispersion.max,
      sd: dispersion.sd,
      values,
    };
  });
}

export function getPolarizingTopics(
  responsesByParticipant: ResponseRow[][],
  limit = 5,
): PolarizingTopic[] {
  const topics: PolarizingTopic[] = [];
  const total = responsesByParticipant.length;

  for (const value of getTeamValueStats(responsesByParticipant)) {
    const sampleSize = value.values?.length ?? 0;
    if (sampleSize < 2) continue;
    topics.push({
      kind: "value",
      category: "values",
      optionCode: value.optionCode,
      label: `${value.leftLabel} ↔ ${value.rightLabel}`,
      reason: "Здесь позиции заметно различаются",
      metric: value.sd,
    });
  }

  if (total > 0) {
    const selectionBlocks = [
      { category: "beliefs" as const, questionCode: "beliefs", options: BELIEFS },
      { category: "principles" as const, questionCode: "principles", options: PRINCIPLES },
      { category: "rules" as const, questionCode: "rules", options: RULES },
      { category: "skills" as const, questionCode: "skills", options: SKILLS },
      { category: "habits" as const, questionCode: "habits", options: HABITS },
    ];

    for (const block of selectionBlocks) {
      const freqs = getSelectionFrequency(
        responsesByParticipant,
        block.questionCode,
        block.options.map((o) => o.code),
      );
      for (const f of freqs) {
        const distanceFromHalf = Math.abs(f.share - 0.5);
        if (f.share >= 0.35 && f.share <= 0.65) {
          topics.push({
            kind: "selection",
            category: block.category,
            optionCode: f.optionCode,
            label: f.label,
            reason: "Здесь нет выраженного консенсуса",
            metric: 1 - distanceFromHalf,
          });
        }
      }
    }

    for (const w of getWorldviewStats(responsesByParticipant)) {
      if (w.preferredShare >= 0.35 && w.preferredShare <= 0.65) {
        topics.push({
          kind: "worldview",
          category: "worldview",
          optionCode: w.optionCode,
          label: w.label,
          reason: "Эту тему стоит обсудить",
          metric: 1 - Math.abs(w.preferredShare - 0.5),
        });
      }
    }
  }

  return topics.sort((a, b) => b.metric - a.metric).slice(0, limit);
}

export function getTopSelections(
  responsesByParticipant: ResponseRow[][],
  questionCode: string,
  optionCodes: string[],
  limit = 5,
): TeamSelectionStat[] {
  return getSelectionFrequency(responsesByParticipant, questionCode, optionCodes)
    .sort((a, b) => b.share - a.share || b.selectedCount - a.selectedCount)
    .slice(0, limit);
}
