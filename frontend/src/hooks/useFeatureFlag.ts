import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export function useFeatureFlag(featureKey: string) {
  const { role } = useAuth();

  const { data: enabled = false } = useQuery({
    queryKey: ["feature-flag", featureKey, role],
    queryFn: async () => {
      if (!role) return false;
      const { data } = await supabase
        .from("feature_flags")
        .select("enabled_for")
        .eq("feature_key", featureKey)
        .single();
      if (!data) return false;
      return (data.enabled_for as AppRole[]).includes(role);
    },
    enabled: !!role,
  });

  return enabled;
}
