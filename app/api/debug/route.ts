// app/api/test-live/route.ts
export async function GET() {
  const res = await fetch(
    "https://openapi.chzzk.naver.com/open/v1/lives?size=10&sortType=POPULAR",
    {
      headers: {
        "Client-Id": process.env.CHZZK_CLIENT_ID!,
        "Client-Secret": process.env.CHZZK_CLIENT_SECRET!,
      },
    },
  );
  const json = await res.json();
  return Response.json(json.content.data[0]);
}
