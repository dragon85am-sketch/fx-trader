import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic="force-dynamic"; export const revalidate=0;
export async function GET(req:NextRequest){
  const status=(req.nextUrl.searchParams.get("status")||"").toUpperCase();
  const limit=Math.max(1,Math.min(1000,Number(req.nextUrl.searchParams.get("limit")||300)));
  const where=status==="ACTIVE"?{status:"ACTIVE"}:status==="CLOSED"?{status:{not:"ACTIVE"}}:{};
  const trades=await prisma.fxScannerTrade.findMany({where,orderBy:[{openedAt:"desc"}],take:limit});
  return NextResponse.json({ok:true,trades},{headers:{"Cache-Control":"no-store"}});
}
