import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: Context) {
  try {
    const auth = await requireAdmin();

    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await params;
    const body = await req.json();

    const isBanned = Boolean(body?.isBanned);

    const user = await prisma.user.update({
      where: { id },
      data: {
        isBanned,
        bannedAt: isBanned ? new Date() : null,
        tokenVersion: {
          increment: 1,
        },
      },
      select: {
        id: true,
        email: true,
        isBanned: true,
        bannedAt: true,
        tokenVersion: true,
      },
    });

    return NextResponse.json({
      ok: true,
      user,
    });
  } catch (error) {
    console.error("PATCH admin user ban error:", error);

    return NextResponse.json(
      { error: "Nie udało się zmienić bana" },
      { status: 500 }
    );
  }
}