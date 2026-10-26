import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import MonitorClient from "./MonitorClient";
export default async function PlatformMonitorPage(){
 const auth=await requireAdmin();
 if(!auth.ok) redirect("/dashboard");
 return <MonitorClient/>;
}
