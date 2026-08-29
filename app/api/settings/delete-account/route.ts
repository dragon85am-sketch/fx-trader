import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function DELETE(req: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const body = await req.json();

    const password =
      typeof body.password === "string" ? body.password : "";
    const confirmation =
      typeof body.confirmation === "string" ? body.confirmation : "";

    if (!password || !confirmation) {
      return NextResponse.json(
        { error: "HasÅ‚o i potwierdzenie sÄ… wymagane" },
        { status: 400 }
      );
    }

    if (confirmation !== "DELETE") {
      return NextResponse.json(
        { error: 'Aby usunÄ…Ä‡ konto, wpisz dokÅ‚adnie: DELETE' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user.userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Nie znaleziono uÅ¼ytkownika" },
        { status: 404 }
      );
    }

    const passwordOk = await bcrypt.compare(password, user.password);

    if (!passwordOk) {
      return NextResponse.json(
        { error: "NieprawidÅ‚owe hasÅ‚o" },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: auth.user.userId },
    });

    const response = NextResponse.json({
      ok: true,
      message: "Konto zostaÅ‚o usuniÄ™te",
    });

    response.cookies.set("token", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("DELETE /api/settings/delete-account error:", error);
    return NextResponse.json(
      { error: "BÅ‚Ä…d serwera" },
      { status: 500 }
    );
  }
}
