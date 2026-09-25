import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export async function POST(req: Request) {
  try {
    const { email, pin } = await req.json();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const rawPin = String(pin || "");
    if (!normalizedEmail || !/^\d{4}$/.test(rawPin)) {
      return NextResponse.json({ error: "Podaj e-mail i 4-cyfrowy PIN" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user?.pinHash) return NextResponse.json({ error: "Dla tego konta nie ustawiono PIN-u" }, { status: 401 });
    if (user.isBanned) return NextResponse.json({ error: "Konto jest zablokowane" }, { status: 403 });

    const now = new Date();
    if (user.pinLockedUntil && user.pinLockedUntil > now) {
      return NextResponse.json({ error: "PIN chwilowo zablokowany. Spróbuj ponownie później." }, { status: 429 });
    }

    const ok = await bcrypt.compare(rawPin, user.pinHash);
    if (!ok) {
      const attempts = (user.pinFailedAttempts || 0) + 1;
      const lock = attempts >= MAX_ATTEMPTS;
      await prisma.user.update({
        where: { id: user.id },
        data: { pinFailedAttempts: lock ? 0 : attempts, pinLockedUntil: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null },
      });
      return NextResponse.json({ error: lock ? `Za dużo prób. PIN zablokowany na ${LOCK_MINUTES} minut.` : "Nieprawidłowy PIN" }, { status: 401 });
    }

    if (!process.env.JWT_SECRET) return NextResponse.json({ error: "Brak konfiguracji JWT_SECRET" }, { status: 500 });
    await prisma.user.update({ where: { id: user.id }, data: { pinFailedAttempts: 0, pinLockedUntil: null } });

    if (user.twoFactorEnabled) {
      const challenge = jwt.sign({ userId: user.id, purpose: "2fa-login" }, process.env.JWT_SECRET, { expiresIn: "5m" });
      const pending = NextResponse.json({ ok: true, requiresTwoFactor: true });
      pending.cookies.set("two_factor_challenge", challenge, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 300 });
      return pending;
    }

    const token = jwt.sign({ userId: user.id, role: user.role, tokenVersion: user.tokenVersion, isPremium: user.isPremium, premiumUntil: user.premiumUntil, isBanned: user.isBanned }, process.env.JWT_SECRET, { expiresIn: "7d" });
    const response = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role, isPremium: user.isPremium } });
    response.cookies.set("token", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
    return response;
  } catch (error) {
    console.error("PIN LOGIN ERROR:", error);
    return NextResponse.json({ error: "Błąd logowania PIN-em" }, { status: 500 });
  }
}
