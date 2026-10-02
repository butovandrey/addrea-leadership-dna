import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-12 w-full rounded-md border border-[var(--border)] bg-white px-4 text-base text-[var(--ink)] placeholder:text-[var(--ink-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
        className,
      )}
      {...props}
    />
  );
}
