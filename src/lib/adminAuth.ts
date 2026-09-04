import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";

export async function isAdminAuthed(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === "1";
}

export function isCorrectAdminPassword(password: string): boolean {
  return !!process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD;
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
