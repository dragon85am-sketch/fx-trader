import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password, pin } = await req.json();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const rawPin = String(pin || "");

    if (!normalizedEmail || !password || !/^\d{4}$/.test(rawPin)) {
      return NextResponse.json({ error: "Podaj e-mail, hasło i 4-cyfrowy PIN" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user?.password || !(await bcrypt.compare(String(password), user.password))) {
      return NextResponse.json({ error: "Nieprawidłowy e-mail lub hasło" }, { status: 401 });
    }
    if (user.isBanned) return NextResponse.json({ error: "Konto jest zablokowane" }, { status: 403 });

    const pinHash = await bcrypt.hash(rawPin, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { pinHash, pinFailedAttempts: 0, pinLockedUntil: null },
    });

    return NextResponse.json({ ok: true, message: "Kod PIN został utworzony" });
  } catch (error) {
    console.error("CREATE PIN ERROR:", error);
    return NextResponse.json({ error: "Nie udało się utworzyć PIN-u" }, { status: 500 });
  }
}
