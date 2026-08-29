import "./globals.css";
import { Toaster } from "sonner";
import { cookies } from "next/headers";
import LayoutShell from "@/components/LayoutShell";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  return (
    <html lang="pl">
      <body className="text-white">
        {token ? (
          <LayoutShell>{children}</LayoutShell>
        ) : (
          children
        )}

        <Toaster
          position="top-right"
          richColors
          expand
          closeButton
        />
      </body>
    </html>
  );
}