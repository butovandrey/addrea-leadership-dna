import { cookies } from "next/headers";
import { ACCESS_COOKIE_NAME } from "@/content/survey";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function setAccessTokenCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
}

export async function getAccessTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_COOKIE_NAME)?.value ?? null;
}

export async function clearAccessTokenCookie() {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
