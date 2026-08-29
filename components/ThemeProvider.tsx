"use client";

import { useEffect } from "react";
import { useUser } from "@/components/UserProvider";

type Theme = "dark" | "light" | "system";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();

  useEffect(() => {
    const root = document.documentElement;

    const savedTheme =
      (user?.theme as Theme) ||
      (localStorage.getItem("theme") as Theme) ||
      "dark";

    const applyTheme = (value: Theme) => {
      root.classList.remove("dark", "light", "system");
      root.classList.add(value);
    };

    applyTheme(savedTheme);

    // zapis do localStorage (fallback)
    localStorage.setItem("theme", savedTheme);
  }, [user?.theme]);

  return <>{children}</>;
}