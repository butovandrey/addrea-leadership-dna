import { notFound } from "next/navigation";
import { getTeamDna } from "@/actions/team";
import { TeamDnaView } from "@/components/team/team-dna-view";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ sessionCode: string }>;
};

export default async function TeamDnaPage({ params }: Props) {
  const { sessionCode } = await params;
  const result = await getTeamDna(sessionCode);
  if (!result.ok) {
    if (result.error.includes("не найдена")) notFound();
    return (
      <div className="mx-auto max-w-xl px-6 py-20">
        <h1 className="font-display text-3xl">Не удалось загрузить Team DNA</h1>
        <p className="mt-3 text-[var(--ink-muted)]">{result.error}</p>
      </div>
    );
  }

  return <TeamDnaView data={result.data} />;
}
