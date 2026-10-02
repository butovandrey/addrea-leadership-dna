import type { ReactNode } from "react";
import Link from "next/link";
import { RefreshResultsButton } from "@/components/team/refresh-results-button";
import { WorldviewCompareChart } from "@/components/team/worldview-compare-chart";
import type { TeamDnaResult } from "@/types/survey";

type Props = {
  data: TeamDnaResult;
  onRefresh?: () => void;
};

export function TeamDnaView({ data, onRefresh }: Props) {
  const n = data.completedCount;
  const insufficient = Boolean(data.insufficientSample) || n < 3;

  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-3 text-sm font-medium tracking-[0.08em] text-[var(--accent)] uppercase">
            ADDREA Leadership DNA
          </p>
          <h1 className="font-display text-4xl text-[var(--ink)] sm:text-5xl">Team DNA</h1>
          <p className="mt-3 text-[var(--ink-muted)]">{data.sessionName}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-[var(--ink-muted)]">Ответили: {n}</p>
          <RefreshResultsButton onRefresh={onRefresh} />
        </div>
      </div>

      {insufficient ? (
        <InsufficientSampleState sessionCode={data.sessionCode} count={n} />
      ) : (
        <>
          <Section
            title="Что нас объединяет"
            subtitle="Утверждения и принципы с наибольшей долей выбора среди завершивших."
          >
            <div className="grid gap-8 md:grid-cols-2">
              <ConsensusList title="Убеждения" items={data.topBeliefs} />
              <ConsensusList title="Принципы" items={data.topPrinciples} />
            </div>
          </Section>

          <Section
            title="Как мы видим компанию"
            subtitle="Сравнение предпочитаемой картины мира и восприятия ADDREA сегодня."
          >
            <WorldviewCompareChart worldviews={data.worldviews} />
            <div className="mt-4 space-y-3">
              {data.worldviews.map((w) => (
                <div
                  key={w.optionCode}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--border)] pb-3 text-sm last:border-0"
                >
                  <span className="text-[var(--ink)]">{w.label}</span>
                  <span className="text-[var(--ink-muted)]">
                    Нам близко: {Math.round(w.preferredShare * 100)}% · Сегодня:{" "}
                    {Math.round(w.currentShare * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </Section>

          <Section
            title="Ценностный профиль команды"
            subtitle="Среднее положение команды и разброс ответов. Края шкалы не означают «лучше» или «хуже»."
          >
            <div className="space-y-4">
              {data.values.map((v) => (
                <div key={v.optionCode} className="rounded-xl border border-[var(--border)] bg-white px-5 py-5">
                  <div className="mb-3 flex justify-between gap-4 text-sm text-[var(--ink)]">
                    <span>{v.leftLabel}</span>
                    <span>{v.rightLabel}</span>
                  </div>
                  <div className="relative h-2 rounded-full bg-[var(--border)]">
                    <>
                      <div
                        className="absolute top-0 h-2 rounded-full bg-[var(--accent-soft)]"
                        style={{
                          left: `${((v.min - 1) / 6) * 100}%`,
                          width: `${Math.max(((v.max - v.min) / 6) * 100, 2)}%`,
                        }}
                      />
                      <div
                        className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-[var(--accent)]"
                        style={{ left: `calc(${((v.mean - 1) / 6) * 100}% - 7px)` }}
                      />
                    </>
                  </div>
                  {v.sd > 0 ? (
                    <p className="mt-2 text-xs text-[var(--ink-subtle)]">
                      Разброс (SD): {v.sd.toFixed(2)}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </Section>

          <Section
            title="Хотим ↔ Живём"
            subtitle="Разрыв между востребованностью и текущим ощущением. Это не научная метрика — ориентир для разговора."
          >
            <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-[var(--border)] text-[var(--ink-muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Тема</th>
                    <th className="px-4 py-3 font-medium">Выбрали</th>
                    <th className="px-4 py-3 font-medium">Сейчас</th>
                    <th className="px-4 py-3 font-medium">Разрыв</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topGaps.map((g) => (
                    <tr key={g.optionCode} className="border-b border-[var(--border)] last:border-0">
                      <td className="px-4 py-3 text-[var(--ink)]">{g.label}</td>
                      <td className="px-4 py-3 text-[var(--ink-muted)]">
                        {Math.round(g.selectionShare * 100)}%
                      </td>
                      <td className="px-4 py-3 text-[var(--ink-muted)]">
                        {g.realityScore.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 font-medium text-[var(--ink)]">
                        {g.gap.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                  {data.topGaps.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-[var(--ink-muted)]">
                        Пока недостаточно данных для расчёта разрывов.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Section>

          <Section
            title="Где наши позиции различаются"
            subtitle="Темы с наибольшим разбросом или без выраженного консенсуса."
          >
            {data.polarizing.length === 0 ? (
              <p className="text-sm text-[var(--ink-muted)]">
                При текущем числе ответов выраженных расхождений не видно.
              </p>
            ) : (
              <div className="space-y-3">
                {data.polarizing.map((p) => (
                  <div
                    key={`${p.kind}-${p.optionCode}`}
                    className="rounded-xl border border-[var(--border)] bg-white px-5 py-4"
                  >
                    <p className="text-[15px] leading-snug text-[var(--ink)]">{p.label}</p>
                    <p className="mt-2 text-sm text-[var(--ink-muted)]">{p.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section
            title="Что мы не хотим потерять"
            subtitle="Анонимные ответы участников. Без интерпретаций — как есть."
          >
            {data.openAnswers.length === 0 ? (
              <p className="text-sm text-[var(--ink-muted)]">Пока нет открытых ответов.</p>
            ) : (
              <div className="grid gap-4">
                {data.openAnswers.map((quote, idx) => (
                  <blockquote
                    key={`${idx}-${quote.slice(0, 24)}`}
                    className="rounded-xl border border-[var(--border)] bg-white px-6 py-5 font-display text-xl leading-relaxed text-[var(--ink)]"
                  >
                    «{quote}»
                  </blockquote>
                ))}
              </div>
            )}
          </Section>
        </>
      )}

      <div className="mt-14 border-t border-[var(--border)] pt-8">
        <Link href={`/s/${data.sessionCode}`} className="text-sm text-[var(--accent)] hover:underline">
          Пройти опрос
        </Link>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-14">
      <h2 className="font-display text-2xl text-[var(--ink)] sm:text-3xl">{title}</h2>
      <p className="mt-2 mb-6 max-w-2xl text-sm leading-relaxed text-[var(--ink-muted)]">
        {subtitle}
      </p>
      {children}
    </section>
  );
}

function ConsensusList({
  title,
  items,
}: {
  title: string;
  items: TeamDnaResult["topBeliefs"];
}) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-medium tracking-wide text-[var(--ink-muted)] uppercase">
        {title}
      </h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.optionCode} className="rounded-xl border border-[var(--border)] bg-white px-5 py-4">
            <p className="text-2xl font-medium text-[var(--accent)]">
              {Math.round(item.share * 100)}%
            </p>
            <p className="mt-1 text-[15px] leading-snug text-[var(--ink)]">{item.label}</p>
            <p className="mt-2 text-xs text-[var(--ink-subtle)]">
              {item.selectedCount} из {item.totalCompleted}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsufficientSampleState({
  sessionCode,
  count,
}: {
  sessionCode: string;
  count: number;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-6 py-10 text-center">
      <p className="text-[var(--ink-muted)]">
        Результаты команды появятся после минимум 3 завершённых ответов.
      </p>
      <p className="mt-3 text-sm text-[var(--ink-subtle)]">Сейчас ответили: {count}</p>
      <Link
        href={`/s/${sessionCode}`}
        className="mt-4 inline-flex text-sm font-medium text-[var(--accent)] hover:underline"
      >
        Открыть ссылку для участников
      </Link>
    </div>
  );
}
