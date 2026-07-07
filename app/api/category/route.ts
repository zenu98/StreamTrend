import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  if (!query.trim()) return Response.json({ results: [] });

  const rows = await prisma.category.findMany({
    where: { categoryValue: { contains: query, mode: "insensitive" } },
    select: { categoryId: true, categoryValue: true },
    take: 20,
  });

  return Response.json({
    results: rows.map((r) => ({
      game: r.categoryValue,
      categoryId: r.categoryId,
    })),
  });
}
