import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";

export type TokenPayload = {
  userId: string;
  email?: string;
  role: "admin" | "user";
  isPremium?: boolean;
};

export async function getServerUser(): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token || !process.env.JWT_SECRET) return null;

    return jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function requireServerUser() {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireServerAdmin() {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  return user;
}