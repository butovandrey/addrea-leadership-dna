import { redirect } from "next/navigation";
import { DEFAULT_SESSION_CODE } from "@/content/survey";

export default function HomePage() {
  redirect(`/s/${DEFAULT_SESSION_CODE}`);
}
