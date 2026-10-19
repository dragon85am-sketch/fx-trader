import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Nieprawidłowe dane logowania" }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Nieprawidłowe dane logowania" }, { status: 400 });
    }

    const data = body as Record<string, unknown>;
    const email = data.email;
    const password = data.password;
    if (typeof email !== "string" || typeof password !== "string" ||
        !email.trim() || !password || email.length > 320) {
      return NextResponse.json({ error: "Podaj email i hasło" }, { status: 400 });
    }

    // Retry a read-only lookup once after a transient pool timeout.
    // Do not retry invalid credentials or arbitrary database failures.
    let user: Awaited<ReturnType<typeof prisma.user.findUnique>>;
    try {
      user = await prisma.user.findUnique({ where: { email } });
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
      const message = error instanceof Error ? error.message : "";
      const transient = code === "P2024" || /Timed out fetching a new connection|connection pool timeout/i.test(message);
      if (!transient) throw error;
      await new Promise<void>((resolve) => setTimeout(resolve, 250 + Math.floor(Math.random() * 250)));
      user = await prisma.user.findUnique({ where: { email } });
    }
    if (!user?.password || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: "Nieprawidłowy email lub hasło" }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("Login configuration error: JWT_SECRET missing");
      return NextResponse.json({ error: "Logowanie chwilowo niedostępne" }, { status: 503 });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: "7d" }
    );

    const res = NextResponse.json({ ok: true });
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      // Preserves the existing session-cookie lifetime (browser session).
    });
    return res;
  } catch (error) {
    console.error("Login error:", error);
    const message = error instanceof Error ? error.message : "";
    if (/CHECKOUT_TIMEOUT|Timed out fetching a new connection|connection pool|P1001|P1002|P2024/i.test(message)) {
      return NextResponse.json(
        { error: "Baza danych jest chwilowo przeciążona. Spróbuj ponownie za chwilę." },
        { status: 503, headers: { "Retry-After": "15" } }
      );
    }
    return NextResponse.json({ error: "Błąd logowania" }, { status: 500 });
  }
}
