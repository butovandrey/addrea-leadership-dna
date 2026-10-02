import { DEFAULT_SESSION_CODE } from "@/content/survey";

export function generateStaticParams() {
  return [{ sessionCode: DEFAULT_SESSION_CODE }];
}

export default function TeamSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
