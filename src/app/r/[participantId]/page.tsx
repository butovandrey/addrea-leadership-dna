import Link from "next/link";
import { getPersonalResult } from "@/actions/participant";
import { PersonalDnaView } from "@/components/results/personal-dna-view";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ participantId: string }>;
};

export default async function PersonalResultPage({ params }: Props) {
  const { participantId } = await params;
  const result = await getPersonalResult(participantId);

  if (!result.ok) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20">
        <h1 className="font-display text-3xl text-[var(--ink)]">Результат недоступен</h1>
        <p className="mt-3 text-[var(--ink-muted)]">{result.error}</p>
        <Link href="/" className="mt-6 inline-block text-[var(--accent)] hover:underline">
          Начать заново
        </Link>
      </div>
    );
  }

  return (
    <PersonalDnaView
      name={result.data.name}
      sessionCode={result.data.sessionCode}
      responses={result.data.responses}
    />
  );
}
