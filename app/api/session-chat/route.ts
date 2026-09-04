import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePremiumUser } from "@/lib/auth";

export async function GET() {
  const auth = await requirePremiumUser();
  if (!auth.ok) return auth.response;

  const messages = await prisma.sessionMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      author: true,
      text: true,
      createdAt: true,
      user: { select: { role: true } },
    },
  });

  return NextResponse.json({
    messages: messages.reverse().map((message) => ({
      id: message.id,
      author: message.author,
      text: message.text,
      createdAt: message.createdAt,
      isHost: message.user.role === "admin",
    })),
  });
}

export async function POST(req: Request) {
  const auth = await requirePremiumUser();
  if (!auth.ok) return auth.response;

  const user = await prisma.user.findUnique({
    where: { id: auth.user.userId },
    select: { name: true, email: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Nie znaleziono użytkownika" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const text = String(body?.text ?? "").trim().slice(0, 500);

  if (!text) {
    return NextResponse.json({ error: "Pusta wiadomość" }, { status: 400 });
  }

  const message = await prisma.sessionMessage.create({
    data: {
      userId: auth.user.userId,
      author: user.name?.trim() || user.email?.split("@")[0] || "Użytkownik",
      text,
    },
  });

  return NextResponse.json({ message });
}
