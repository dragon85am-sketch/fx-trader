import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

type TokenPayload = {
  userId: string;
  role: "admin" | "user";
  tokenVersion: number;
  isBanned?: boolean;
};

async function getTokenPayload(
  req: NextRequest
): Promise<TokenPayload | null> {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) return null;
    if (!process.env.JWT_SECRET) return null;

    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET
    );

    const { payload } = await jwtVerify(
      token,
      secret
    );

    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  /*
   * ============================================
   * REFERRAL
   * ============================================
   */
  const ref = searchParams.get("ref");

  if (ref && ref.trim()) {
    const response = NextResponse.next();

    response.cookies.set(
      "fx_ref",
      ref.trim(),
      {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
        sameSite: "lax",
        secure:
          process.env.NODE_ENV === "production",
      }
    );

    return response;
  }

  /*
   * ============================================
   * USER FROM JWT
   * ============================================
   */
  const user = await getTokenPayload(req);

  const isLoginRoute =
    pathname.startsWith("/login");

  const isRegisterRoute =
    pathname.startsWith("/register");

  const isPaywallRoute =
    pathname.startsWith("/paywall");

  const isPaymentSuccessRoute =
    pathname.startsWith("/payment/success");

  const isAdminRoute =
    pathname.startsWith("/dashboard/admin");

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/trading-room") ||
    pathname.startsWith("/education") ||
    pathname.startsWith("/skaner");

  /*
   * ============================================
   * BANNED USER
   * ============================================
   *
   * Jeśli użytkownik jest zbanowany,
   * czyścimy token i wysyłamy go do logowania.
   */
  if (
    user?.isBanned &&
    !isLoginRoute
  ) {
    const response = NextResponse.redirect(
      new URL("/login", req.url)
    );

    response.cookies.set("token", "", {
      path: "/",
      maxAge: 0,
    });

    return response;
  }

  /*
   * ============================================
   * NIEZALOGOWANY USER
   * ============================================
   *
   * Chronione strony wymagają zalogowania.
   */
  if (
    isProtectedRoute &&
    !user
  ) {
    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }

  /*
   * ============================================
   * PAYMENT SUCCESS
   * ============================================
   *
   * /payment/success musi być dostępne dla
   * zalogowanego użytkownika nawet wtedy,
   * gdy webhook jeszcze nie ustawił Premium.
   */
  if (
    isPaymentSuccessRoute &&
    !user
  ) {
    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }

  /*
   * ============================================
   * ADMIN
   * ============================================
   */
  if (
    isAdminRoute &&
    user?.role !== "admin"
  ) {
    return NextResponse.redirect(
      new URL("/dashboard", req.url)
    );
  }

  /*
   * ============================================
   * LOGIN / REGISTER
   * ============================================
   *
   * Jeśli użytkownik jest już zalogowany,
   * nie pokazujemy ponownie login/register.
   *
   * UWAGA:
   * nie sprawdzamy tu Premium.
   */
  if (
    (isLoginRoute || isRegisterRoute) &&
    user
  ) {
    return NextResponse.redirect(
      new URL("/dashboard", req.url)
    );
  }

  /*
   * ============================================
   * PAYWALL
   * ============================================
   *
   * Paywall musi być dostępny dla zalogowanego
   * użytkownika bez Premium.
   *
   * Nie sprawdzamy tutaj statusu Premium z JWT,
   * ponieważ JWT może zawierać stare dane.
   */
  if (
    isPaywallRoute &&
    !user
  ) {
    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }

  /*
   * ============================================
   * PREMIUM
   * ============================================
   *
   * CELOWO NIE SPRAWDZAMY tutaj:
   *
   * user.isPremium
   * user.premiumUntil
   *
   * Status Premium zmienia się po webhookach Stripe,
   * a JWT nie aktualizuje się automatycznie.
   *
   * Dostęp Premium powinien być sprawdzany
   * bezpośrednio z bazy przez requirePremiumUser().
   */

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/paywall",
    "/payment/success",
    "/dashboard/:path*",
    "/trading-room/:path*",
    "/education/:path*",
    "/skaner/:path*",
  ],
};
