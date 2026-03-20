import { useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocalStorage } from "@/hooks/useLocalStorage";

type FollowGraph = Record<string, string[]>;

export function useFollowing() {
  const { user } = useAuth();
  const storageKey = user ? `agrixl-following:${user.id}` : "agrixl-following:guest";
  const [legacyFollowingIds] = useLocalStorage<string[]>(storageKey, []);
  const [followGraph, setFollowGraph] = useLocalStorage<FollowGraph>("agrixl-follow-graph", {});

  useEffect(() => {
    if (!user || !legacyFollowingIds.length) return;

    setFollowGraph((currentGraph) => {
      const currentFollowing = currentGraph[user.id] ?? [];
      const mergedFollowing = Array.from(new Set([...currentFollowing, ...legacyFollowingIds]));

      if (mergedFollowing.length === currentFollowing.length) {
        return currentGraph;
      }

      return {
        ...currentGraph,
        [user.id]: mergedFollowing,
      };
    });
  }, [legacyFollowingIds, setFollowGraph, user]);

  const followingIds = useMemo(() => {
    if (!user) return [];
    return Array.from(new Set(followGraph[user.id] ?? legacyFollowingIds));
  }, [followGraph, legacyFollowingIds, user]);

  const followingSet = useMemo(() => new Set(followingIds), [followingIds]);
  const getFollowingFor = (userId: string | null | undefined) => {
    if (!userId) return [];
    return Array.from(new Set(followGraph[userId] ?? (userId === user?.id ? legacyFollowingIds : [])));
  };

  const getFollowersFor = (userId: string | null | undefined) => {
    if (!userId) return [];

    return Object.entries(followGraph)
      .filter(([, followedIds]) => followedIds.includes(userId))
      .map(([followerId]) => followerId);
  };

  const writeFollowing = (updater: (current: string[]) => string[]) => {
    if (!user) return;

    setFollowGraph((currentGraph) => {
      const nextFollowing = Array.from(new Set(updater(currentGraph[user.id] ?? legacyFollowingIds)));
      return {
        ...currentGraph,
        [user.id]: nextFollowing,
      };
    });
  };

  const follow = (userId: string) => {
    writeFollowing((current) => (current.includes(userId) ? current : [...current, userId]));
  };

  const unfollow = (userId: string) => {
    writeFollowing((current) => current.filter((id) => id !== userId));
  };

  const toggleFollow = (userId: string) => {
    writeFollowing((current) => (current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]));
  };

  return {
    followingIds,
    followingSet,
    followersIds: user ? getFollowersFor(user.id) : [],
    isFollowing: (userId: string | null | undefined) => Boolean(userId && followingSet.has(userId)),
    getFollowingFor,
    getFollowersFor,
    follow,
    unfollow,
    toggleFollow,
  };
}
