import { notFound, redirect } from "next/navigation";
import { getCurrentParticipantForSession, getSessionByCode } from "@/actions/participant";
import { WelcomeForm } from "@/components/survey/welcome-form";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ sessionCode: string }>;
};

export default async function SessionWelcomePage({ params }: Props) {
  const { sessionCode } = await params;
  const session = await getSessionByCode(sessionCode);
  if (!session) notFound();

  const current = await getCurrentParticipantForSession(sessionCode);
  if (current.ok && current.data?.participant.completed_at) {
    redirect(`/r/${current.data.participant.id}`);
  }
  if (current.ok && current.data?.participant && !current.data.participant.completed_at) {
    redirect(`/s/${sessionCode}/survey`);
  }

  return <WelcomeForm sessionCode={session.code} sessionName={session.name} />;
}
