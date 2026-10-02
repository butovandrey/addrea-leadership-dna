import type { ReactNode } from "react";
import Link from "next/link";
import { getOption, getOptionLabel, VALUE_PAIRS, WORLDVIEWS } from "@/content/survey";
import { getPersonalTopGaps } from "@/lib/analytics";
import type { ResponseRow } from "@/types/survey";

type Props = {
  name: string;
  sessionCode: string;
  responses: ResponseRow[];
};

export function PersonalDnaView({ name, sessionCode, responses }: Props) {
  const beliefs = responses
    .filter((r) => r.question_code === "beliefs" && r.response_type === "selection")
    .map((r) => r.option_code!)
    .filter(Boolean);

  const worldviews = responses
    .filter((r) => r.response_type === "worldview_preferred")
    .map((r) => WORLDVIEWS.find((w) => w.code === r.option_code))
    .filter(Boolean);

  const principles = responses
    .filter((r) => r.question_code === "principles" && r.response_type === "selection")
    .map((r) => r.option_code!)
    .filter(Boolean);

  const skills = responses
    .filter((r) => r.question_code === "skills" && r.response_type === "selection")
    .map((r) => r.option_code!)
    .filter(Boolean);

  const valueMap = Object.fromEntries(
    responses
      .filter((r) => r.response_type === "bipolar" && r.option_code)
      .map((r) => [r.option_code!, Number(r.numeric_value)]),
  );

  const gaps = getPersonalTopGaps(responses, 3);

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <p className="mb-3 text-sm font-medium tracking-[0.08em] text-[var(--accent)] uppercase">
        ADDREA Leadership DNA
      </p>
      <h1 className="font-display text-4xl text-[var(--ink)] sm:text-5xl">Ваш Leadership DNA</h1>
      <p className="mt-3 text-[var(--ink-muted)]">{name}</p>

      <Section title="Ключевые убеждения">
        <ul className="space-y-3">
          {beliefs.map((code) => (
            <li
              key={code}
              className="rounded-xl border border-[var(--border)] bg-white px-5 py-4 text-[15px] leading-snug text-[var(--ink)]"
            >
              {getOptionLabel(code)}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Картина мира">
        <div className="grid gap-3 sm:grid-cols-2">
          {worldviews.map((w) =>
            w ? (
              <div key={w.code} className="rounded-xl border border-[var(--border)] bg-white px-5 py-4">
                <p className="font-medium text-[var(--ink)]">{w.label}</p>
                {w.description ? (
                  <p className="mt-2 text-sm text-[var(--ink-muted)]">{w.description}</p>
                ) : null}
              </div>
            ) : null,
          )}
        </div>
      </Section>

      <Section title="Ценностные предпочтения">
        <div className="space-y-4">
          {VALUE_PAIRS.map((pair) => {
            const value = valueMap[pair.code] ?? 4;
            return (
              <div key={pair.code} className="rounded-xl border border-[var(--border)] bg-white px-5 py-4">
                <div className="mb-3 flex justify-between gap-4 text-sm text-[var(--ink)]">
                  <span>{pair.leftLabel}</span>
                  <span>{pair.rightLabel}</span>
                </div>
                <div className="relative h-2 rounded-full bg-[var(--border)]">
                  <div
                    className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-[var(--accent)]"
                    style={{ left: `calc(${((value - 1) / 6) * 100}% - 7px)` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Управленческие принципы">
        <ul className="space-y-3">
          {principles.map((code) => (
            <li
              key={code}
              className="rounded-xl border border-[var(--border)] bg-white px-5 py-4 text-[15px] leading-snug"
            >
              {getOptionLabel(code)}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Что вы считаете особенно важным для команды">
        <div className="flex flex-wrap gap-2">
          {skills.map((code) => (
            <span
              key={code}
              className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm text-[var(--ink)]"
            >
              {getOption(code)?.label ?? code}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Наибольшие разрывы">
        <p className="mb-5 text-sm leading-relaxed text-[var(--ink-muted)]">
          Это не оценка компании. Это области, где ваше представление о желаемом сильнее всего
          отличается от вашей оценки текущей реальности.
        </p>
        {gaps.length === 0 ? (
          <p className="text-sm text-[var(--ink-muted)]">
            Существенных разрывов между важностью и текущей оценкой не видно.
          </p>
        ) : (
          <div className="space-y-3">
            {gaps.map((g) => (
              <div key={g.optionCode} className="rounded-xl border border-[var(--border)] bg-white px-5 py-4">
                <p className="text-[15px] leading-snug text-[var(--ink)]">{g.label}</p>
                <p className="mt-2 text-sm text-[var(--ink-muted)]">
                  Оценка текущей реальности: {g.realityRating} из 5
                </p>
              </div>
            ))}
          </div>
        )}
      </Section>

      <div className="mt-12 border-t border-[var(--border)] pt-8">
        <Link
          href={`/t/${sessionCode}`}
          className="inline-flex h-12 items-center justify-center rounded-md bg-[var(--accent)] px-6 text-base font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
        >
          Посмотреть профиль команды
        </Link>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="mb-5 font-display text-2xl text-[var(--ink)]">{title}</h2>
      {children}
    </section>
  );
}
