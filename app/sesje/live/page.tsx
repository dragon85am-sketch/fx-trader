"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Crown,
  ExternalLink,
  MessageCircle,
  Radio,
  Send,
  ShieldCheck,
  UserRound,
  Users,
  Video,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

type ChatMessage = {
  id: string;
  author: string;
  text: string;
  createdAt?: string;
  isHost?: boolean;
};

type OnlineUser = {
  id: string;
  name: string;
  role: string;
  isHost: boolean;
  lastSeen: string;
  joinedAt: string;
};

function toEmbedUrl(value: string) {
  if (!value) return "";

  try {
    const url = new URL(value);

    if (url.hostname.includes("youtube.com")) {
      const videoId = url.searchParams.get("v");
      if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

      if (url.pathname.startsWith("/live/")) {
        const id = url.pathname.replace("/live/", "").split("/")[0];
        if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
      }
    }

    if (url.hostname === "youtu.be") {
      const id = url.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
    }

    return value;
  } catch {
    return "";
  }
}

function formatTime(value?: string) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

export default function DolaczDoSesjiPage() {
  const { tText } = useLanguage();

  const liveUrl = process.env.NEXT_PUBLIC_SESSION_LIVE_URL ?? "";
  const channelUrl = process.env.NEXT_PUBLIC_SESSION_CHANNEL_URL ?? "";
  const embedUrl = useMemo(() => toEmbedUrl(liveUrl), [liveUrl]);

  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const loadMessages = useCallback(async () => {
    const res = await fetch("/api/session-chat", { cache: "no-store" }).catch(() => null);
    if (!res?.ok) return;

    const data = await res.json();
    setMessages(Array.isArray(data.messages) ? data.messages : []);
  }, []);

  const heartbeat = useCallback(async () => {
    await fetch("/api/session-presence", {
      method: "POST",
      cache: "no-store",
    }).catch(() => null);
  }, []);

  const loadOnlineUsers = useCallback(async () => {
    const res = await fetch("/api/session-presence", { cache: "no-store" }).catch(() => null);
    if (!res?.ok) return;

    const data = await res.json();
    setOnlineUsers(Array.isArray(data.users) ? data.users : []);
  }, []);

  useEffect(() => {
    void heartbeat();
    void loadMessages();
    void loadOnlineUsers();

    const heartbeatTimer = window.setInterval(() => void heartbeat(), 20_000);
    const messageTimer = window.setInterval(() => void loadMessages(), 3_000);
    const usersTimer = window.setInterval(() => void loadOnlineUsers(), 8_000);

    return () => {
      window.clearInterval(heartbeatTimer);
      window.clearInterval(messageTimer);
      window.clearInterval(usersTimer);

      void fetch("/api/session-presence", {
        method: "DELETE",
        keepalive: true,
      }).catch(() => null);
    };
  }, [heartbeat, loadMessages, loadOnlineUsers]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    const clean = text.trim();
    if (!clean || sending) return;

    setSending(true);

    const res = await fetch("/api/session-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: clean }),
    }).catch(() => null);

    if (res?.ok) {
      setText("");
      await loadMessages();
    }

    setSending(false);
  };

  const hostOnline = onlineUsers.some((user) => user.isHost);

  return (
    <main className="min-h-screen bg-[#030914] text-white">
      <div className="mx-auto w-full max-w-[1900px] px-3 py-4 md:px-5 lg:px-7">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-sky-400/20 bg-[linear-gradient(135deg,rgba(5,37,68,.98),rgba(2,15,30,.98))] px-4 py-4 shadow-2xl shadow-black/20 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/sesje"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[.04] transition hover:bg-white/[.08]"
              aria-label={tText("Wróć do sesji")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-rose-400/30 bg-rose-500/10 text-rose-300">
              <Radio className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="text-[9px] font-black uppercase tracking-[.22em] text-sky-300/70">
                FX TRADE PROFESSIONAL
              </div>
              <h1 className="truncate text-lg font-black md:text-2xl">
                {tText("Sesja LIVE")}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {channelUrl ? (
              <a
                href={channelUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden items-center gap-2 rounded-xl border border-sky-400/25 bg-sky-500/10 px-4 py-2.5 text-[11px] font-black text-sky-200 transition hover:bg-sky-500/20 md:inline-flex"
              >
                <ExternalLink className="h-4 w-4" />
                {tText("Dołącz do kanału")}
              </a>
            ) : null}

            <div className="inline-flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-[10px] font-black text-rose-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-rose-400" />
              LIVE
            </div>
          </div>
        </header>

        <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="overflow-hidden rounded-[22px] border border-sky-400/20 bg-[#020912] shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between border-b border-white/[.07] bg-[#061526] px-4 py-3 md:px-5">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[.18em] text-rose-300">
                  {tText("Transmisja")}
                </div>
                <h2 className="mt-1 text-sm font-black md:text-lg">
                  FX TRADE · LIVE TRADING SESSION
                </h2>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                <Video className="h-4 w-4 text-sky-300" />
                <span className={hostOnline ? "text-emerald-300" : ""}>
                  {hostOnline
                    ? tText("Prowadzący online")
                    : tText("Oczekiwanie na prowadzącego")}
                </span>
              </div>
            </div>

            {embedUrl ? (
              <div className="aspect-video min-h-[330px] w-full bg-black xl:min-h-[560px]">
                <iframe
                  src={embedUrl}
                  title="FX TRADE LIVE"
                  className="h-full w-full"
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="grid aspect-video min-h-[330px] place-items-center bg-[radial-gradient(circle_at_50%_30%,rgba(14,165,233,.12),transparent_35%),linear-gradient(180deg,#041322,#02070d)] px-6 text-center xl:min-h-[560px]">
                <div className="max-w-xl">
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-sky-400/20 bg-sky-500/10">
                    <Video className="h-9 w-9 text-sky-300" />
                  </div>
                  <h3 className="mt-5 text-2xl font-black">
                    {tText("Ekran transmisji LIVE")}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {tText(
                      "Po uruchomieniu transmisji obraz pojawi się tutaj. Ustaw adres transmisji w NEXT_PUBLIC_SESSION_LIVE_URL."
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          <aside className="overflow-hidden rounded-[22px] border border-sky-400/20 bg-[#061526] shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between border-b border-white/[.07] px-4 py-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-sky-300" />
                <div>
                  <div className="text-sm font-black">
                    {tText("Użytkownicy online")}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-500">
                    {tText("Na sesji teraz")}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-black text-emerald-300">
                {onlineUsers.length}
              </div>
            </div>

            <div className="max-h-[615px] min-h-[360px] overflow-y-auto p-3">
              {onlineUsers.length === 0 ? (
                <div className="grid min-h-[300px] place-items-center text-center">
                  <div>
                    <UserRound className="mx-auto h-10 w-10 text-slate-600" />
                    <div className="mt-3 text-sm font-bold text-slate-400">
                      {tText("Brak aktywnych użytkowników")}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {onlineUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.025] p-3"
                    >
                      <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-sky-400/15 bg-sky-500/10 font-black text-sky-200">
                        {user.name.slice(0, 1).toUpperCase()}
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#061526] bg-emerald-400" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="truncate text-xs font-black text-slate-100">
                            {user.name}
                          </div>

                          {user.isHost ? (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-amber-400/20 bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-black text-amber-300">
                              <Crown className="h-2.5 w-2.5" />
                              HOST
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-0.5 text-[9px] text-emerald-300">
                          ● {tText("Online")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-white/[.07] px-4 py-3 text-[9px] leading-4 text-slate-500">
              {tText("Lista pokazuje użytkowników aktywnych na stronie sesji LIVE.")}
            </div>
          </aside>
        </section>

        <section className="mt-4 overflow-hidden rounded-[22px] border border-sky-400/20 bg-[#061526] shadow-2xl shadow-black/20">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[.07] px-4 py-4 md:px-5">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl border border-sky-400/20 bg-sky-500/10 text-sky-300">
                <MessageCircle className="h-4 w-4" />
              </div>

              <div>
                <h2 className="text-sm font-black">{tText("Czat sesji")}</h2>
                <p className="text-[9px] text-slate-500">
                  {tText("Rozmawiaj z prowadzącym i innymi uczestnikami sesji.")}
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 text-[9px] font-bold text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
              {tText("Dostęp chroniony przez Premium.")}
            </div>
          </div>

          <div className="grid lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0 border-b border-white/[.07] lg:border-b-0 lg:border-r">
              <div className="h-[330px] space-y-3 overflow-y-auto bg-[#030b15] p-4 md:h-[390px] md:p-5">
                {messages.length === 0 ? (
                  <div className="grid h-full place-items-center text-center text-sm text-slate-500">
                    {tText("Napisz pierwszą wiadomość na sesji.")}
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="flex gap-3">
                      <div
                        className={[
                          "grid h-9 w-9 shrink-0 place-items-center rounded-full border text-xs font-black",
                          message.isHost
                            ? "border-amber-400/25 bg-amber-500/10 text-amber-300"
                            : "border-sky-400/20 bg-sky-500/10 text-sky-200",
                        ].join(" ")}
                      >
                        {message.author.slice(0, 1).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={
                              message.isHost
                                ? "text-xs font-black text-amber-300"
                                : "text-xs font-black text-sky-300"
                            }
                          >
                            {message.author}
                          </span>

                          {message.isHost ? (
                            <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-black text-amber-300">
                              {tText("Prowadzący")}
                            </span>
                          ) : null}

                          <span className="text-[9px] text-slate-600">
                            {formatTime(message.createdAt)}
                          </span>
                        </div>

                        <div className="mt-1.5 inline-block max-w-[95%] rounded-2xl rounded-tl-md border border-white/[.06] bg-white/[.035] px-3.5 py-2.5 text-xs leading-5 text-slate-200">
                          {message.text}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                <div ref={chatEndRef} />
              </div>

              <div className="flex gap-2 border-t border-white/[.07] bg-[#061526] p-3 md:p-4">
                <input
                  value={text}
                  maxLength={500}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  placeholder={tText("Napisz wiadomość…")}
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#020912] px-4 py-3 text-xs text-white outline-none transition placeholder:text-slate-600 focus:border-sky-400/40"
                />

                <button
                  type="button"
                  onClick={() => void send()}
                  disabled={!text.trim() || sending}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 text-xs font-black text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {sending ? tText("Wysyłanie…") : tText("Wyślij")}
                  </span>
                </button>
              </div>
            </div>

            <aside className="bg-[#071728] p-4 md:p-5">
              <div className="text-[9px] font-black uppercase tracking-[.18em] text-sky-300">
                FX TRADE SESSION
              </div>
              <h3 className="mt-2 text-lg font-black">
                {tText("Czat z prowadzącym")}
              </h3>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                {tText(
                  "Pytaj o analizę, setup i zarządzanie pozycją podczas transmisji. Wiadomości widzą uczestnicy tej sesji."
                )}
              </p>

              <div className="mt-5 space-y-2 text-[10px]">
                <div className="flex items-center gap-2 rounded-xl border border-white/[.06] bg-white/[.025] p-3 text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {onlineUsers.length} {tText("online")}
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-white/[.06] bg-white/[.025] p-3 text-slate-300">
                  <MessageCircle className="h-3.5 w-3.5 text-sky-300" />
                  {messages.length} {tText("wiadomości")}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
