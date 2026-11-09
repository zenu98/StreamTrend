import { NextRequest } from "next/server";

// 임시 확인용: 공식 API 채널 응답 원본 보기 (로컬 전용)
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "not found" }, { status: 404 });
  }

  const ids = request.nextUrl.searchParams.getAll("id");
  if (ids.length === 0) {
    return Response.json(
      { error: "?id=채널ID 를 붙여주세요" },
      { status: 400 },
    );
  }

  const res = await fetch(
    `https://openapi.chzzk.naver.com/open/v1/channels?${ids
      .map((id) => `channelIds=${id}`)
      .join("&")}`,
    {
      cache: "no-store",
      headers: {
        "Client-Id": process.env.CHZZK_CLIENT_ID!,
        "Client-Secret": process.env.CHZZK_CLIENT_SECRET!,
      },
    },
  );

  const json = await res.json();
  const data = json.content?.data ?? [];

  return Response.json({
    status: res.status,
    // 응답에 들어있는 필드 이름 전체 (새 등급 필드가 있는지 확인용)
    keys: [...new Set(data.flatMap((d: any) => Object.keys(d)))],
    data,
  });
}
