"use client";

import { REALITY_SCALE_LABELS } from "@/content/survey";
import { cn } from "@/lib/utils";

type Props = {
  items: Array<{ code: string; label: string }>;
  ratings: Record<string, number>;
  onChange: (code: string, value: number) => void;
};

export function RealityRatingList({ items, ratings, onChange }: Props) {
  return (
    <div className="space-y-6">
      {items.map((item) => (
        <div key={item.code} className="rounded-xl border border-[var(--border)] bg-white p-5">
          <p className="mb-4 text-[15px] font-medium leading-snug text-[var(--ink)]">{item.label}</p>
          <div className="flex items-center justify-between gap-2">
            <span className="hidden text-xs text-[var(--ink-subtle)] sm:block">
              {REALITY_SCALE_LABELS[1]}
            </span>
            <div className="flex flex-1 justify-center gap-2 sm:gap-3">
              {[1, 2, 3, 4, 5].map((n) => {
                const active = ratings[item.code] === n;
                return (
                  <button
                    key={n}
                    type="button"
                    aria-label={`Оценка ${n}`}
                    onClick={() => onChange(item.code, n)}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border text-sm transition-colors",
                      active
                        ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                        : "border-[var(--border)] bg-white text-[var(--ink-muted)] hover:border-[var(--border-strong)]",
                    )}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            <span className="hidden text-xs text-[var(--ink-subtle)] sm:block">
              {REALITY_SCALE_LABELS[5]}
            </span>
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-[var(--ink-subtle)] sm:hidden">
            <span>{REALITY_SCALE_LABELS[1]}</span>
            <span>{REALITY_SCALE_LABELS[5]}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
