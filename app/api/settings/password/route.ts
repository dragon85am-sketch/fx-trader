import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function PATCH(req: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const body = await req.json();

    const currentPassword =
      typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword =
      typeof body.newPassword === "string" ? body.newPassword : "";
    const confirmPassword =
      typeof body.confirmPassword === "string" ? body.confirmPassword : "";

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "Wszystkie pola sÄ… wymagane" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Nowe hasÅ‚o musi mieÄ‡ co najmniej 6 znakÃ³w" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Nowe hasÅ‚a nie sÄ… takie same" },
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
        { error: "Nie znaleziono uÅ¼ytkownika lub hasÅ‚a" },
        { status: 404 }
      );
    }

    const passwordOk = await bcrypt.compare(currentPassword, user.password);

    if (!passwordOk) {
      return NextResponse.json(
        { error: "Aktualne hasÅ‚o jest nieprawidÅ‚owe" },
        { status: 400 }
      );
    }

    const sameAsOld = await bcrypt.compare(newPassword, user.password);

    if (sameAsOld) {
      return NextResponse.json(
        { error: "Nowe hasÅ‚o musi byÄ‡ inne niÅ¼ obecne" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: auth.user.userId },
      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "HasÅ‚o zostaÅ‚o zmienione",
    });
  } catch (error) {
    console.error("PATCH /api/settings/password error:", error);
    return NextResponse.json(
      { error: "BÅ‚Ä…d serwera" },
      { status: 500 }
    );
  }
}
