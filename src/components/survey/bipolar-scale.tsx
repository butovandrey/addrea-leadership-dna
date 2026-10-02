"use client";

import { cn } from "@/lib/utils";

type Props = {
  leftLabel: string;
  rightLabel: string;
  value?: number;
  onChange: (value: number) => void;
};

export function BipolarScale({ leftLabel, rightLabel, value, onChange }: Props) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white px-5 py-6">
      <div className="mb-4 flex flex-col gap-1 sm:hidden">
        <span className="text-sm font-medium text-[var(--ink)]">{leftLabel}</span>
        <span className="text-xs text-[var(--ink-subtle)]">↔ {rightLabel}</span>
      </div>

      <div className="hidden items-center gap-4 sm:grid sm:grid-cols-[1fr_auto_1fr]">
        <span className="text-right text-sm font-medium text-[var(--ink)]">{leftLabel}</span>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <Dot key={n} active={value === n} onClick={() => onChange(n)} />
          ))}
        </div>
        <span className="text-sm font-medium text-[var(--ink)]">{rightLabel}</span>
      </div>

      <div className="flex items-center justify-between gap-1 sm:hidden">
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <Dot key={n} active={value === n} onClick={() => onChange(n)} />
        ))}
      </div>
    </div>
  );
}

function Dot({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-8 w-8 rounded-full border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
        active
          ? "scale-110 border-[var(--accent)] bg-[var(--accent)]"
          : "border-[var(--border-strong)] bg-white hover:border-[var(--accent)]",
      )}
    />
  );
}
