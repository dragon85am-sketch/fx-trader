import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { decryptSecret, verifyTotp } from "@/lib/twoFactor";

type Challenge = { userId: string; purpose: string; iat?: number; exp?: number };

export const dynamic = "force-dynamic";

function jsonError(error: string, status = 401, reason?: string) {
  return NextResponse.json(
    { error, ...(process.env.NODE_ENV !== "production" && reason ? { reason } : {}) },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req: Request) {
  let body: { code?: unknown; challengeToken?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonError("Nieprawidłowe żądanie 2FA.", 400);
  }

  const cleanCode = String(body.code ?? "").replace(/\D/g, "").slice(0, 6);
  if (!/^\d{6}$/.test(cleanCode)) {
    return jsonError("Wpisz poprawny 6-cyfrowy kod 2FA.", 400);
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return jsonError("Brak konfiguracji JWT_SECRET.", 500);

  // Token returned in JSON is the primary source. Cookie is only a fallback.
  const rawCookie = req.headers.get("cookie")?.match(/(?:^|; )two_factor_challenge=([^;]+)/)?.[1];
  const explicit = typeof body.challengeToken === "string" ? body.challengeToken.trim() : "";
  const rawChallenge = explicit || (rawCookie ? decodeURIComponent(rawCookie) : "");
  if (!rawChallenge) return jsonError("Sesja 2FA wygasła. Zaloguj się ponownie.", 401, "missing_challenge");

  let challenge: Challenge;
  try {
    challenge = jwt.verify(rawChallenge, jwtSecret, { algorithms: ["HS256"] }) as Challenge;
  } catch (error) {
    console.error("2FA CHALLENGE VERIFY ERROR:", error);
    if (error instanceof TokenExpiredError) return jsonError("Sesja 2FA wygasła. Zaloguj się ponownie.", 401, "challenge_expired");
    if (error instanceof JsonWebTokenError) return jsonError("Nieprawidłowa sesja 2FA. Zaloguj się ponownie.", 401, "challenge_invalid");
    return jsonError("Nie udało się zweryfikować sesji 2FA.", 500, "challenge_verify_error");
  }

  if (challenge.purpose !== "2fa-login" || !challenge.userId) {
    return jsonError("Nieprawidłowa sesja 2FA. Zaloguj się ponownie.", 401, "challenge_payload_invalid");
  }

  let user;
  try {
    // Explicit select prevents unrelated/new profile columns from breaking login
    // when a production DB migration is temporarily behind the application schema.
    user = await prisma.user.findUnique({
      where: { id: challenge.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tokenVersion: true,
        isPremium: true,
        premiumUntil: true,
        isBanned: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    });
  } catch (error) {
    console.error("2FA USER LOOKUP ERROR:", error);
    return jsonError("Błąd odczytu konta podczas weryfikacji 2FA.", 500, "user_lookup_failed");
  }

  if (!user) return jsonError("Nie znaleziono konta dla tej sesji 2FA.", 401, "user_not_found");
  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    return jsonError("2FA nie jest aktywne dla tego konta.", 401, "two_factor_not_configured");
  }

  let secret: string;
  try {
    secret = decryptSecret(user.twoFactorSecret);
  } catch (error) {
    console.error("2FA SECRET DECRYPT ERROR:", error);
    return jsonError("Nie można odczytać konfiguracji 2FA. Skonfiguruj 2FA ponownie w ustawieniach.", 401, "secret_decrypt_failed");
  }

  if (!verifyTotp(secret, cleanCode)) {
    return jsonError("Nieprawidłowy lub wygasły kod 2FA. Sprawdź automatyczną datę i godzinę w telefonie.", 401, "totp_invalid");
  }

  try {
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        tokenVersion: user.tokenVersion,
        isPremium: user.isPremium,
        premiumUntil: user.premiumUntil,
        isBanned: user.isBanned,
      },
      jwtSecret,
      { expiresIn: "7d", algorithm: "HS256" }
    );

    const response = NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, isPremium: user.isPremium },
    });
    response.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    response.cookies.set("two_factor_challenge", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("2FA SESSION CREATE ERROR:", error);
    return jsonError("Kod 2FA jest poprawny, ale nie udało się utworzyć sesji logowania.", 500, "session_create_failed");
  }
}
