import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany();

    return Response.json(users);
  } catch (error) {
    console.error("DEBUG ERROR:", error);

    return Response.json(
      {
        error: "DB ERROR",
        details:
          error instanceof Error ? error.message : "unknown error",
      },
      { status: 500 }
    );
  }
}
