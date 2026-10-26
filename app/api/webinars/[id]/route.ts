import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
type Ctx = { params: Promise<{id:string}> };
async function authorize(id:string) {
  const auth = await requireAuth();
  if (!auth.ok) return {response:auth.response};
  if (!["admin","educator"].includes(auth.user.role)) return {response:NextResponse.json({error:"Brak uprawnień"},{status:403})};
  const webinar = await prisma.webinar.findUnique({where:{id}});
  if (!webinar) return {response:NextResponse.json({error:"Nie znaleziono"},{status:404})};
  if (auth.user.role !== "admin" && webinar.hostId !== auth.user.userId) return {response:NextResponse.json({error:"To nie jest Twoja sesja"},{status:403})};
  return {webinar};
}
export async function PATCH(req:Request,{params}:Ctx) {
  const {id}=await params; const a=await authorize(id); if (a.response) return a.response;
  const b=await req.json().catch(()=>null); const data: {title?:string;description?:string;startsAt?:Date;durationMinutes?:number;meetingUrl?:string|null;status?:string}={};
  if (b?.title!==undefined) {data.title=String(b.title).trim().slice(0,150);if(!data.title)return NextResponse.json({error:"Tytuł jest wymagany"},{status:400});}
  if (b?.description!==undefined)data.description=String(b.description).trim().slice(0,2000);
  if (b?.startsAt!==undefined){data.startsAt=new Date(b.startsAt);if(Number.isNaN(data.startsAt.getTime()))return NextResponse.json({error:"Nieprawidłowa data"},{status:400});}
  if (b?.durationMinutes!==undefined){data.durationMinutes=Number(b.durationMinutes);if(!Number.isInteger(data.durationMinutes)||data.durationMinutes<15||data.durationMinutes>480)return NextResponse.json({error:"Nieprawidłowy czas"},{status:400});}
  if (b?.meetingUrl!==undefined){const u=String(b.meetingUrl).trim();if(u){try{if(new URL(u).protocol!=="https:")throw Error();}catch{return NextResponse.json({error:"Nieprawidłowy link"},{status:400});}}data.meetingUrl=u||null;}
  if (b?.status!==undefined){if(!["scheduled","live","ended"].includes(b.status))return NextResponse.json({error:"Nieprawidłowy status"},{status:400});data.status=b.status;}
  return NextResponse.json({webinar:await prisma.webinar.update({where:{id},data})});
}
export async function DELETE(_req:Request,{params}:Ctx){const {id}=await params;const a=await authorize(id);if(a.response)return a.response;await prisma.webinar.delete({where:{id}});return NextResponse.json({ok:true});}
