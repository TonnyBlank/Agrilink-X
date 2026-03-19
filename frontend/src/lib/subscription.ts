import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

type LocalSubscription = {
  role: AppRole;
  expiresAt: string | null;
};

const STORAGE_PREFIX = "mock_role_";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function getStorageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

export function getStoredRole(userId: string): AppRole | null {
  const raw = localStorage.getItem(getStorageKey(userId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as LocalSubscription | AppRole;

    if (typeof parsed === "string") {
      return parsed;
    }

    if (!parsed.expiresAt) {
      return parsed.role;
    }

    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      localStorage.removeItem(getStorageKey(userId));
      return null;
    }

    return parsed.role;
  } catch {
    localStorage.removeItem(getStorageKey(userId));
    return null;
  }
}

export function setStoredRole(userId: string, role: AppRole, durationMs = THIRTY_DAYS_MS) {
  const payload: LocalSubscription = {
    role,
    expiresAt: durationMs > 0 ? new Date(Date.now() + durationMs).toISOString() : null,
  };

  localStorage.setItem(getStorageKey(userId), JSON.stringify(payload));
}

export function clearStoredRole(userId: string) {
  localStorage.removeItem(getStorageKey(userId));
}

