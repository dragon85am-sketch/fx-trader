import { requireServerUser } from "@/lib/server-auth";
import SettingsClient from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  await requireServerUser();

  return <SettingsClient />;
}
