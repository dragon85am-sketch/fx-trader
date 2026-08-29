import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requirePremiumUser } from "@/lib/auth";

export default async function TradingRoomLayout({
  children,
}: {
  children: ReactNode;
}) {
  const auth = await requirePremiumUser();

  if (!auth.ok) {
    redirect("/paywall?premium=expired");
  }

  return <>{children}</>;
}