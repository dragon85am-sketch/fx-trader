"use client";

import { useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/components/LanguageProvider";
type DeleteAccountModalProps = {
  open: boolean;
  password: string;
  confirmation: string;
  deleting: boolean;
  onClose: () => void;
  onPasswordChange: (value: string) => void;
  onConfirmationChange: (value: string) => void;
  onConfirm: () => void;
};

export default function DeleteAccountModal({
  open,
  password,
  confirmation,
  deleting,
  onClose,
  onPasswordChange,
  onConfirmationChange,
  onConfirm,
}: DeleteAccountModalProps) {
  const { t } = useLanguage();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !deleting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, deleting, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm transition-opacity duration-200"
      onClick={() => {
        if (!deleting) onClose();
      }}
    >
      <div
        className="w-full max-w-md scale-100 rounded-3xl border border-red-500/20 bg-[#0b1220] p-6 shadow-[0_0_50px_rgba(0,0,0,0.45)] transition-transform duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="text-xl font-semibold text-red-400">
            {t("deleteAccount")}
          </h3>
          <p className="mt-2 text-sm leading-6 text-zinc-300/75">
            {t("deleteModalDescription")}
          </p>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-sm text-zinc-400">
              {t("currentPassword")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="mt-1 w-full rounded-xl border border-red-500/20 bg-black/30 px-3 py-2 text-white outline-none"
              placeholder={t("enterPassword")}
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400">
              {t("typeDeleteConfirm")}
            </label>
            <input
              type="text"
              value={confirmation}
              onChange={(e) => onConfirmationChange(e.target.value)}
              className="mt-1 w-full rounded-xl border border-red-500/20 bg-black/30 px-3 py-2 text-white outline-none"
              placeholder="DELETE"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="w-full rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("cancel")}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="w-full rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? t("deletingAccount") : t("deleteAccount")}
          </button>
        </div>
      </div>
    </div>
  );
}