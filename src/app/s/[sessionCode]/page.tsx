import { DEFAULT_SESSION_CODE } from "@/content/survey";
import { WelcomeForm } from "@/components/survey/welcome-form";

export function generateStaticParams() {
  return [{ sessionCode: DEFAULT_SESSION_CODE }];
}

type Props = {
  params: Promise<{ sessionCode: string }>;
};

export default async function SessionWelcomePage({ params }: Props) {
  const { sessionCode } = await params;
  return <WelcomeForm sessionCode={sessionCode} />;
}
