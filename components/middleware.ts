import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// =====================================================
// PUBLICZNE STRONY
// =====================================================

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

// =====================================================
// STRONY PREMIUM
// =====================================================
// Te strony oraz wszystkie ich podstrony
// wymagają aktywnego Premium.
// =====================================================

const PREMIUM_PATHS = [
  "/dashboard",
  "/education",
  "/journal",
  "/kurs",
  "/sesje",
  "/skaner",
  "/strategie",
  "/trading-room",
];

// =====================================================
// STRONY KONTA DOSTĘPNE BEZ PREMIUM
// =====================================================
// Użytkownik musi być zalogowany,
// ale Premium nie jest wymagane.
// =====================================================

const ACCOUNT_PATHS = [
  "/settings",
  "/paywall",
  "/payment",
  "/checkout",
  "/onboarding",
  "/ref",
  "/success",
];

// =====================================================
// REFERRAL
// =====================================================

const REF_COOKIE_NAME = "fx_ref";

const REF_COOKIE_MAX_AGE =
  60 * 60 * 24 * 30; // 30 dni

// =====================================================
// PATH MATCH
// =====================================================

function matchesPath(
  pathname: string,
  paths: string[]
) {
  return paths.some(
    (path) =>
      pathname === path ||
      pathname.startsWith(`${path}/`)
  );
}

// =====================================================
// REFERRAL COOKIE
// =====================================================

function saveReferralCookie(
  response: NextResponse,
  ref: string | null
) {
  if (!ref) {
    return response;
  }

  response.cookies.set(
    REF_COOKIE_NAME,
    ref,
    {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure:
        process.env.NODE_ENV ===
        "production",
      maxAge: REF_COOKIE_MAX_AGE,
    }
  );

  return response;
}

// =====================================================
// VERIFY JWT
// =====================================================

async function verifyToken(
  token: string
) {
  const jwtSecret =
    process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error(
      "JWT_SECRET missing"
    );
  }

  const secret =
    new TextEncoder().encode(
      jwtSecret
    );

  return jwtVerify(
    token,
    secret
  );
}

// =====================================================
// MIDDLEWARE
// =====================================================

export async function middleware(
  req: NextRequest
) {
  const {
    pathname,
    searchParams,
  } = req.nextUrl;

  console.log(
    "🔥 MIDDLEWARE:",
    pathname
  );

  // ===================================================
  // API / NEXT / ASSETS
  // ===================================================

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // ===================================================
  // REFERRAL
  // ===================================================

  const ref =
    searchParams.get("ref");

  const cleanRef =
    typeof ref === "string" &&
    ref.trim().length > 0
      ? ref.trim()
      : null;

  // ===================================================
  // PATH TYPES
  // ===================================================

  const isPublic =
    matchesPath(
      pathname,
      PUBLIC_PATHS
    );

  const isPremiumPath =
    matchesPath(
      pathname,
      PREMIUM_PATHS
    );

  const isAccountPath =
    matchesPath(
      pathname,
      ACCOUNT_PATHS
    );

  console.log(
    "🔒 ROUTE CHECK:",
    {
      pathname,
      isPublic,
      isPremiumPath,
      isAccountPath,
    }
  );

  // ===================================================
  // TOKEN
  // ===================================================

  const token =
    req.cookies.get(
      "token"
    )?.value;

  // ===================================================
  // BRAK TOKENU
  // ===================================================

  if (!token) {
    // Publiczne strony
    if (isPublic) {
      return saveReferralCookie(
        NextResponse.next(),
        cleanRef
      );
    }

    // Pozostałe wymagają logowania
    const loginUrl =
      new URL(
        "/login",
        req.url
      );

    return saveReferralCookie(
      NextResponse.redirect(
        loginUrl
      ),
      cleanRef
    );
  }

  // ===================================================
  // VERIFY JWT
  // ===================================================

  try {
    await verifyToken(token);
  } catch (error) {
    console.error(
      "❌ MIDDLEWARE JWT ERROR:",
      error
    );

    const response =
      NextResponse.redirect(
        new URL(
          "/login",
          req.url
        )
      );

    response.cookies.set(
      "token",
      "",
      {
        path: "/",
        maxAge: 0,
      }
    );

    return saveReferralCookie(
      response,
      cleanRef
    );
  }

  // ===================================================
  // ZALOGOWANY USER NA LOGIN / REGISTER
  // ===================================================

  if (isPublic) {
    return saveReferralCookie(
      NextResponse.redirect(
        new URL(
          "/dashboard",
          req.url
        )
      ),
      cleanRef
    );
  }

  // ===================================================
  // PREMIUM CHECK
  // ===================================================

  if (isPremiumPath) {
    console.log(
      "🔐 CHECK PREMIUM:",
      pathname
    );

    try {
      const accessUrl =
        new URL(
          "/api/account/access",
          req.url
        );

      const accessResponse =
        await fetch(
          accessUrl,
          {
            method: "GET",

            headers: {
              cookie:
                req.headers.get(
                  "cookie"
                ) ?? "",
            },

            cache: "no-store",
          }
        );

      console.log(
        "🔐 ACCESS STATUS:",
        accessResponse.status
      );

      // ===============================================
      // BRAK SESJI
      // ===============================================

      if (
        accessResponse.status === 401
      ) {
        const response =
          NextResponse.redirect(
            new URL(
              "/login",
              req.url
            )
          );

        response.cookies.set(
          "token",
          "",
          {
            path: "/",
            maxAge: 0,
          }
        );

        return response;
      }

      // ===============================================
      // BŁĄD API
      // ===============================================

      if (!accessResponse.ok) {
        console.error(
          "❌ PREMIUM ACCESS API ERROR:",
          accessResponse.status
        );

        const paywallUrl =
          new URL(
            "/paywall",
            req.url
          );

        paywallUrl.searchParams.set(
          "premium",
          "expired"
        );

        return NextResponse.redirect(
          paywallUrl
        );
      }

      const access =
        await accessResponse.json();

      console.log(
        "🔐 PREMIUM ACCESS:",
        access
      );

      // ===============================================
      // BRAK PREMIUM
      // ===============================================

      if (
        access?.isPremium !== true
      ) {
        console.log(
          "⛔ PREMIUM BLOCK:",
          pathname
        );

        const paywallUrl =
          new URL(
            "/paywall",
            req.url
          );

        paywallUrl.searchParams.set(
          "premium",
          "expired"
        );

        return NextResponse.redirect(
          paywallUrl
        );
      }

      // ===============================================
      // PREMIUM OK
      // ===============================================

      console.log(
        "✅ PREMIUM ACCESS OK:",
        pathname
      );

      return saveReferralCookie(
        NextResponse.next(),
        cleanRef
      );
    } catch (error) {
      console.error(
        "❌ PREMIUM MIDDLEWARE ERROR:",
        error
      );

      const paywallUrl =
        new URL(
          "/paywall",
          req.url
        );

      paywallUrl.searchParams.set(
        "premium",
        "expired"
      );

      return NextResponse.redirect(
        paywallUrl
      );
    }
  }

  // ===================================================
  // SETTINGS / PAYWALL / ACCOUNT
  // ===================================================

  if (isAccountPath) {
    return saveReferralCookie(
      NextResponse.next(),
      cleanRef
    );
  }

  // ===================================================
  // POZOSTAŁE STRONY
  // ===================================================

  return saveReferralCookie(
    NextResponse.next(),
    cleanRef
  );
}

// =====================================================
// MATCHER
// =====================================================

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};