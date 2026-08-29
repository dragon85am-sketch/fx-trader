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
        <h1>âœ… PÅ‚atnoÅ›Ä‡ udana</h1>
        <p>PrzenoszÄ™ CiÄ™ do paneluâ€¦</p>
      </div>
    </main>
  );
}

