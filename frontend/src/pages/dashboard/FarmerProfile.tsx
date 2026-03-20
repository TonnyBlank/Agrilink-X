import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useFollowing } from "@/hooks/useFollowing";

type FarmerProfileData = {
  full_name: string | null;
  county: string | null;
  farm_size: string | null;
  main_crops: string[] | null;
  bio: string | null;
  photo_url: string | null;
  video_url: string | null;
};

type FollowProfileSummary = {
  userId: string;
  full_name: string | null;
  photo_url: string | null;
};

export default function FarmerProfile() {
  const { user } = useAuth();
  const { isFollowing, toggleFollow, getFollowersFor, getFollowingFor } = useFollowing();
  const { userId } = useParams();
  const [profile, setProfile] = useState<FarmerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [followProfiles, setFollowProfiles] = useState<Record<string, FollowProfileSummary>>({});

  const followerIds = useMemo(() => getFollowersFor(userId), [getFollowersFor, userId]);
  const followingIds = useMemo(() => getFollowingFor(userId), [getFollowingFor, userId]);

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

  useEffect(() => {
    let cancelled = false;
    const idsToLoad = Array.from(new Set([...followerIds, ...followingIds])).filter((id) => id && !followProfiles[id]);

    if (!idsToLoad.length) return;

    const loadFollowProfiles = async () => {
      const summaries = await Promise.all(
        idsToLoad.map(async (id) => {
          try {
            const data = await apiFetch<FarmerProfileData>(`/profiles/${id}`, {}, { auth: false });
            return {
              userId: id,
              full_name: data.full_name,
              photo_url: data.photo_url,
            } satisfies FollowProfileSummary;
          } catch {
            return {
              userId: id,
              full_name: "Farmer",
              photo_url: null,
            } satisfies FollowProfileSummary;
          }
        }),
      );

      if (!cancelled) {
        setFollowProfiles((current) => {
          const next = { ...current };
          summaries.forEach((summary) => {
            next[summary.userId] = summary;
          });
          return next;
        });
      }
    };

    void loadFollowProfiles();

    return () => {
      cancelled = true;
    };
  }, [followerIds, followingIds, followProfiles]);

  const renderFollowList = (ids: string[], emptyMessage: string) => {
    if (!ids.length) {
      return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
    }

    return (
      <div className="space-y-3">
        {ids.map((id) => {
          const summary = followProfiles[id];

          return (
            <Link
              key={id}
              to={`/dashboard/farmers/${id}`}
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/25 px-4 py-3 transition-colors hover:border-emerald-200 hover:bg-emerald-50/70 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/10"
            >
              {summary?.photo_url ? (
                <img
                  src={summary.photo_url}
                  alt={summary.full_name || "Farmer"}
                  className="h-10 w-10 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-sm font-bold text-primary">
                  {(summary?.full_name || "F")[0]}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{summary?.full_name || "Farmer"}</p>
                <p className="text-xs text-muted-foreground">View farmer profile</p>
              </div>
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <DashboardShell title="Farmer Profile">
      {loading ? (
        <div className="bento-card text-sm text-muted-foreground">Loading farmer profile...</div>
      ) : !profile ? (
        <div className="bento-card text-sm text-muted-foreground">Farmer profile not found.</div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-emerald-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,253,250,0.9))] p-6 shadow-[0_20px_60px_-28px_rgba(5,150,105,0.35)] dark:border-emerald-500/30 dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.97),rgba(17,24,39,0.95))]">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                {profile.photo_url ? (
                  <img
                    src={profile.photo_url}
                    alt={profile.full_name || "Profile photo"}
                    className="h-24 w-24 rounded-[1.75rem] object-cover"
                  />
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
                  <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
                    <span className="rounded-full border border-emerald-200 bg-white/90 px-3 py-1.5 text-emerald-700 dark:border-emerald-500/30 dark:bg-background/70 dark:text-emerald-300">
                      {followerIds.length} Followers
                    </span>
                    <span className="rounded-full border border-emerald-200 bg-white/90 px-3 py-1.5 text-emerald-700 dark:border-emerald-500/30 dark:bg-background/70 dark:text-emerald-300">
                      {followingIds.length} Following
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                {userId && userId !== user?.id && (
                  <Button type="button" variant="outline" className="rounded-xl" onClick={() => toggleFollow(userId)}>
                    {isFollowing(userId) ? "Following" : "Follow Farmer"}
                  </Button>
                )}
                <Button asChild className="rounded-xl">
                  <Link to="/dashboard/messages">
                    <MessageCircle className="mr-2 h-4 w-4" /> Message Farmer
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <div className="rounded-[1.75rem] border border-border bg-white/85 p-6 shadow-sm dark:bg-card/90">
                <h3 className="font-display text-xl font-bold text-foreground">Farm Summary</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {profile.bio || "This farmer has not added a farm description yet."}
                </p>
              </div>

              {profile.video_url && (
                <div className="rounded-[1.75rem] border border-border bg-white/85 p-6 shadow-sm dark:bg-card/90">
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
              <div className="rounded-[1.75rem] border border-border bg-white/85 p-6 shadow-sm dark:bg-card/90">
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

              <div className="rounded-[1.75rem] border border-border bg-white/85 p-6 shadow-sm dark:bg-card/90">
                <h3 className="font-display text-xl font-bold text-foreground">Main Crops</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(profile.main_crops?.length ? profile.main_crops : ["Not listed"]).map((crop) => (
                    <span
                      key={crop}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                    >
                      {crop}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-border bg-white/85 p-6 shadow-sm dark:bg-card/90">
                <h3 className="font-display text-xl font-bold text-foreground">Followers</h3>
                <div className="mt-4">{renderFollowList(followerIds, "No followers yet.")}</div>
              </div>

              <div className="rounded-[1.75rem] border border-border bg-white/85 p-6 shadow-sm dark:bg-card/90">
                <h3 className="font-display text-xl font-bold text-foreground">Following</h3>
                <div className="mt-4">{renderFollowList(followingIds, "Not following anyone yet.")}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
