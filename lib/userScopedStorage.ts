export const CURRENT_USER_STORAGE_KEY = "fxtrade_current_user_id";

export function setCurrentStorageUser(userId: string | null | undefined) {
  if (typeof window === "undefined") return;
  if (userId) window.localStorage.setItem(CURRENT_USER_STORAGE_KEY, userId);
  else window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
}

export function getCurrentStorageUser(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);
}

/**
 * Separates browser-persisted data per authenticated FX TRADE account.
 * This prevents a newly registered/logged-in user from seeing another
 * account's journal, academy progress, quiz state or trading plan.
 */
export function scopedStorageKey(key: string, userId?: string | null): string {
  const id = userId ?? getCurrentStorageUser();
  return id ? `fxtrade:user:${id}:${key}` : `fxtrade:guest:${key}`;
}
