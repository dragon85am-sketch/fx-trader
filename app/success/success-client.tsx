"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { setPaid } from "../../components/storage";

export default function SuccessClient() {
  const router = useRouter();

  useEffect(() => {
  setPaid(true);
}, []);
  return (
    <main style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <h1>✅ Płatność udana</h1>
        <p>Przenoszę Cię do panelu…</p>
      </div>
    </main>
  );
}
