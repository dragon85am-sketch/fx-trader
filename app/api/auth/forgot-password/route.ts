import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const email =
      typeof body?.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    if (!email) {
      return NextResponse.json(
        { error: "Podaj adres email." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Nie ujawniamy, czy konto istnieje.
    if (!user) {
      return NextResponse.json({
        success: true,
        message:
          "JeÅ¼eli konto z tym adresem istnieje, wysÅ‚aliÅ›my link do resetowania hasÅ‚a.",
      });
    }

    // UniewaÅ¼niamy wczeÅ›niejsze tokeny tego uÅ¼ytkownika.
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Surowy token trafia tylko do linku w emailu.
    const resetToken = crypto.randomBytes(32).toString("hex");

    // W bazie przechowujemy wyÅ‚Ä…cznie hash.
    const tokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Link waÅ¼ny przez 30 minut.
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const resetUrl =
      `${appUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

    await sendEmail({
      to: user.email,
      subject: "Reset hasÅ‚a â€” FX Trade",
      html: `
        <div style="font-family:Arial,sans-serif;background:#06182d;padding:40px 20px;color:#fff">
          <div style="max-width:600px;margin:0 auto;background:#0b2748;border:1px solid #135b94;border-radius:18px;padding:32px">
            <h1 style="margin:0 0 10px;color:#fff">FX TRADE</h1>

            <p style="color:#39bfff;font-size:13px;letter-spacing:2px;margin-bottom:30px">
              PROFESSIONAL TRADING
            </p>

            <h2 style="color:#fff">Resetowanie hasÅ‚a</h2>

            <p style="color:#b7c8dc;line-height:1.7">
              OtrzymaliÅ›my proÅ›bÄ™ o zmianÄ™ hasÅ‚a do Twojego konta FX Trade.
            </p>

            <p style="color:#b7c8dc;line-height:1.7">
              Kliknij poniÅ¼szy przycisk, aby ustawiÄ‡ nowe hasÅ‚o.
            </p>

            <div style="margin:32px 0">
              <a
                href="${resetUrl}"
                style="display:inline-block;padding:15px 28px;background:#168cf5;color:#fff;text-decoration:none;border-radius:10px;font-weight:bold"
              >
                Ustaw nowe hasÅ‚o
              </a>
            </div>

            <p style="color:#7f9ab8;font-size:13px">
              Link jest waÅ¼ny przez 30 minut.
            </p>

            <p style="color:#7f9ab8;font-size:13px">
              JeÅ›li nie prosiÅ‚eÅ› o zmianÄ™ hasÅ‚a, moÅ¼esz zignorowaÄ‡ tÄ™ wiadomoÅ›Ä‡.
            </p>
          </div>
        </div>
      `,
    });

    console.log(`PASSWORD RESET EMAIL SENT: ${user.email}`);

    return NextResponse.json({
      success: true,
      message:
        "JeÅ¼eli konto z tym adresem istnieje, wysÅ‚aliÅ›my link do resetowania hasÅ‚a.",
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);

    return NextResponse.json(
      { error: "Nie udaÅ‚o siÄ™ rozpoczÄ…Ä‡ resetowania hasÅ‚a." },
      { status: 500 }
    );
  }
}

