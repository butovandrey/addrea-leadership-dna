"use client";

import { cn } from "@/lib/utils";
import type { KeyboardEvent } from "react";

type Props = {
  title: string;
  description?: string;
  selected: boolean;
  disabled?: boolean;
  onToggle: () => void;
  className?: string;
};

export function SelectableCard({
  title,
  description,
  selected,
  disabled,
  onToggle,
  className,
}: Props) {
  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!disabled) onToggle();
    }
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      disabled={disabled && !selected}
      onClick={onToggle}
      onKeyDown={onKeyDown}
      className={cn(
        "group flex min-h-[112px] w-full flex-col items-start rounded-xl border px-5 py-4 text-left transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2",
        selected
          ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[inset_0_0_0_1px_var(--accent)]"
          : "border-[var(--border)] bg-white hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)]",
        disabled && !selected && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <span className="text-[15px] font-medium leading-snug text-[var(--ink)]">{title}</span>
      {description ? (
        <span className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">{description}</span>
      ) : null}
    </button>
  );
}
