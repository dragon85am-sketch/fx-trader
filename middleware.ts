import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

type TokenPayload = {
  userId: string;
  role: "admin" | "user";
  tokenVersion: number;
  isBanned?: boolean;
};

const jwtSecretBytes = process.env.JWT_SECRET
  ? new TextEncoder().encode(process.env.JWT_SECRET)
  : null;

function isRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

async function getTokenPayload(req: NextRequest): Promise<TokenPayload | null> {
  const token = req.cookies.get("token")?.value;
  if (!token || !jwtSecretBytes) return null;

  try {
    const { payload } = await jwtVerify(token, jwtSecretBytes);
    if (
      typeof payload.userId !== "string" ||
      !payload.userId ||
      (payload.role !== "admin" && payload.role !== "user") ||
      typeof payload.tokenVersion !== "number" ||
      (payload.isBanned !== undefined && typeof payload.isBanned !== "boolean")
    ) {
      return null;
    }
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const isLoginRoute = isRoute(pathname, "/login");
  const isRegisterRoute = isRoute(pathname, "/register");
  const isPaywallRoute = isRoute(pathname, "/paywall");
  const isPaymentSuccessRoute = isRoute(pathname, "/payment/success");
  const isAdminRoute = isRoute(pathname, "/dashboard/admin");
  const isProtectedRoute =
    isRoute(pathname, "/dashboard") ||
    isRoute(pathname, "/trading-room") ||
    isRoute(pathname, "/education") ||
    isRoute(pathname, "/skaner");

  const user = await getTokenPayload(req);
  let response: NextResponse;

  if (user?.isBanned && !isLoginRoute) {
    response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.set("token", "", { path: "/", maxAge: 0 });
    return response;
  }

  if ((isProtectedRoute || isPaymentSuccessRoute || isPaywallRoute) && !user) {
    response = NextResponse.redirect(new URL("/login", req.url));
  } else if (isAdminRoute && user?.role !== "admin") {
    response = NextResponse.redirect(new URL("/dashboard", req.url));
  } else if ((isLoginRoute || isRegisterRoute) && user) {
    response = NextResponse.redirect(new URL("/dashboard", req.url));
  } else {
    response = NextResponse.next();
  }

  // Referral cookie must never bypass authentication or authorization.
  // Preserve referral tracking for allowed navigation and redirects.
  const ref = searchParams.get("ref")?.trim();
  if (ref && ref.length <= 128) {
    response.cookies.set("fx_ref", ref, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  // Premium entitlements must be verified from the database in protected handlers.
  return response;
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
