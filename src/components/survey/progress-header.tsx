type Props = {
  majorStep: number;
  total?: number;
};

export function ProgressHeader({ majorStep, total = 7 }: Props) {
  const pct = Math.min(100, Math.round((majorStep / total) * 100));
  return (
    <div className="mb-10">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <p className="text-sm font-medium tracking-wide text-[var(--ink-muted)]">
          Шаг {majorStep} из {total}
        </p>
        <p className="text-xs text-[var(--ink-subtle)]">ADDREA Leadership DNA</p>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--border)]">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
