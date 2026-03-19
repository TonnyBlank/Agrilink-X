import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Brain,
  TrendingUp,
  Truck,
  BarChart3,
  Mic,
  CreditCard,
  Package,
  Search,
} from "lucide-react";

const proFeatures = [
  { icon: Package, label: "Listings", value: "Unlimited", active: true },
  { icon: Brain, label: "AI Crop Advisor", value: "2 suggestions", active: true },
  { icon: TrendingUp, label: "Demand Forecast", value: "+23% tomatoes", active: true },
  { icon: Truck, label: "Smart Logistics", value: "3 deliveries pending", active: true },
  { icon: BarChart3, label: "Sales Analytics", value: "KES 45,200 this week", active: true },
  { icon: Search, label: "Priority Search", value: "Active", active: true },
  { icon: Mic, label: "Voice Interface", value: "Swahili enabled", active: true },
  { icon: CreditCard, label: "Credit Score", value: "720 - Good", active: true },
];

export default function FarmerProDashboard() {
  const { profile, user } = useAuth();
  const displayName =
    profile?.full_name ||
    (typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ||
    "Farmer";
  const firstName = displayName.split(" ")[0];

  return (
    <DashboardLayout title="Pro Dashboard" tier="pro">
      <div className="mb-8">
        <h2 className="text-xl font-display font-bold text-foreground">
          Welcome back, {firstName}!
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          You're on the <span className="font-semibold text-gradient-gold">Farmer Pro</span> plan. All premium features are unlocked.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {proFeatures.map((f) => (
          <div key={f.label} className="p-5 rounded-xl bg-card border border-border hover:shadow-card transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <span className="font-medium text-foreground text-sm">{f.label}</span>
            </div>
            <p className="text-lg font-display font-semibold text-foreground">{f.value}</p>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
