// lib/oandaClient.ts
export type OandaEnvMode = "auto" | "practice" | "live";
export type OandaEnvPicked = "practice" | "live";

type OandaConfig = {
  env: OandaEnvPicked;
  baseUrl: string;
  apiKey: string;
  accountId: string;
};

const PRACTICE_BASE = "https://api-fxpractice.oanda.com";
const LIVE_BASE = "https://api-fxtrade.oanda.com";

function getEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

function cfgPractice(): OandaConfig | null {
  const apiKey = getEnv("OANDA_PRACTICE_API_KEY");
  const accountId = getEnv("OANDA_PRACTICE_ACCOUNT_ID");
  if (!apiKey || !accountId) return null;
  return { env: "practice", baseUrl: PRACTICE_BASE, apiKey, accountId };
}

function cfgLive(): OandaConfig | null {
  const apiKey = getEnv("OANDA_LIVE_API_KEY");
  const accountId = getEnv("OANDA_LIVE_ACCOUNT_ID");
  if (!apiKey || !accountId) return null;
  return { env: "live", baseUrl: LIVE_BASE, apiKey, accountId };
}

export function pickOandaConfig(mode: OandaEnvMode): OandaConfig | null {
  const p = cfgPractice();
  const l = cfgLive();

  if (mode === "practice") return p;
  if (mode === "live") return l;

  // auto:
  // prefer LIVE if exists, else practice
  return l ?? p;
}

export async function oandaFetch(
  cfg: OandaConfig,
  path: string,
  init?: RequestInit
): Promise<Response> {
  const url = `${cfg.baseUrl}${path}`;
  return fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
    },
    // ważne na Vercel/Next: nie cache’uj instrumentów w edge przypadkiem
    cache: "no-store",
  });
}

export async function tryOanda<T>(
  mode: OandaEnvMode,
  call: (cfg: OandaConfig) => Promise<T>
): Promise<{ ok: true; env: OandaEnvPicked; data: T } | { ok: false; error: any }> {
  const order: OandaEnvPicked[] =
    mode === "live" ? ["live"] :
    mode === "practice" ? ["practice"] :
    // auto
    (cfgLive() ? (["live", "practice"] as const) : (["practice"] as const));

  for (const env of order) {
    const cfg = env === "live" ? cfgLive() : cfgPractice();
    if (!cfg) continue;

    try {
      const data = await call(cfg);
      return { ok: true, env, data };
    } catch (e: any) {
      // jeśli live nie działa (401/403/404 etc) lecimy dalej na practice
      continue;
    }
  }

  return { ok: false, error: new Error("No working OANDA environment (LIVE/PRACTICE). Check env vars / API access.") };
}