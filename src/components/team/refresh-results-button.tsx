"use client";

import { useTransition } from "react";

type Props = {
  onRefresh?: () => void;
};

export function RefreshResultsButton({ onRefresh }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        if (!onRefresh) return;
        startTransition(() => {
          onRefresh();
        });
      }}
      className="mt-2 text-sm text-[var(--accent)] hover:underline disabled:opacity-50"
      disabled={pending || !onRefresh}
    >
      {pending ? "Обновляем…" : "Обновить результаты"}
    </button>
  );
}
