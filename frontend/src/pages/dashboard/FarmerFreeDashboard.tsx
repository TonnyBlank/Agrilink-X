import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Sprout,
  TrendingUp,
  MessageSquare,
  Bell,
  WifiOff,
  Package,
} from "lucide-react";
import { Link } from "react-router-dom";

const freeFeatures = [
  { icon: Package, label: "Product Listings", value: "3 / 5 this month" },
  { icon: TrendingUp, label: "AI Price Guidance", value: "Active" },
  { icon: MessageSquare, label: "Buyer Messages", value: "4 / 10 this month" },
  { icon: Bell, label: "Market Alerts", value: "3 new" },
  { icon: WifiOff, label: "Offline Mode", value: "Enabled" },
];

export default function FarmerFreeDashboard() {
  const { profile, user } = useAuth();
  const displayName =
    profile?.full_name ||
    (typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ||
    "Farmer";
  const firstName = displayName.split(" ")[0];

  return (
    <DashboardLayout title="Farmer Dashboard" tier="free">
      <div className="mb-8">
        <h2 className="text-xl font-display font-bold text-foreground">
          Karibu, {firstName}!
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          You're on the <span className="font-semibold text-primary">Free</span> plan. Upgrade to Pro to unlock AI insights and unlimited listings.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {freeFeatures.map((f) => (
          <div key={f.label} className="p-5 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <span className="font-medium text-foreground text-sm">{f.label}</span>
            </div>
            <p className="text-lg font-display font-semibold text-foreground">{f.value}</p>
          </div>
        ))}

        <Link to="/dashboard/upgrade" className="p-5 rounded-xl bg-gold-gradient border border-agri-gold-600/20 flex flex-col justify-center items-center text-center hover:opacity-90 transition-opacity">
          <Sprout className="w-8 h-8 text-foreground mb-2" />
          <p className="font-display font-bold text-foreground text-sm">Upgrade to Pro</p>
          <p className="text-xs text-foreground/70 mt-1">AI Crop Advisor, unlimited listings & more</p>
        </Link>
      </div>
    </DashboardLayout>
  );
}
