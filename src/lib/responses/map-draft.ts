import type { ResponseType, SurveyDraft } from "@/types/survey";

export type ResponseInsert = {
  participant_id: string;
  question_code: string;
  option_code: string | null;
  response_type: ResponseType;
  numeric_value: number | null;
  text_value: string | null;
};

export function draftToResponseRows(participantId: string, draft: SurveyDraft): ResponseInsert[] {
  const rows: ResponseInsert[] = [];

  for (const code of draft.beliefs.selected) {
    rows.push({
      participant_id: participantId,
      question_code: "beliefs",
      option_code: code,
      response_type: "selection",
      numeric_value: null,
      text_value: null,
    });
    const rating = draft.beliefs.ratings[code];
    if (rating != null) {
      rows.push({
        participant_id: participantId,
        question_code: "beliefs",
        option_code: code,
        response_type: "reality_rating",
        numeric_value: rating,
        text_value: null,
      });
    }
  }

  for (const code of draft.worldview.preferred) {
    rows.push({
      participant_id: participantId,
      question_code: "worldview",
      option_code: code,
      response_type: "worldview_preferred",
      numeric_value: null,
      text_value: null,
    });
  }
  for (const code of draft.worldview.current) {
    rows.push({
      participant_id: participantId,
      question_code: "worldview",
      option_code: code,
      response_type: "worldview_current",
      numeric_value: null,
      text_value: null,
    });
  }

  for (const [code, value] of Object.entries(draft.values)) {
    rows.push({
      participant_id: participantId,
      question_code: "values",
      option_code: code,
      response_type: "bipolar",
      numeric_value: value,
      text_value: null,
    });
  }

  const blocks: Array<{
    key: "principles" | "rules" | "skills" | "habits";
    questionCode: string;
  }> = [
    { key: "principles", questionCode: "principles" },
    { key: "rules", questionCode: "rules" },
    { key: "skills", questionCode: "skills" },
    { key: "habits", questionCode: "habits" },
  ];

  for (const block of blocks) {
    const data = draft[block.key];
    for (const code of data.selected) {
      rows.push({
        participant_id: participantId,
        question_code: block.questionCode,
        option_code: code,
        response_type: "selection",
        numeric_value: null,
        text_value: null,
      });
      const rating = data.ratings[code];
      if (rating != null) {
        rows.push({
          participant_id: participantId,
          question_code: block.questionCode,
          option_code: code,
          response_type: "reality_rating",
          numeric_value: rating,
          text_value: null,
        });
      }
    }
  }

  rows.push({
    participant_id: participantId,
    question_code: "open_preserve",
    option_code: null,
    response_type: "open_text",
    numeric_value: null,
    text_value: draft.openAnswer.trim(),
  });

  return rows;
}
