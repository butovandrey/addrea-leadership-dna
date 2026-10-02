"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RefreshResultsButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      className="mt-2 text-sm text-[var(--accent)] hover:underline disabled:opacity-50"
      disabled={pending}
    >
      {pending ? "Обновляем…" : "Обновить результаты"}
    </button>
  );
}
