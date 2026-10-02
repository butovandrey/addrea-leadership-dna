import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        size === "md" && "h-11 px-5 text-sm",
        size === "lg" && "h-12 px-6 text-base",
        variant === "primary" && "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]",
        variant === "secondary" &&
          "border border-[var(--border)] bg-white text-[var(--ink)] hover:bg-[var(--surface-muted)]",
        variant === "ghost" && "text-[var(--ink-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]",
        className,
      )}
      {...props}
    />
  );
}
