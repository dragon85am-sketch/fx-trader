import { redirect } from "next/navigation";
import { requirePremiumUser } from "@/lib/auth";

export default async function StrategieLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requirePremiumUser();

  if (!auth.ok) {
    redirect("/paywall?premium=expired");
  }

  return <>{children}</>;
}
