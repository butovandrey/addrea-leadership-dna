"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { startParticipant } from "@/actions/participant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  sessionCode: string;
  sessionName: string;
};

export function WelcomeForm({ sessionCode, sessionName }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await startParticipant({ sessionCode, name });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/s/${sessionCode}/survey`);
    });
  }

  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-2xl flex-col justify-center px-6 py-16">
      <p className="mb-4 text-sm font-medium tracking-[0.08em] text-[var(--accent)] uppercase">
        ADDREA Leadership DNA
      </p>
      <h1 className="font-display text-4xl leading-[1.15] text-[var(--ink)] sm:text-5xl">
        Из чего на самом деле складывается наша культура?
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-[var(--ink-muted)]">
        Перед нашей встречей предлагаю немного порефлексировать о том, во что мы верим, как видим
        компанию и каким хотим видеть наше ежедневное поведение.
      </p>
      <p className="mt-4 text-lg leading-relaxed text-[var(--ink-muted)]">
        Здесь нет правильных ответов.
      </p>
      <p className="mt-4 text-lg leading-relaxed text-[var(--ink-muted)]">
        Не выбирайте то, что «должно быть правильно». Выбирайте то, что действительно вам близко.
      </p>
      <p className="mt-4 text-lg leading-relaxed text-[var(--ink-muted)]">
        Результаты команды будут показаны только в агрегированном виде.
      </p>

      <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-5 py-4 text-sm leading-relaxed text-[var(--ink-muted)]">
        Индивидуальные ответы не показываются другим участникам. В общем профиле используются только
        агрегированные данные. Сессия: {sessionName}.
      </div>

      <form onSubmit={onSubmit} className="mt-10 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[var(--ink)]">Ваше имя</span>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Как к вам обращаться"
            autoComplete="name"
            required
          />
        </label>
        {error ? (
          <p className="text-sm text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" disabled={pending || !name.trim()} className="w-full sm:w-auto">
          {pending ? "Создаём…" : "Начать — около 7 минут"}
        </Button>
      </form>
    </div>
  );
}
