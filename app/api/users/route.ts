import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

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
    take: 250,
  });

  return Response.json(users);
}

// User registration belongs to /api/register where passwords are validated
// and hashed. Keeping a second public creation endpoint would allow bypassing
// those protections.
export async function POST() {
  return Response.json(
    { error: "Use /api/register" },
    { status: 410 }
  );
}
