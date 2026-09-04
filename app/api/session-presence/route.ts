import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePremiumUser } from "@/lib/auth";

const ONLINE_WINDOW_MS = 75_000;

export async function GET() {
  const auth = await requirePremiumUser();
  if (!auth.ok) return auth.response;

  const cutoff = new Date(Date.now() - ONLINE_WINDOW_MS);

  await prisma.sessionPresence.deleteMany({
    where: { lastSeen: { lt: cutoff } },
  });

  const rows = await prisma.sessionPresence.findMany({
    where: { lastSeen: { gte: cutoff } },
    orderBy: { lastSeen: "desc" },
    select: {
      userId: true,
      lastSeen: true,
      joinedAt: true,
      user: {
        select: { name: true, email: true, role: true },
      },
    },
  });

  return NextResponse.json({
    users: rows
      .map((row) => ({
        id: row.userId,
        name: row.user.name?.trim() || row.user.email?.split("@")[0] || "Użytkownik",
        role: row.user.role,
        isHost: row.user.role === "admin",
        lastSeen: row.lastSeen,
        joinedAt: row.joinedAt,
      }))
      .sort((a, b) => Number(b.isHost) - Number(a.isHost)),
  });
}

export async function POST() {
  const auth = await requirePremiumUser();
  if (!auth.ok) return auth.response;

  await prisma.sessionPresence.upsert({
    where: { userId: auth.user.userId },
    update: { lastSeen: new Date() },
    create: { userId: auth.user.userId, lastSeen: new Date() },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const auth = await requirePremiumUser();
  if (!auth.ok) return auth.response;

  await prisma.sessionPresence.deleteMany({
    where: { userId: auth.user.userId },
  });

  return NextResponse.json({ ok: true });
}
