import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const jar = await cookies();
  const savedState = jar.get("chzzk_state")?.value;
  jar.delete("chzzk_state");

  if (!code || !state || state !== savedState) {
    return Response.json({ error: "invalid state" }, { status: 400 });
  }

  const res = await fetch("https://openapi.chzzk.naver.com/auth/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grantType: "authorization_code",
      clientId: process.env.CHZZK_CLIENT_ID,
      clientSecret: process.env.CHZZK_CLIENT_SECRET,
      code,
      state,
    }),
  });

  if (!res.ok) {
    return Response.json(
      { error: "token exchange failed", detail: await res.text() },
      { status: 502 },
    );
  }

  const { content } = await res.json();
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  jar.set("chzzk_access", content.accessToken, {
    ...cookieOpts,
    maxAge: Number(content.expiresIn), // 1일
  });
  jar.set("chzzk_refresh", content.refreshToken, {
    ...cookieOpts,
    maxAge: 60 * 60 * 24 * 30, // 30일
  });

  redirect("/api/auth/chzzk/me/followers");
}
