import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";

export async function isAdminAuthed(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === "1";
}

export function isCorrectAdminCredentials(username: string, password: string): boolean {
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedUsername || !expectedPassword) return false;
  return username === expectedUsername && password === expectedPassword;
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
