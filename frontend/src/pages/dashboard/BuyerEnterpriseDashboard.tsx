import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Handshake,
  TrendingUp,
  Shield,
  BarChart3,
  FileText,
  Users,
  Package,
  Search,
} from "lucide-react";

const enterpriseFeatures = [
  { icon: Search, label: "Farmer Search", value: "2,340 verified farmers" },
  { icon: Handshake, label: "Active Contracts", value: "12 contracts" },
  { icon: Package, label: "Bulk Orders", value: "4 pending" },
  { icon: TrendingUp, label: "Supply Forecast", value: "+15% next month" },
  { icon: Shield, label: "Escrow Balance", value: "KES 1.2M secured" },
  { icon: Users, label: "Featured Farmers", value: "8 matches" },
  { icon: BarChart3, label: "Cost Projections", value: "-8% vs last quarter" },
  { icon: FileText, label: "Export Reports", value: "Ready" },
];

export default function BuyerEnterpriseDashboard() {
  const { profile, user } = useAuth();
  const displayName =
    profile?.full_name ||
    (typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ||
    "Buyer";
  const firstName = displayName.split(" ")[0];

  return (
    <DashboardLayout title="Enterprise Dashboard" tier="enterprise">
      <div className="mb-8">
        <h2 className="text-xl font-display font-bold text-foreground">
          Welcome, {firstName}!
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          <span className="font-semibold text-accent">Buyer Enterprise</span> - Full access to predictive analytics, contract farming, and bulk ordering.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {enterpriseFeatures.map((f) => (
          <div key={f.label} className="p-5 rounded-xl bg-card border border-border hover:shadow-card transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <f.icon className="w-5 h-5 text-accent" />
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
