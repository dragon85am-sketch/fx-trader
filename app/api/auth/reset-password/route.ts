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
        { error: "Brak tokenu resetowania hasÅ‚a." },
        { status: 400 }
      );
    }

    if (!password || !confirmPassword) {
      return NextResponse.json(
        { error: "Wpisz nowe hasÅ‚o i jego potwierdzenie." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "HasÅ‚a nie sÄ… identyczne." },
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
            "HasÅ‚o musi mieÄ‡ minimum 8 znakÃ³w, co najmniej jednÄ… cyfrÄ™ i znak specjalny.",
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
        { error: "Link resetujÄ…cy jest nieprawidÅ‚owy lub wygasÅ‚." },
        { status: 400 }
      );
    }

    if (resetToken.usedAt) {
      return NextResponse.json(
        { error: "Ten link resetujÄ…cy zostaÅ‚ juÅ¼ wykorzystany." },
        { status: 400 }
      );
    }

    if (resetToken.expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Link resetujÄ…cy wygasÅ‚. PoproÅ› o nowy link." },
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

          // UniewaÅ¼nia wszystkie stare sesje JWT.
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

    // Usuwamy pozostaÅ‚e tokeny resetu dla tego uÅ¼ytkownika.
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
      message: "HasÅ‚o zostaÅ‚o zmienione. MoÅ¼esz siÄ™ teraz zalogowaÄ‡.",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);

    return NextResponse.json(
      { error: "Nie udaÅ‚o siÄ™ zmieniÄ‡ hasÅ‚a." },
      { status: 500 }
    );
  }
}

