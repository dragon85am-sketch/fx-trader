import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const REF_COOKIE_NAME = "fx_ref";

type RouteContext = {
  params: Promise<{
    code: string;
  }>;
};

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { code } = await params;

  const refCode = code?.trim();

  if (!refCode) {
    return NextResponse.redirect(new URL("/register", req.url));
  }

  const referrer = await prisma.user.findUnique({
    where: {
      id: refCode,
    },
    select: {
      id: true,
    },
  });

  const response = NextResponse.redirect(new URL("/register", req.url));

  if (!referrer) {
    return response;
  }
await prisma.dashboardStat.upsert({
  where: {
    userId: referrer.id,
  },
  update: {
    clicks: {
      increment: 1,
    },
  },
  create: {
    userId: referrer.id,
    clicks: 1,
    sales: 0,
    conversion: 0,
    monthlyPnl: 0,
    totalRevenue: 0,
  },
});


  response.cookies.set(REF_COOKIE_NAME, referrer.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}