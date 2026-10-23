import { cookies } from "next/headers";

export async function GET(request: Request) {
  const token = (await cookies()).get("chzzk_access")?.value;
  if (!token) {
    return Response.json({ error: "login required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") ?? "0";

  const res = await fetch(
    `https://openapi.chzzk.naver.com/open/v1/channels/followers?page=${page}&size=50`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );

  if (res.status === 401) {
    return Response.json({ error: "token expired" }, { status: 401 });
  }
  const json = await res.json();
  return Response.json(json.content ?? json, { status: res.status });
}
