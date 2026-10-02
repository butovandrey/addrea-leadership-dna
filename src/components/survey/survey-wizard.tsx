"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { saveDraft, submitSurvey } from "@/actions/participant";
import { BipolarScale } from "@/components/survey/bipolar-scale";
import { ProgressHeader } from "@/components/survey/progress-header";
import { RealityRatingList } from "@/components/survey/reality-rating-list";
import { SelectableCard } from "@/components/survey/selectable-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  BELIEFS,
  HABITS,
  OPEN_ANSWER_MAX,
  PRINCIPLES,
  RULES,
  SKILLS,
  VALUE_PAIRS,
  WIZARD_PHASES,
  WORLDVIEWS,
  getOption,
  phaseToMajorStep,
} from "@/content/survey";
import { validatePhase } from "@/lib/validation/survey-schema";
import { useSurveyStore } from "@/store/survey-store";
import type { SurveyOption } from "@/types/survey";

function toggleCode(list: string[], code: string, max: number): string[] {
  if (list.includes(code)) return list.filter((c) => c !== code);
  if (list.length >= max) return list;
  return [...list, code];
}

export function SurveyWizard() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    hydrated,
    sessionCode,
    phaseIndex,
    draft,
    setPhaseIndex,
    patchDraft,
    setSaving,
    setError,
    error,
  } = useSurveyStore();

  const phase = WIZARD_PHASES[phaseIndex];
  const majorStep = phaseToMajorStep(phase);

  const selectedBeliefOptions = useMemo(
    () => draft.beliefs.selected.map((c) => getOption(c)!).filter(Boolean),
    [draft.beliefs.selected],
  );
  const selectedPrincipleOptions = useMemo(
    () => draft.principles.selected.map((c) => getOption(c)!).filter(Boolean),
    [draft.principles.selected],
  );
  const selectedRuleOptions = useMemo(
    () => draft.rules.selected.map((c) => getOption(c)!).filter(Boolean),
    [draft.rules.selected],
  );
  const selectedSkillOptions = useMemo(
    () => draft.skills.selected.map((c) => getOption(c)!).filter(Boolean),
    [draft.skills.selected],
  );
  const selectedHabitOptions = useMemo(
    () => draft.habits.selected.map((c) => getOption(c)!).filter(Boolean),
    [draft.habits.selected],
  );

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-[var(--ink-muted)]">
        Загрузка…
      </div>
    );
  }

  async function persist(nextIndex: number) {
    setSaving(true);
    const result = await saveDraft({
      sessionCode,
      draft: useSurveyStore.getState().draft,
      currentStep: nextIndex,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setError(null);
    return true;
  }

  function goBack() {
    if (phaseIndex === 0) {
      router.push(`/s/${sessionCode}`);
      return;
    }
    const next = phaseIndex - 1;
    setPhaseIndex(next);
    startTransition(() => {
      void persist(next);
    });
  }

  function goNext() {
    const err = validatePhase(phase, draft);
    if (err) {
      setLocalError(err);
      return;
    }
    setLocalError(null);

    if (phase === "open") {
      startTransition(async () => {
        setSaving(true);
        const result = await submitSurvey({ sessionCode, draft });
        setSaving(false);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.push(`/r/${result.data.participantId}`);
      });
      return;
    }

    const next = phaseIndex + 1;
    setPhaseIndex(next);
    startTransition(() => {
      void persist(next);
    });
  }

  const displayError = localError ?? error;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10 sm:py-14">
      <ProgressHeader majorStep={majorStep} />

      <div className="mb-8 animate-in fade-in duration-300">
        <StepContent
          phase={phase}
          draft={draft}
          selectedBeliefOptions={selectedBeliefOptions}
          selectedPrincipleOptions={selectedPrincipleOptions}
          selectedRuleOptions={selectedRuleOptions}
          selectedSkillOptions={selectedSkillOptions}
          selectedHabitOptions={selectedHabitOptions}
          patchDraft={patchDraft}
        />
      </div>

      {displayError ? (
        <p className="mb-4 text-sm text-[var(--danger)]" role="alert">
          {displayError}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-4 border-t border-[var(--border)] pt-6">
        <Button variant="ghost" onClick={goBack} disabled={pending}>
          Назад
        </Button>
        <Button onClick={goNext} disabled={pending} size="lg">
          {phase === "open" ? (pending ? "Сохраняем…" : "Завершить") : pending ? "…" : "Далее"}
        </Button>
      </div>
    </div>
  );
}

function StepContent({
  phase,
  draft,
  selectedBeliefOptions,
  selectedPrincipleOptions,
  selectedRuleOptions,
  selectedSkillOptions,
  selectedHabitOptions,
  patchDraft,
}: {
  phase: (typeof WIZARD_PHASES)[number];
  draft: ReturnType<typeof useSurveyStore.getState>["draft"];
  selectedBeliefOptions: SurveyOption[];
  selectedPrincipleOptions: SurveyOption[];
  selectedRuleOptions: SurveyOption[];
  selectedSkillOptions: SurveyOption[];
  selectedHabitOptions: SurveyOption[];
  patchDraft: (updater: (d: typeof draft) => typeof draft) => void;
}) {
  switch (phase) {
    case "beliefs_select":
      return (
        <MultiSelectBlock
          title="Во что вы верите как руководитель?"
          subtitle="Выберите до 4 утверждений, которые наиболее близки вам лично."
          options={BELIEFS}
          selected={draft.beliefs.selected}
          max={4}
          onToggle={(code) =>
            patchDraft((d) => ({
              ...d,
              beliefs: {
                selected: toggleCode(d.beliefs.selected, code, 4),
                ratings: d.beliefs.ratings,
              },
            }))
          }
        />
      );
    case "beliefs_rating":
      return (
        <RatingBlock
          title="А насколько эти утверждения описывают ADDREA сегодня?"
          items={selectedBeliefOptions}
          ratings={draft.beliefs.ratings}
          onChange={(code, value) =>
            patchDraft((d) => ({
              ...d,
              beliefs: {
                ...d.beliefs,
                ratings: { ...d.beliefs.ratings, [code]: value },
              },
            }))
          }
        />
      );
    case "worldview_preferred":
      return (
        <MultiSelectBlock
          title="Как вы в первую очередь воспринимаете организацию?"
          subtitle="Выберите до двух моделей, которые вам наиболее близки."
          options={WORLDVIEWS}
          selected={draft.worldview.preferred}
          max={2}
          onToggle={(code) =>
            patchDraft((d) => ({
              ...d,
              worldview: {
                ...d.worldview,
                preferred: toggleCode(d.worldview.preferred, code, 2),
              },
            }))
          }
        />
      );
    case "worldview_current":
      return (
        <MultiSelectBlock
          title="А какие модели лучше всего описывают ADDREA сегодня?"
          subtitle="Выберите до двух."
          options={WORLDVIEWS}
          selected={draft.worldview.current}
          max={2}
          onToggle={(code) =>
            patchDraft((d) => ({
              ...d,
              worldview: {
                ...d.worldview,
                current: toggleCode(d.worldview.current, code, 2),
              },
            }))
          }
        />
      );
    case "values":
      return (
        <div>
          <h1 className="font-display text-3xl leading-tight text-[var(--ink)] sm:text-4xl">
            Когда две хорошие вещи конфликтуют, куда вы скорее склоняетесь?
          </h1>
          <p className="mt-3 text-[var(--ink-muted)]">Здесь нет правильной стороны шкалы.</p>
          <div className="mt-8 space-y-4">
            {VALUE_PAIRS.map((pair) => (
              <BipolarScale
                key={pair.code}
                leftLabel={pair.leftLabel!}
                rightLabel={pair.rightLabel!}
                value={draft.values[pair.code]}
                onChange={(value) =>
                  patchDraft((d) => ({
                    ...d,
                    values: { ...d.values, [pair.code]: value },
                  }))
                }
              />
            ))}
          </div>
        </div>
      );
    case "principles_select":
      return (
        <MultiSelectBlock
          title="Какие управленческие принципы вам наиболее близки?"
          subtitle="Выберите до 5."
          options={PRINCIPLES}
          selected={draft.principles.selected}
          max={5}
          onToggle={(code) =>
            patchDraft((d) => ({
              ...d,
              principles: {
                selected: toggleCode(d.principles.selected, code, 5),
                ratings: d.principles.ratings,
              },
            }))
          }
        />
      );
    case "principles_rating":
      return (
        <RatingBlock
          title="Насколько мы реально живём согласно этим принципам?"
          items={selectedPrincipleOptions}
          ratings={draft.principles.ratings}
          onChange={(code, value) =>
            patchDraft((d) => ({
              ...d,
              principles: {
                ...d.principles,
                ratings: { ...d.principles.ratings, [code]: value },
              },
            }))
          }
        />
      );
    case "rules_select":
      return (
        <MultiSelectBlock
          title="Какие правила работы были бы полезны нашей управленческой команде?"
          subtitle="Выберите до 6."
          options={RULES}
          selected={draft.rules.selected}
          max={6}
          onToggle={(code) =>
            patchDraft((d) => ({
              ...d,
              rules: {
                selected: toggleCode(d.rules.selected, code, 6),
                ratings: d.rules.ratings,
              },
            }))
          }
        />
      );
    case "rules_rating":
      return (
        <RatingBlock
          title="Насколько это характерно для нас сейчас?"
          items={selectedRuleOptions}
          ratings={draft.rules.ratings}
          onChange={(code, value) =>
            patchDraft((d) => ({
              ...d,
              rules: {
                ...d.rules,
                ratings: { ...d.rules.ratings, [code]: value },
              },
            }))
          }
        />
      );
    case "skills_select":
      return (
        <MultiSelectBlock
          title="Какие способности особенно важны для нашей TOP-команды?"
          subtitle={`Выбрано ${draft.skills.selected.length} из 5.`}
          options={SKILLS}
          selected={draft.skills.selected}
          max={5}
          onToggle={(code) =>
            patchDraft((d) => ({
              ...d,
              skills: {
                selected: toggleCode(d.skills.selected, code, 5),
                ratings: d.skills.ratings,
              },
            }))
          }
        />
      );
    case "skills_rating":
      return (
        <RatingBlock
          title="Насколько сильна наша команда в этом сегодня?"
          items={selectedSkillOptions}
          ratings={draft.skills.ratings}
          onChange={(code, value) =>
            patchDraft((d) => ({
              ...d,
              skills: {
                ...d.skills,
                ratings: { ...d.skills.ratings, [code]: value },
              },
            }))
          }
        />
      );
    case "habits_select":
      return (
        <MultiSelectBlock
          title="Какие модели поведения должны стать для нас естественными?"
          subtitle="Выберите до 6."
          options={HABITS}
          selected={draft.habits.selected}
          max={6}
          onToggle={(code) =>
            patchDraft((d) => ({
              ...d,
              habits: {
                selected: toggleCode(d.habits.selected, code, 6),
                ratings: d.habits.ratings,
              },
            }))
          }
        />
      );
    case "habits_rating":
      return (
        <RatingBlock
          title="Насколько это уже является нашей привычкой?"
          items={selectedHabitOptions}
          ratings={draft.habits.ratings}
          onChange={(code, value) =>
            patchDraft((d) => ({
              ...d,
              habits: {
                ...d.habits,
                ratings: { ...d.habits.ratings, [code]: value },
              },
            }))
          }
        />
      );
    case "open":
      return (
        <div>
          <h1 className="font-display text-3xl leading-tight text-[var(--ink)] sm:text-4xl">
            И последний вопрос
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-[var(--ink-muted)]">
            Какую одну черту нашей управленческой культуры вы ни в коем случае не хотели бы
            потерять по мере роста компании?
          </p>
          <div className="mt-8">
            <Textarea
              value={draft.openAnswer}
              maxLength={OPEN_ANSWER_MAX}
              onChange={(e) =>
                patchDraft((d) => ({
                  ...d,
                  openAnswer: e.target.value,
                }))
              }
              placeholder="Напишите одной фразой…"
            />
            <p className="mt-2 text-right text-xs text-[var(--ink-subtle)]">
              {draft.openAnswer.length} / {OPEN_ANSWER_MAX}
            </p>
          </div>
        </div>
      );
    default:
      return null;
  }
}

function MultiSelectBlock({
  title,
  subtitle,
  options,
  selected,
  max,
  onToggle,
}: {
  title: string;
  subtitle: string;
  options: SurveyOption[];
  selected: string[];
  max: number;
  onToggle: (code: string) => void;
}) {
  return (
    <div>
      <h1 className="font-display text-3xl leading-tight text-[var(--ink)] sm:text-4xl">{title}</h1>
      <p className="mt-3 text-[var(--ink-muted)]">{subtitle}</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {options.map((opt) => (
          <SelectableCard
            key={opt.code}
            title={opt.label}
            description={opt.description}
            selected={selected.includes(opt.code)}
            disabled={!selected.includes(opt.code) && selected.length >= max}
            onToggle={() => onToggle(opt.code)}
          />
        ))}
      </div>
    </div>
  );
}

function RatingBlock({
  title,
  items,
  ratings,
  onChange,
}: {
  title: string;
  items: SurveyOption[];
  ratings: Record<string, number>;
  onChange: (code: string, value: number) => void;
}) {
  return (
    <div>
      <h1 className="font-display text-3xl leading-tight text-[var(--ink)] sm:text-4xl">{title}</h1>
      <p className="mt-3 text-[var(--ink-muted)]">Шкала от 1 до 5.</p>
      <div className="mt-8">
        <RealityRatingList items={items} ratings={ratings} onChange={onChange} />
      </div>
    </div>
  );
}
