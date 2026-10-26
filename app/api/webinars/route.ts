import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const webinars = await prisma.webinar.findMany({ orderBy: { startsAt: "asc" }, include: { host: { select: { name: true, email: true } } } });
  return NextResponse.json({ webinars: webinars.map(({host, ...w}) => ({...w, hostName: host.name || host.email.split("@")[0], meetingUrl: (auth.user.role === "admin" || auth.user.role === "educator") ? w.meetingUrl : undefined})) });
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  if (!["admin", "educator"].includes(auth.user.role)) return NextResponse.json({error:"Brak uprawnień"},{status:403});
  const b = await req.json().catch(()=>null);
  const title = String(b?.title ?? "").trim().slice(0,150);
  const description = String(b?.description ?? "").trim().slice(0,2000);
  const startsAt = new Date(b?.startsAt);
  const durationMinutes = Number(b?.durationMinutes);
  const meetingUrl = String(b?.meetingUrl ?? "").trim();
  if (!title || Number.isNaN(startsAt.getTime()) || !Number.isInteger(durationMinutes) || durationMinutes < 15 || durationMinutes > 480) return NextResponse.json({error:"Nieprawidłowe dane"},{status:400});
  if (meetingUrl) { try { const u = new URL(meetingUrl); if (u.protocol !== "https:") throw Error(); } catch { return NextResponse.json({error:"Link musi zaczynać się od https://"},{status:400}); } }
  const webinar = await prisma.webinar.create({data:{title,description,startsAt,durationMinutes,meetingUrl:meetingUrl || null,hostId:auth.user.userId}});
  return NextResponse.json({webinar},{status:201});
}
