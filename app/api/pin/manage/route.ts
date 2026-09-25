import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { action, password, currentPin, newPin } = await req.json();
    const user = await prisma.user.findUnique({ where: { id: auth.user.userId } });
    if (!user) return NextResponse.json({ error: "Nie znaleziono użytkownika" }, { status: 404 });

    if (action === "set") {
      if (!user.password || !(await bcrypt.compare(String(password || ""), user.password)))
        return NextResponse.json({ error: "Nieprawidłowe hasło" }, { status: 401 });
      if (!/^\d{4}$/.test(String(newPin || "")))
        return NextResponse.json({ error: "PIN musi mieć dokładnie 4 cyfry" }, { status: 400 });
      const pinHash = await bcrypt.hash(String(newPin), 12);
      await prisma.user.update({ where: { id: user.id }, data: { pinHash, pinFailedAttempts: 0, pinLockedUntil: null } });
      return NextResponse.json({ ok: true, message: "Kod PIN został ustawiony" });
    }

    if (action === "change") {
      if (!user.pinHash) return NextResponse.json({ error: "PIN nie jest ustawiony" }, { status: 400 });
      if (!(await bcrypt.compare(String(currentPin || ""), user.pinHash)))
        return NextResponse.json({ error: "Aktualny PIN jest nieprawidłowy" }, { status: 401 });
      if (!/^\d{4}$/.test(String(newPin || "")))
        return NextResponse.json({ error: "Nowy PIN musi mieć dokładnie 4 cyfry" }, { status: 400 });
      const pinHash = await bcrypt.hash(String(newPin), 12);
      await prisma.user.update({ where: { id: user.id }, data: { pinHash, pinFailedAttempts: 0, pinLockedUntil: null } });
      return NextResponse.json({ ok: true, message: "Kod PIN został zmieniony" });
    }

    if (action === "remove") {
      if (!user.password || !(await bcrypt.compare(String(password || ""), user.password)))
        return NextResponse.json({ error: "Nieprawidłowe hasło" }, { status: 401 });
      await prisma.user.update({ where: { id: user.id }, data: { pinHash: null, pinFailedAttempts: 0, pinLockedUntil: null } });
      return NextResponse.json({ ok: true, message: "Kod PIN został usunięty" });
    }
    return NextResponse.json({ error: "Nieprawidłowa operacja" }, { status: 400 });
  } catch (error) {
    console.error("PIN MANAGE ERROR:", error);
    return NextResponse.json({ error: "Nie udało się zmienić ustawień PIN" }, { status: 500 });
  }
}
