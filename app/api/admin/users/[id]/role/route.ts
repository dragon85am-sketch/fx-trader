import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: Context) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const body = await req.json();

    const role = body?.role;

    if (role !== "admin" && role !== "user") {
      return NextResponse.json({ error: "Nieprawidłowa rola" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    console.error("PATCH admin user role error:", error);

    return NextResponse.json(
      { error: "Nie udało się zmienić roli" },
      { status: 500 }
    );
  }
}