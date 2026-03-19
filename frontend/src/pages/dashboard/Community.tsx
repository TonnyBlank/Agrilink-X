import DashboardShell from "@/components/dashboard/DashboardShell";
import { motion } from "framer-motion";
import { MessageSquare, Heart, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const categories = ["All", "Tips", "Question", "News", "Weather", "General"];

const posts = [
  { id: 1, author: "Mary W.", initials: "MW", category: "Tips", title: "Best time to plant tomatoes in Kiambu", body: "I've found that planting in late February gives the best yield. The rains usually start...", likes: 24, replies: 8, time: "2h ago" },
  { id: 2, author: "John K.", initials: "JK", category: "Question", title: "Anyone dealing with maize streak virus?", body: "My maize field in Nakuru has yellow streaks on leaves. What's the best treatment?", likes: 12, replies: 15, time: "4h ago" },
  { id: 3, author: "Grace M.", initials: "GM", category: "News", title: "New M-Pesa feature for farmers", body: "Safaricom just launched a new feature that allows direct payments from buyers...", likes: 45, replies: 22, time: "6h ago" },
  { id: 4, author: "Peter O.", initials: "PO", category: "Weather", title: "Heavy rains expected in Central Kenya", body: "KMD forecasts heavy rainfall across Central region this weekend. Secure your produce.", likes: 31, replies: 5, time: "8h ago" },
];

export default function Community() {
  const [activeCat, setActiveCat] = useState("All");
  const filtered = activeCat === "All" ? posts : posts.filter(p => p.category === activeCat);

  return (
    <DashboardShell title="Community">
      {/* Online indicator */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary sensor-pulse" />
          <span className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">8</span> Farmers Online</span>
        </div>
        <Button className="w-full rounded-xl bg-emerald-gradient text-primary-foreground sm:w-auto">
          <Plus className="w-4 h-4 mr-1" /> New Post
        </Button>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeCat === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-3">
        {filtered.map((post, i) => (
          <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bento-card">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {post.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{post.author}</span>
                  <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{post.category}</span>
                  <span className="text-[10px] text-muted-foreground sm:ml-auto">{post.time}</span>
                </div>
                <h4 className="font-display font-bold text-foreground text-sm mb-1">{post.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{post.body}</p>
                <div className="flex items-center gap-4 mt-3">
                  <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
                    <Heart className="w-3.5 h-3.5" /> {post.likes}
                  </button>
                  <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                    <MessageSquare className="w-3.5 h-3.5" /> {post.replies}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </DashboardShell>
  );
}
