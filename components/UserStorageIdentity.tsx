"use client";

import { useEffect } from "react";
import { setCurrentStorageUser } from "@/lib/userScopedStorage";

export default function UserStorageIdentity() {
  useEffect(() => {
    let cancelled = false;
    fetch("/api/me", { credentials: "include", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.user?.id) setCurrentStorageUser(String(data.user.id));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return null;
}
