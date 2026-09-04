import { NextRequest, NextResponse } from "next/server";
import { isCorrectAdminCredentials, ADMIN_COOKIE_NAME } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json().catch(() => ({ username: "", password: "" }));

  if (!isCorrectAdminCredentials(username ?? "", password ?? "")) {
    return NextResponse.json({ error: "Incorrect username or password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours
  });
  return res;
}
