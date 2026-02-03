import "./globals.css";
import type { Metadata } from "next";
import Nav from "../components/Nav";

export const metadata: Metadata = {
  title: "FX Trade – Premium",
  description: "Edukacja tradingowa + dashboard PRO + journal.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body
        className="
          min-h-screen text-zinc-100
          bg-[radial-gradient(1200px_circle_at_50%_15%,rgba(59,130,246,0.35),transparent_60%),linear-gradient(to_bottom,#0b1224,#081b3a,#020617)]
        "
      >
        <Nav />

        <main className="relative z-10">
          {children}
        </main>

        <footer className="text-center text-zinc-400 text-sm py-10 px-6">
          © {new Date().getFullYear()} FX Trade. Edukacja, nie porady inwestycyjne.
        </footer>
      </body>
    </html>
  );
}
