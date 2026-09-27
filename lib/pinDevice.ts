import jwt from "jsonwebtoken";

export const PIN_DEVICE_COOKIE = "fx_pin_device";
export const PIN_DEVICE_MAX_AGE = 60 * 60 * 24 * 180;

type PinDevicePayload = { userId: string; purpose: "pin-device" };

export function createPinDeviceToken(userId: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Brak konfiguracji JWT_SECRET");
  return jwt.sign({ userId, purpose: "pin-device" } satisfies PinDevicePayload, secret, {
    expiresIn: PIN_DEVICE_MAX_AGE,
    algorithm: "HS256",
  });
}

export function readPinDeviceToken(token: string | undefined | null): PinDevicePayload | null {
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] }) as PinDevicePayload;
    return payload?.purpose === "pin-device" && payload.userId ? payload : null;
  } catch {
    return null;
  }
}

export const pinDeviceCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: PIN_DEVICE_MAX_AGE,
};
