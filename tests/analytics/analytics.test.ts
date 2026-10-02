import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getAverageRealityScore,
  getPersonalTopGaps,
  getPolarizingTopics,
  getSelectionFrequency,
  getTopGaps,
  getValuePairAverage,
  getValuePairDispersion,
} from "../../src/lib/analytics/index";
import type { ResponseRow } from "../../src/types/survey";

function row(
  partial: Partial<ResponseRow> & Pick<ResponseRow, "question_code" | "response_type">,
): ResponseRow {
  return {
    id: crypto.randomUUID(),
    participant_id: "p1",
    option_code: null,
    numeric_value: null,
    text_value: null,
    ...partial,
  };
}

describe("analytics", () => {
  it("getSelectionFrequency counts shares", () => {
    const data: ResponseRow[][] = [
      [row({ question_code: "beliefs", option_code: "b1", response_type: "selection" })],
      [
        row({ question_code: "beliefs", option_code: "b1", response_type: "selection" }),
        row({ question_code: "beliefs", option_code: "b2", response_type: "selection" }),
      ],
    ];
    const stats = getSelectionFrequency(data, "beliefs", ["b1", "b2"]);
    assert.equal(stats[0].selectedCount, 2);
    assert.equal(stats[0].share, 1);
    assert.equal(stats[1].selectedCount, 1);
    assert.equal(stats[1].share, 0.5);
  });

  it("getAverageRealityScore uses only selected raters", () => {
    const data: ResponseRow[][] = [
      [
        row({ question_code: "beliefs", option_code: "b1", response_type: "selection" }),
        row({
          question_code: "beliefs",
          option_code: "b1",
          response_type: "reality_rating",
          numeric_value: 2,
        }),
      ],
      [
        row({
          question_code: "beliefs",
          option_code: "b1",
          response_type: "reality_rating",
          numeric_value: 5,
        }),
      ],
    ];
    assert.equal(getAverageRealityScore(data, "beliefs", "b1"), 2);
  });

  it("value pair average and dispersion", () => {
    assert.equal(getValuePairAverage([1, 3, 5]), 3);
    const d = getValuePairDispersion([1, 7]);
    assert.equal(d.min, 1);
    assert.equal(d.max, 7);
    assert.ok(d.sd > 0);
  });

  it("personal top gaps prefer low reality", () => {
    const responses: ResponseRow[] = [
      row({ question_code: "beliefs", option_code: "b1", response_type: "selection" }),
      row({
        question_code: "beliefs",
        option_code: "b1",
        response_type: "reality_rating",
        numeric_value: 1,
      }),
      row({ question_code: "principles", option_code: "p1", response_type: "selection" }),
      row({
        question_code: "principles",
        option_code: "p1",
        response_type: "reality_rating",
        numeric_value: 4,
      }),
    ];
    const gaps = getPersonalTopGaps(responses, 3);
    assert.equal(gaps[0].optionCode, "b1");
    assert.equal(gaps[0].gap, 4);
  });

  it("team top gaps and polarizing topics run on fixtures", () => {
    const data: ResponseRow[][] = [
      [
        row({ question_code: "beliefs", option_code: "b1", response_type: "selection" }),
        row({
          question_code: "beliefs",
          option_code: "b1",
          response_type: "reality_rating",
          numeric_value: 1,
        }),
        row({
          question_code: "values",
          option_code: "v_freedom_control",
          response_type: "bipolar",
          numeric_value: 1,
        }),
      ],
      [
        row({ question_code: "beliefs", option_code: "b1", response_type: "selection" }),
        row({
          question_code: "beliefs",
          option_code: "b1",
          response_type: "reality_rating",
          numeric_value: 2,
        }),
        row({
          question_code: "values",
          option_code: "v_freedom_control",
          response_type: "bipolar",
          numeric_value: 7,
        }),
      ],
    ];
    const gaps = getTopGaps(data, 3);
    assert.ok(gaps.length >= 1);
    assert.ok(gaps[0].gap > 0);
    const polarizing = getPolarizingTopics(data, 5);
    assert.ok(polarizing.some((p) => p.optionCode === "v_freedom_control"));
  });
});
