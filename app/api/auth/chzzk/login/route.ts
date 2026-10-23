import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function GET() {
  // 요청 위조 방지용 임의 값. 콜백에서 같은 값이 돌아오는지 확인
  const state = crypto.randomUUID();
  (await cookies()).set("chzzk_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });

  const url = new URL("https://chzzk.naver.com/account-interlock");
  url.searchParams.set("clientId", process.env.CHZZK_CLIENT_ID!);
  url.searchParams.set("redirectUri", process.env.CHZZK_REDIRECT_URI!);
  url.searchParams.set("state", state);

  redirect(url.toString());
}
