import "./globals.css";
import { Toaster } from "sonner";
import { cookies } from "next/headers";
import LayoutShell from "@/components/LayoutShell";
import { LanguageProvider } from "@/components/LanguageProvider";
import LocalDictionaryTranslator from "@/components/LocalDictionaryTranslator";
import { normalizeLanguage } from "@/lib/i18n/catalog";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const lang = normalizeLanguage(cookieStore.get("fxtrade-language")?.value);

  return (
    <html lang={lang}>
      <body className="text-white">
        <LanguageProvider initialLanguage={lang}>
          <LocalDictionaryTranslator />
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
        </LanguageProvider>
      </body>
    </html>
  );
}
