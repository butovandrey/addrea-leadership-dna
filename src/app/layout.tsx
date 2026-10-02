import type { Metadata } from "next";
import { DM_Sans, Newsreader } from "next/font/google";
import "./globals.css";

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
});

const display = Newsreader({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "ADDREA Leadership DNA",
  description:
    "Управленческий reflection tool для TOP-команды ADDREA: убеждения, картина мира, ценности, принципы и разрывы между желаемым и текущим.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${body.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--ink)]">
        {children}
      </body>
    </html>
  );
}
