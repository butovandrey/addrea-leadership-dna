export function generateStaticParams() {
  return [{ participantId: "_" }];
}

export default function PersonalResultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
