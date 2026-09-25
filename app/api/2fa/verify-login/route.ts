import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { decryptSecret, verifyTotp } from "@/lib/twoFactor";

type Challenge = { userId: string; purpose: string };

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    const cleanCode = String(code ?? "").replace(/\D/g, "").slice(0, 6);
    if (!/^\d{6}$/.test(cleanCode)) {
      return NextResponse.json({ error: "Wpisz poprawny 6-cyfrowy kod 2FA." }, { status: 400 });
    }
    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: "Brak konfiguracji JWT." }, { status: 500 });
    }

    const rawCookie = req.headers.get("cookie")?.match(/(?:^|; )two_factor_challenge=([^;]+)/)?.[1];
    if (!rawCookie) {
      return NextResponse.json({ error: "Sesja 2FA wygasła. Zaloguj się ponownie." }, { status: 401 });
    }

    const challenge = jwt.verify(decodeURIComponent(rawCookie), process.env.JWT_SECRET) as Challenge;
    if (challenge.purpose !== "2fa-login" || !challenge.userId) {
      return NextResponse.json({ error: "Nieprawidłowa sesja 2FA. Zaloguj się ponownie." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: challenge.userId } });
    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json({ error: "2FA nie jest aktywne dla tego konta." }, { status: 401 });
    }

    let secret: string;
    try { secret = decryptSecret(user.twoFactorSecret); }
    catch { return NextResponse.json({ error: "Nie można odczytać konfiguracji 2FA. Skonfiguruj 2FA ponownie w ustawieniach." }, { status: 401 }); }

    if (!verifyTotp(secret, cleanCode)) {
      return NextResponse.json({ error: "Nieprawidłowy lub wygasły kod 2FA. Sprawdź automatyczną datę i godzinę w telefonie." }, { status: 401 });
    }

    const token = jwt.sign({ userId:user.id, role:user.role, tokenVersion:user.tokenVersion, isPremium:user.isPremium, premiumUntil:user.premiumUntil, isBanned:user.isBanned }, process.env.JWT_SECRET, { expiresIn:"7d" });
    const response = NextResponse.json({ ok:true, user:{ id:user.id, email:user.email, name:user.name, role:user.role, isPremium:user.isPremium } });
    response.cookies.set("token", token, { httpOnly:true, sameSite:"lax", secure:process.env.NODE_ENV === "production", path:"/", maxAge:60*60*24*7 });
    response.cookies.set("two_factor_challenge", "", { httpOnly:true, sameSite:"lax", secure:process.env.NODE_ENV === "production", path:"/", maxAge:0 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("2FA VERIFY LOGIN ERROR:", error);
    return NextResponse.json({ error:"Sesja 2FA wygasła. Zaloguj się ponownie." }, { status:401 });
  }
}
