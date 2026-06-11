export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path") ?? "categories/search";
  const query = searchParams.get("query") ?? "";

  const apiRes = await fetch(
    `https://openapi.chzzk.naver.com/open/v1/${path}?query=${query}`,
    {
      headers: {
        "Client-Id": process.env.CHZZK_CLIENT_ID!,
        "Client-Secret": process.env.CHZZK_CLIENT_SECRET!,
        "Content-Type": "application/json",
      },
    },
  );

  const data = await apiRes.json();
  return Response.json(data);
}
