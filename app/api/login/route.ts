import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body?.email;
    const password = body?.password;

    console.log("LOGIN EMAIL:", email);

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email i hasÅ‚o sÄ… wymagane" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
  where: { email },

  select: {
    id: true,
    email: true,
    name: true,
    role: true,
    password: true,
    tokenVersion: true,
    isPremium: true,
    premiumUntil: true,
    isBanned: true,
  },
});

    console.log("USER FOUND:", !!user);
    console.log("HAS PASSWORD:", !!user?.password);

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "NieprawidÅ‚owy email lub hasÅ‚o" },
        { status: 401 }
      );
    }

    const ok = await bcrypt.compare(password, user.password);
    console.log("BCRYPT OK:", ok);
    console.log("LOGIN PREMIUM:", user.isPremium);

    if (!ok) {
      return NextResponse.json(
        { error: "NieprawidÅ‚owy email lub hasÅ‚o" },
        { status: 401 }
      );
    }

    if (!process.env.JWT_SECRET) {
      console.error("Brak JWT_SECRET");
      return NextResponse.json(
        { error: "Brak konfiguracji JWT_SECRET" },
        { status: 500 }
      );
    }

    const token = jwt.sign(
     {
  userId: user.id,
  role: user.role,
  tokenVersion: user.tokenVersion,
  isPremium: user.isPremium,
  premiumUntil: user.premiumUntil,
  isBanned: user.isBanned,
},
process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json({
      ok: true,
      user: {
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  isPremium: user.isPremium,
},
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      {
        error: "Server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
