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

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = (value: Theme) => {
      const resolved = value === "system" ? (media.matches ? "dark" : "light") : value;
      root.classList.remove("dark", "light", "system");
      root.classList.add(resolved);
      root.dataset.theme = value;
    };

    applyTheme(savedTheme);
    localStorage.setItem("theme", savedTheme);
    const onSystemChange = () => {
      if ((localStorage.getItem("theme") as Theme) === "system") applyTheme("system");
    };
    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, [user?.theme]);

  return <>{children}</>;
}