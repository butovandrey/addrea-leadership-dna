import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-[140px] w-full rounded-md border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--ink)] placeholder:text-[var(--ink-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
        className,
      )}
      {...props}
    />
  );
}
