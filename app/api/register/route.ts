import { prisma } from "../../../lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const REF_COOKIE_NAME = "fx_ref";
const AUTH_COOKIE_NAME = "token";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email =
      typeof body?.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const name =
      typeof body?.name === "string"
        ? body.name.trim()
        : "";

    const password =
      typeof body?.password === "string"
        ? body.password
        : "";

    if (!email || !password) {
      return Response.json(
        { error: "Email i hasÅ‚o sÄ… wymagane" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        { error: "HasÅ‚o musi mieÄ‡ minimum 8 znakÃ³w" },
        { status: 400 }
      );
    }

    if (!process.env.JWT_SECRET) {
      console.error("Brak JWT_SECRET");

      return Response.json(
        { error: "BÅ‚Ä…d konfiguracji serwera" },
        { status: 500 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      return Response.json(
        { error: "UÅ¼ytkownik juÅ¼ istnieje" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const cookieStore = await cookies();

    const referralCode =
      cookieStore.get(REF_COOKIE_NAME)?.value?.trim();

    let referredByUserId: string | undefined;

    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: {
          id: referralCode,
        },
        select: {
          id: true,
        },
      });

      if (referrer) {
        referredByUserId = referrer.id;
      }
    }

    /*
     * Nowy uÅ¼ytkownik powstaje bez Premium.
     * DostÄ™p zostanie aktywowany dopiero przez Stripe webhook.
     */
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        password: hashedPassword,
        referredByUserId,

        isPremium: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tokenVersion: true,
        isPremium: true,
        createdAt: true,
        referredByUserId: true,
      },
    });

    /*
     * Automatyczne logowanie po rejestracji.
     * DziÄ™ki temu /api/stripe/checkout moÅ¼e od razu uÅ¼yÄ‡ requireAuth().
     */
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        tokenVersion: user.tokenVersion,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );

    cookieStore.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    /*
     * Referral cookie nie jest juÅ¼ potrzebne po utworzeniu konta.
     */
    cookieStore.delete(REF_COOKIE_NAME);

    return Response.json(
      {
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isPremium: user.isPremium,
          createdAt: user.createdAt,
          referredByUserId: user.referredByUserId,
        },

        /*
         * RegisterPage moÅ¼e po sukcesie przejÅ›Ä‡ bezpoÅ›rednio tutaj.
         */
        redirectTo: "/checkout",
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return Response.json(
      {
        error: "BÅ‚Ä…d serwera",
      },
      {
        status: 500,
      }
    );
  }
}

