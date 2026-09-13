import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isPremium: true,
        isBanned: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return Response.json(users);
  } catch (error) {
    console.error("DEBUG USERS ERROR:", error);
    return Response.json({ error: "DB ERROR" }, { status: 500 });
  }
}
