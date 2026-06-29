import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    select: { categoryId: true, categoryValue: true },
  });

  let updated = 0;
  let failed = 0;

  await Promise.all(
    categories.map(async (cat) => {
      const res = await fetch(
        `https://openapi.chzzk.naver.com/open/v1/categories/search?query=${encodeURIComponent(cat.categoryValue)}&size=20`,
        {
          headers: {
            "Client-Id": process.env.CHZZK_CLIENT_ID!,
            "Client-Secret": process.env.CHZZK_CLIENT_SECRET!,
          },
        },
      );
      const json = await res.json();
      const category = json.content?.data?.find(
        (c: any) => c.categoryId === cat.categoryId,
      );

      if (!category) {
        failed++;
        return;
      }

      await prisma.category.update({
        where: { categoryId: cat.categoryId },
        data: { posterImageUrl: category.posterImageUrl },
      });
      updated++;
    }),
  );

  return Response.json({ success: true, updated, failed });
}
