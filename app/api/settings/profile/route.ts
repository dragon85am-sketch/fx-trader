import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function PATCH(req: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const body = await req.json();

    const name =
      typeof body.name === "string" ? body.name.trim().slice(0, 50) : undefined;

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase().slice(0, 254)
        : undefined;

    if (email !== undefined) {
      const emailOk = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
      if (!emailOk) {
        return NextResponse.json(
          { error: "Podaj poprawny adres email." },
          { status: 400 }
        );
      }

      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existing && existing.id !== auth.user.userId) {
        return NextResponse.json(
          { error: "Ten adres email jest już używany przez inne konto." },
          { status: 409 }
        );
      }
    }

    const theme =
      body.theme === "dark" || body.theme === "light" || body.theme === "system"
        ? body.theme
        : undefined;

    const language =
      ["pl", "en", "de", "nl", "es"].includes(body.language)
        ? body.language
        : undefined;

    if (name === undefined && email === undefined && theme === undefined && language === undefined) {
      return NextResponse.json(
        { error: "Brak poprawnych danych do aktualizacji" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: auth.user.userId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(theme !== undefined ? { theme } : {}),
        ...(language !== undefined ? { language } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        theme: true,
        language: true,
      },
    });

    return NextResponse.json({
      ok: true,
      user: updatedUser,
      message: "Ustawienia zostały zapisane",
    });
  } catch (error) {
    console.error("PATCH /api/settings/profile error:", error);
    return NextResponse.json(
      { error: "Błąd serwera" },
      { status: 500 }
    );
  }
}
