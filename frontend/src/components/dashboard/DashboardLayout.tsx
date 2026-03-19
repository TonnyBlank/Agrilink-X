import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, User, Home, Settings, BarChart3 } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  tier: "free" | "pro" | "enterprise";
}

const tierColors = {
  free: "bg-primary/10 text-primary",
  pro: "bg-gold-gradient text-foreground",
  enterprise: "bg-accent/10 text-accent",
};

const tierLabels = {
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise",
};

export default function DashboardLayout({ children, title, tier }: DashboardLayoutProps) {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold">A</span>
              </div>
              <span className="font-display font-bold text-foreground hidden sm:inline">AgriLink X</span>
            </Link>
            <span className="text-muted-foreground text-sm hidden sm:inline">/</span>
            <span className="truncate text-sm font-medium text-foreground">{title}</span>
            <Link to="/dashboard/upgrade" className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold hover:opacity-80 transition-opacity ${tierColors[tier]}`}>
              {tierLabels[tier]}
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/"><Home className="w-4 h-4" /></Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 md:py-8">
        {children}
      </main>
    </div>
  );
}
