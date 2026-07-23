export async function GET() {
  const res = await fetch(
    "https://openapi.chzzk.naver.com/open/v1/channels?channelIds=dc740d5bb5680666b6bf2ebc58a8203f",
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
