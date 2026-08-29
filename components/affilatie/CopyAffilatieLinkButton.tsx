"use client";

import { useState } from "react";
import { toast } from "sonner";

type CopyAffiliateLinkButtonProps = {
  affiliateLink: string;
};

export default function CopyAffiliateLinkButton({
  affiliateLink,
}: CopyAffiliateLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(affiliateLink);
      setCopied(true);
      toast.success("Link partnerski został skopiowany");

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      toast.error("Nie udało się skopiować linku");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.35)] transition hover:bg-blue-400"
    >
      {copied ? "Skopiowano" : "Kopiuj link"}
    </button>
  );
}