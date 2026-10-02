"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_SESSION_CODE } from "@/content/survey";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/s/${DEFAULT_SESSION_CODE}`);
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center text-[var(--ink-muted)]">
      Загрузка…
    </div>
  );
}
