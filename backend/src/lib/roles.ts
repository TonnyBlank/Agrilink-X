import { SupabaseClient } from "@supabase/supabase-js";

export const APP_ROLES = ["farmer_free", "farmer_pro", "buyer_enterprise"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && APP_ROLES.includes(value as AppRole);
}

export async function resolveAppRole(
  supabase: SupabaseClient,
  userId: string,
  requestedRole?: string,
): Promise<AppRole> {
  if (isAppRole(requestedRole)) {
    const { data: hasRequestedRole, error: hasRoleError } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: requestedRole,
    });

    if (!hasRoleError && hasRequestedRole) {
      return requestedRole;
    }
  }

  const { data, error } = await supabase.rpc("get_user_role", { _user_id: userId });
  if (error) {
    console.error("[roles] Failed to resolve role via RPC:", error.message);
    return "farmer_free";
  }
  return isAppRole(data) ? data : "farmer_free";
}
