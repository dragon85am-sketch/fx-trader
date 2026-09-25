import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { email, pin } = await req.json();
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!normalizedEmail || typeof pin !== "string" || !/^\d{4}$/.test(pin)) return NextResponse.json({ error: "Podaj e-mail i 4-cyfrowy PIN." }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id:true,email:true,name:true,role:true,pinHash:true,pinFailedAttempts:true,pinLockedUntil:true,tokenVersion:true,isPremium:true,premiumUntil:true,isBanned:true } });
    if (!user?.pinHash) return NextResponse.json({ error: "PIN nie jest ustawiony dla tego konta." }, { status: 401 });
    if (user.pinLockedUntil && user.pinLockedUntil > new Date()) return NextResponse.json({ error: "Logowanie PIN jest chwilowo zablokowane. Spróbuj później lub użyj hasła." }, { status: 429 });
    const ok = await bcrypt.compare(pin, user.pinHash);
    if (!ok) {
      const attempts = user.pinFailedAttempts + 1;
      const lock = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await prisma.user.update({ where:{id:user.id}, data:{ pinFailedAttempts: lock ? 0 : attempts, pinLockedUntil: lock } });
      return NextResponse.json({ error: lock ? "Za dużo prób. PIN zablokowany na 15 minut." : "Nieprawidłowy PIN." }, { status: 401 });
    }
    if (!process.env.JWT_SECRET) return NextResponse.json({ error: "Brak konfiguracji JWT_SECRET" }, { status: 500 });
    await prisma.user.update({ where:{id:user.id}, data:{pinFailedAttempts:0,pinLockedUntil:null} });
    const token = jwt.sign({ userId:user.id, role:user.role, tokenVersion:user.tokenVersion, isPremium:user.isPremium, premiumUntil:user.premiumUntil, isBanned:user.isBanned }, process.env.JWT_SECRET, { expiresIn:"7d" });
    const response = NextResponse.json({ ok:true, user:{id:user.id,email:user.email,name:user.name,role:user.role,isPremium:user.isPremium} });
    response.cookies.set("token", token, { httpOnly:true, sameSite:"lax", secure:process.env.NODE_ENV==="production", path:"/", maxAge:60*60*24*7 });
    return response;
  } catch (error) { console.error("PIN LOGIN ERROR:", error); return NextResponse.json({ error:"Błąd logowania PIN" }, { status:500 }); }
}
