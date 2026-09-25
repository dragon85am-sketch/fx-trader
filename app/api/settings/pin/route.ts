import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import bcrypt from "bcryptjs";

const validPin = (pin: unknown) => typeof pin === "string" && /^\d{4}$/.test(pin);

export async function PUT(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { pin, password } = await req.json();
  if (!validPin(pin)) return NextResponse.json({ error: "PIN musi mieć dokładnie 4 cyfry." }, { status: 400 });
  if (typeof password !== "string" || !password) return NextResponse.json({ error: "Podaj hasło do konta." }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: auth.user.userId }, select: { password: true } });
  if (!user?.password || !(await bcrypt.compare(password, user.password))) return NextResponse.json({ error: "Nieprawidłowe hasło." }, { status: 401 });
  const pinHash = await bcrypt.hash(pin, 12);
  await prisma.user.update({ where: { id: auth.user.userId }, data: { pinHash, pinFailedAttempts: 0, pinLockedUntil: null } });
  return NextResponse.json({ ok: true, message: "Kod PIN został ustawiony." });
}

export async function DELETE(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { password } = await req.json();
  const user = await prisma.user.findUnique({ where: { id: auth.user.userId }, select: { password: true } });
  if (!user?.password || typeof password !== "string" || !(await bcrypt.compare(password, user.password))) return NextResponse.json({ error: "Nieprawidłowe hasło." }, { status: 401 });
  await prisma.user.update({ where: { id: auth.user.userId }, data: { pinHash: null, pinFailedAttempts: 0, pinLockedUntil: null } });
  return NextResponse.json({ ok: true });
}
