import "./globals.css";
import type { Metadata } from "next";
import Nav from "../components/Nav";


export const metadata: Metadata = {
  title: "FX Trader – Premium",
  description: "Edukacja tradingowa + dashboard PRO + journal.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="bg-zinc-950 text-zinc-100">
        <Nav />
        {children}
        <footer className="text-center text-zinc-500 text-sm py-10 px-6">
          © {new Date().getFullYear()} FX Trader. Edukacja, nie porady inwestycyjne.
        </footer>
      </body>
    </html>
  );
}
