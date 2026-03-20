import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export function useFollowing() {
  const { user } = useAuth();
  const storageKey = user ? `agrixl-following:${user.id}` : "agrixl-following:guest";
  const [followingIds, setFollowingIds] = useLocalStorage<string[]>(storageKey, []);

  const followingSet = useMemo(() => new Set(followingIds), [followingIds]);

  const follow = (userId: string) => {
    setFollowingIds((current) => (current.includes(userId) ? current : [...current, userId]));
  };

  const unfollow = (userId: string) => {
    setFollowingIds((current) => current.filter((id) => id !== userId));
  };

  const toggleFollow = (userId: string) => {
    setFollowingIds((current) => (current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]));
  };

  return {
    followingIds,
    followingSet,
    isFollowing: (userId: string | null | undefined) => Boolean(userId && followingSet.has(userId)),
    follow,
    unfollow,
    toggleFollow,
  };
}
