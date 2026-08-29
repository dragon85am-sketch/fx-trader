import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const token =
      typeof body?.token === "string"
        ? body.token.trim()
        : "";

    const password =
      typeof body?.password === "string"
        ? body.password
        : "";

    const confirmPassword =
      typeof body?.confirmPassword === "string"
        ? body.confirmPassword
        : "";

    if (!token) {
      return NextResponse.json(
        { error: "Brak tokenu resetowania hasła." },
        { status: 400 }
      );
    }

    if (!password || !confirmPassword) {
      return NextResponse.json(
        { error: "Wpisz nowe hasło i jego potwierdzenie." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Hasła nie są identyczne." },
        { status: 400 }
      );
    }

    const passwordValid =
      password.length >= 8 &&
      /\d/.test(password) &&
      /[^A-Za-z0-9]/.test(password);

    if (!passwordValid) {
      return NextResponse.json(
        {
          error:
            "Hasło musi mieć minimum 8 znaków, co najmniej jedną cyfrę i znak specjalny.",
        },
        { status: 400 }
      );
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: {
        tokenHash,
      },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "Link resetujący jest nieprawidłowy lub wygasł." },
        { status: 400 }
      );
    }

    if (resetToken.usedAt) {
      return NextResponse.json(
        { error: "Ten link resetujący został już wykorzystany." },
        { status: 400 }
      );
    }

    if (resetToken.expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Link resetujący wygasł. Poproś o nowy link." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: resetToken.userId,
        },
        data: {
          password: passwordHash,

          // Unieważnia wszystkie stare sesje JWT.
          tokenVersion: {
            increment: 1,
          },
        },
      }),

      prisma.passwordResetToken.update({
        where: {
          id: resetToken.id,
        },
        data: {
          usedAt: new Date(),
        },
      }),
    ]);

    // Usuwamy pozostałe tokeny resetu dla tego użytkownika.
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: resetToken.userId,
        id: {
          not: resetToken.id,
        },
      },
    });

    console.log("PASSWORD RESET COMPLETED:", resetToken.userId);

    return NextResponse.json({
      success: true,
      message: "Hasło zostało zmienione. Możesz się teraz zalogować.",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);

    return NextResponse.json(
      { error: "Nie udało się zmienić hasła." },
      { status: 500 }
    );
  }
}
