import DashboardShell from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useFollowing } from "@/hooks/useFollowing";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { motion } from "framer-motion";
import { Heart, MessageSquare, Plus, Send, Trash2, UserPlus, Users, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

const categories = ["All", "Tips", "Question", "News", "Weather", "General"] as const;

type Category = (typeof categories)[number];

interface CommentItem {
  id: string;
  authorId?: string | null;
  author: string;
  initials: string;
  body: string;
  createdAt: string;
}

interface CommunityPost {
  id: string;
  authorId?: string | null;
  author: string;
  initials: string;
  category: Exclude<Category, "All">;
  title: string;
  body: string;
  likes: number;
  likedByMe: boolean;
  createdAt: string;
  comments: CommentItem[];
}

const initialPosts: CommunityPost[] = [
  {
    id: "post-1",
    authorId: "farmer-mary-w",
    author: "Mary W.",
    initials: "MW",
    category: "Tips",
    title: "Best time to plant tomatoes in Kiambu",
    body: "I've found that planting in late February gives the best yield. The rains usually start soon after, which helps seedlings establish fast.",
    likes: 24,
    likedByMe: false,
    createdAt: "2026-03-19T15:20:00.000Z",
    comments: [
      {
        id: "comment-1",
        authorId: "farmer-david-k",
        author: "David K.",
        initials: "DK",
        body: "I do the same and add compost one week before transplanting.",
        createdAt: "2026-03-19T15:45:00.000Z",
      },
    ],
  },
  {
    id: "post-2",
    authorId: "farmer-john-k",
    author: "John K.",
    initials: "JK",
    category: "Question",
    title: "Anyone dealing with maize streak virus?",
    body: "My maize field in Nakuru has yellow streaks on leaves. What treatment worked for you and how early did you act?",
    likes: 12,
    likedByMe: false,
    createdAt: "2026-03-19T13:20:00.000Z",
    comments: [
      {
        id: "comment-2",
        authorId: "farmer-grace-m",
        author: "Grace M.",
        initials: "GM",
        body: "We removed badly affected plants quickly and controlled leafhoppers early.",
        createdAt: "2026-03-19T13:55:00.000Z",
      },
      {
        id: "comment-3",
        authorId: "farmer-peter-o",
        author: "Peter O.",
        initials: "PO",
        body: "Check your seed source too. Resistant varieties helped us last season.",
        createdAt: "2026-03-19T14:10:00.000Z",
      },
    ],
  },
  {
    id: "post-3",
    authorId: "farmer-grace-m",
    author: "Grace M.",
    initials: "GM",
    category: "News",
    title: "New M-Pesa feature for farmers",
    body: "Safaricom just launched a feature that makes buyer collections easier to track for group deliveries and produce pickups.",
    likes: 45,
    likedByMe: true,
    createdAt: "2026-03-19T11:20:00.000Z",
    comments: [],
  },
  {
    id: "post-4",
    authorId: "farmer-peter-o",
    author: "Peter O.",
    initials: "PO",
    category: "Weather",
    title: "Heavy rains expected in Central Kenya",
    body: "Rainfall is expected across the region this weekend. Secure harvested produce and improve drainage before the downpour starts.",
    likes: 31,
    likedByMe: false,
    createdAt: "2026-03-19T09:20:00.000Z",
    comments: [
      {
        id: "comment-4",
        authorId: "farmer-mary-w",
        author: "Mary W.",
        initials: "MW",
        body: "I moved my onion harvest indoors this morning for the same reason.",
        createdAt: "2026-03-19T09:50:00.000Z",
      },
    ],
  },
];

function buildInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatRelativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function Community() {
  const { profile, user } = useAuth();
  const { isFollowing, followingIds, toggleFollow } = useFollowing();
  const [activeCat, setActiveCat] = useState<Category>("All");
  const [posts, setPosts] = useLocalStorage<CommunityPost[]>("agrixl-community-posts", initialPosts);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<Exclude<Category, "All">>("General");
  const [expandedPostId, setExpandedPostId] = useState<string | null>(posts[0]?.id ?? null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const currentAuthor = profile?.full_name?.trim() || user?.user_metadata?.full_name?.trim() || user?.email || "You";
  const currentInitials = useMemo(() => buildInitials(currentAuthor), [currentAuthor]);
  const currentUserId = user?.id ?? null;

  const followScopedPosts = useMemo(
    () =>
      posts.filter((post) => {
        if (post.authorId && post.authorId === currentUserId) return true;
        if (post.authorId && followingIds.includes(post.authorId)) return true;
        return false;
      }),
    [currentUserId, followingIds, posts],
  );

  const filteredPosts = useMemo(() => {
    const visiblePosts = activeCat === "All" ? followScopedPosts : followScopedPosts.filter((post) => post.category === activeCat);
    return [...visiblePosts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [activeCat, followScopedPosts]);

  const handleCreatePost = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim() || !body.trim()) return;

    const newPost: CommunityPost = {
      id: `post-${crypto.randomUUID()}`,
      authorId: currentUserId,
      author: currentAuthor,
      initials: currentInitials || "YO",
      category,
      title: title.trim(),
      body: body.trim(),
      likes: 0,
      likedByMe: false,
      createdAt: new Date().toISOString(),
      comments: [],
    };

    setPosts((currentPosts) => [newPost, ...currentPosts]);
    setExpandedPostId(newPost.id);
    setIsComposerOpen(false);
    setTitle("");
    setBody("");
    setCategory("General");
  };

  const handleToggleLike = (postId: string) => {
    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              likedByMe: !post.likedByMe,
              likes: post.likedByMe ? Math.max(0, post.likes - 1) : post.likes + 1,
            }
          : post,
      ),
    );
  };

  const handleAddComment = (postId: string) => {
    const draft = commentDrafts[postId]?.trim();
    if (!draft) return;

    const comment: CommentItem = {
      id: `comment-${crypto.randomUUID()}`,
      authorId: currentUserId,
      author: currentAuthor,
      initials: currentInitials || "YO",
      body: draft,
      createdAt: new Date().toISOString(),
    };

    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId ? { ...post, comments: [...post.comments, comment] } : post,
      ),
    );
    setCommentDrafts((currentDrafts) => ({ ...currentDrafts, [postId]: "" }));
    setExpandedPostId(postId);
  };

  const handleDeletePost = (postId: string) => {
    setPosts((currentPosts) =>
      currentPosts.filter((post) => !(post.id === postId && post.authorId && post.authorId === currentUserId)),
    );
    if (expandedPostId === postId) {
      setExpandedPostId(null);
    }
  };

  const handleDeleteComment = (postId: string, commentId: string) => {
    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments.filter(
                (comment) => !(comment.id === commentId && comment.authorId && comment.authorId === currentUserId),
              ),
            }
          : post,
      ),
    );
  };

  return (
    <DashboardShell title="Community">
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            <span>
              <span className="font-semibold text-foreground">{followScopedPosts.length}</span> active discussions
            </span>
          </div>
          <Button
            type="button"
            onClick={() => setIsComposerOpen(true)}
            className="w-full rounded-xl bg-emerald-gradient text-primary-foreground sm:w-auto"
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Post
          </Button>
        </div>

        {isComposerOpen && (
          <form onSubmit={handleCreatePost} className="bento-card space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-sm font-bold text-primary">
                  {currentInitials || "YO"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{currentAuthor}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Write a post</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Share advice, ask questions, or post an update for other farmers.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close add post form"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Post title"
              className="h-11 rounded-2xl border-border/80 bg-background/70"
            />

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as Exclude<Category, "All">)}
              className="h-11 rounded-2xl border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {categories.filter((item) => item !== "All").map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Write your post here..."
              className="min-h-[120px] rounded-3xl border-border/80 bg-background/70"
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsComposerOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl bg-emerald-gradient text-primary-foreground">
                Post
              </Button>
            </div>
          </form>
        )}
      </div>

      {!followingIds.length && !posts.some((post) => post.authorId === currentUserId) && (
        <div className="mb-6 rounded-[1.5rem] border border-dashed border-border bg-white/80 p-5 text-sm text-muted-foreground dark:bg-card/80">
          Follow farmers to build your real community feed. Tips, Question, News, Weather, and General posts now come from farmers you follow.
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((item) => (
          <button
            key={item}
            onClick={() => setActiveCat(item)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              activeCat === item ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {!filteredPosts.length && (
          <div className="bento-card py-12 text-center text-sm text-muted-foreground">
            No posts from the farmers you follow yet. Follow farmers from Community or their profile pages to build your feed.
          </div>
        )}
        {filteredPosts.map((post, index) => {
          const commentsOpen = expandedPostId === post.id;
          const canDeletePost = Boolean(currentUserId && post.authorId && post.authorId === currentUserId);

          return (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bento-card"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                  {post.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{post.author}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{post.category}</span>
                    <span className="text-[10px] text-muted-foreground sm:ml-auto">{formatRelativeTime(post.createdAt)}</span>
                    {post.authorId && post.authorId !== currentUserId && (
                      <button
                        onClick={() => toggleFollow(post.authorId!)}
                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                          isFollowing(post.authorId) ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:text-primary"
                        }`}
                      >
                        <UserPlus className="h-3 w-3" />
                        {isFollowing(post.authorId) ? "Following" : "Follow"}
                      </button>
                    )}
                    {canDeletePost && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="flex items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    )}
                  </div>
                  <h4 className="mb-1 font-display text-sm font-bold text-foreground">{post.title}</h4>
                  <p className="text-xs leading-relaxed text-muted-foreground">{post.body}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleToggleLike(post.id)}
                      className={`flex items-center gap-1 text-xs transition-colors ${
                        post.likedByMe ? "text-rose-500" : "text-muted-foreground hover:text-rose-500"
                      }`}
                    >
                      <Heart className={`h-3.5 w-3.5 ${post.likedByMe ? "fill-rose-500" : ""}`} />
                      {post.likes}
                    </button>
                    <button
                      onClick={() => setExpandedPostId(commentsOpen ? null : post.id)}
                      className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      {post.comments.length}
                    </button>
                  </div>

                  {commentsOpen && (
                    <div className="mt-4 space-y-3 rounded-2xl border border-border/70 bg-muted/30 p-3">
                      <div className="space-y-2">
                        {post.comments.length > 0 ? (
                          post.comments.map((comment) => (
                            <div key={comment.id} className="rounded-xl bg-background/80 p-3">
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                                  {comment.initials}
                                </div>
                                <span className="text-xs font-semibold text-foreground">{comment.author}</span>
                                <span className="text-[10px] text-muted-foreground">{formatRelativeTime(comment.createdAt)}</span>
                                {Boolean(currentUserId && comment.authorId && comment.authorId === currentUserId) && (
                                  <button
                                    onClick={() => handleDeleteComment(post.id, comment.id)}
                                    className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    Delete
                                  </button>
                                )}
                              </div>
                              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{comment.body}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground">No comments yet. Start the conversation.</p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Textarea
                          value={commentDrafts[post.id] ?? ""}
                          onChange={(event) =>
                            setCommentDrafts((currentDrafts) => ({
                              ...currentDrafts,
                              [post.id]: event.target.value,
                            }))
                          }
                          placeholder="Write a comment..."
                          className="min-h-[84px] rounded-xl"
                        />
                        <Button
                          type="button"
                          onClick={() => handleAddComment(post.id)}
                          className="rounded-xl sm:self-end"
                        >
                          <Send className="mr-1 h-4 w-4" />
                          Comment
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </DashboardShell>
  );
}
