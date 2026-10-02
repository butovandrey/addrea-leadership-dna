import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentParticipantForSession, getSessionByCode } from "@/actions/participant";
import { SurveyClient } from "@/components/survey/survey-client";
import { normalizeDraft } from "@/lib/validation/survey-schema";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ sessionCode: string }>;
};

export default async function SurveyPage({ params }: Props) {
  const { sessionCode } = await params;
  const session = await getSessionByCode(sessionCode);
  if (!session) notFound();

  const current = await getCurrentParticipantForSession(sessionCode);
  if (!current.ok) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20">
        <p className="text-[var(--danger)]">{current.error}</p>
        <Link href={`/s/${sessionCode}`} className="mt-4 inline-block text-[var(--accent)]">
          Вернуться к началу
        </Link>
      </div>
    );
  }

  if (!current.data) {
    redirect(`/s/${sessionCode}`);
  }

  if (current.data.participant.completed_at) {
    redirect(`/r/${current.data.participant.id}`);
  }

  const participant = current.data.participant;

  return (
    <SurveyClient
      participantId={participant.id}
      sessionCode={sessionCode}
      draft={normalizeDraft(participant.draft)}
      currentStep={participant.current_step}
    />
  );
}
