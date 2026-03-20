import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

type FarmerProfileData = {
  full_name: string | null;
  county: string | null;
  farm_size: string | null;
  main_crops: string[] | null;
  bio: string | null;
  photo_url: string | null;
  video_url: string | null;
};

export default function FarmerProfile() {
  const { userId } = useParams();
  const [profile, setProfile] = useState<FarmerProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const data = await apiFetch<FarmerProfileData>(`/profiles/${userId}`, {}, { auth: false });
        if (!cancelled) {
          setProfile(data);
        }
      } catch (error) {
        console.error("Failed to load farmer profile", error);
        if (!cancelled) {
          toast.error("Failed to load farmer profile");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <DashboardShell title="Farmer Profile">
      {loading ? (
        <div className="bento-card text-sm text-muted-foreground">Loading farmer profile...</div>
      ) : !profile ? (
        <div className="bento-card text-sm text-muted-foreground">Farmer profile not found.</div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-emerald-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,253,250,0.9))] p-6 shadow-[0_20px_60px_-28px_rgba(5,150,105,0.35)]">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                {profile.photo_url ? (
                  <img src={profile.photo_url} alt={profile.full_name || "Profile photo"} className="h-24 w-24 rounded-[1.75rem] object-cover" />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-primary/10 text-3xl font-bold text-primary">
                    {(profile.full_name || "F")[0]}
                  </div>
                )}
                <div>
                  <h2 className="font-display text-3xl font-bold text-foreground">{profile.full_name || "Farmer"}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[profile.county, profile.farm_size].filter(Boolean).join(" • ") || "Farm profile"}
                  </p>
                </div>
              </div>
              <Button asChild className="rounded-xl">
                <Link to="/dashboard/messages">
                  <MessageCircle className="mr-2 h-4 w-4" /> Message Farmer
                </Link>
              </Button>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <div className="rounded-[1.75rem] border border-border bg-white/85 p-6 shadow-sm">
                <h3 className="font-display text-xl font-bold text-foreground">Farm Summary</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {profile.bio || "This farmer has not added a farm description yet."}
                </p>
              </div>

              {profile.video_url && (
                <div className="rounded-[1.75rem] border border-border bg-white/85 p-6 shadow-sm">
                  <h3 className="font-display text-xl font-bold text-foreground">Uploaded Farmer Video</h3>
                  <div className="mt-4 overflow-hidden rounded-[1.5rem] bg-black">
                    <video
                      src={profile.video_url}
                      controls
                      preload="metadata"
                      className="max-h-[28rem] w-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-[1.75rem] border border-border bg-white/85 p-6 shadow-sm">
                <h3 className="font-display text-xl font-bold text-foreground">Farm Details</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-xl bg-muted/35 px-4 py-3">
                    <span className="text-muted-foreground">County</span>
                    <span className="font-semibold text-foreground">{profile.county || "Not set"}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-muted/35 px-4 py-3">
                    <span className="text-muted-foreground">Farm Size</span>
                    <span className="font-semibold text-foreground">{profile.farm_size || "Not set"}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-border bg-white/85 p-6 shadow-sm">
                <h3 className="font-display text-xl font-bold text-foreground">Main Crops</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(profile.main_crops?.length ? profile.main_crops : ["Not listed"]).map((crop) => (
                    <span key={crop} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {crop}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
