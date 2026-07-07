export async function GET() {
  const res = await fetch(
    "https://openapi.chzzk.naver.com/open/v1/channels/followers?channelId=45e71a76e949e16a34764deb962f9d9f",
    {
      headers: {
        "Client-Id": process.env.CHZZK_CLIENT_ID!,
        "Client-Secret": process.env.CHZZK_CLIENT_SECRET!,
      },
    },
  );
  const json = await res.json();
  return Response.json(json);
}
