import DashboardShell from "@/components/dashboard/DashboardShell";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

import { motion } from "framer-motion";
import { Check, Zap, Shield, Crown, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

const plans = [
  {
    id: "farmer_free",
    name: "Farmer Free",
    price: "$0",
    period: "forever",
    description: "Start Smart, Grow Fast",
    features: [
      "Farm profile & product listings (10 max)",
      "Marketplace browsing",
      "Order & delivery tracking",
      "Community forum & tips",
      "Crop calendar & weather alerts",
      "Basic AI suggestions (1/week)",
      "Chat with buyers",
      "Offline mode",
    ],
    icon: Zap,
    variant: "standard" as const,
  },
  {
    id: "farmer_pro",
    name: "Farmer Pro",
    price: "$10",
    period: "/month",
    description: "Scale Your Farm, Maximize Profits",
    features: [
      "Everything in Free +",
      "Unlimited product listings",
      "Full AI crop & profit advisor",
      "AI crop disease scanner",
      "Smart logistics & delivery ETA",
      "Voice interface (Swahili + English)",
      "Real-time analytics & reports",
      "Micro-loans & credit scoring",
      "Crop insurance integration",
      "Input marketplace access",
      "Loyalty rewards program",
    ],
    icon: Crown,
    variant: "pro" as const,
  },
  {
    id: "buyer_enterprise",
    name: "Buyer Enterprise",
    price: "$50",
    period: "/month",
    description: "Secure, Predictable Supply",
    features: [
      "Everything in Pro +",
      "Bulk ordering system",
      "Contract farming agreements",
      "Predictive supply insights (AI)",
      "Escrow & M-Pesa payments",
      "Featured farmer matching",
      "Smart warehouse integration",
      "Procurement forecasting",
      "Blockchain supply traceability",
      "Exportable invoices & tax receipts",
      "Multiple buyer accounts",
    ],
    icon: Shield,
    variant: "enterprise" as const,
  },
];

export default function UpgradePlan() {
  const { role, refreshProfile, setActiveRole } = useAuth();
  const navigate = useNavigate();
  const [upgrading, setUpgrading] = useState<string | null>(null);


  const handleUpgrade = (planId: string) => {
    if (planId === role) return;
    setUpgrading(planId);

    // Simulate M-Pesa STK Push
    toast.info("M-Pesa STK Push sent to your phone...", { icon: <Smartphone className="w-4 h-4" /> });

    setTimeout(async () => {
      setActiveRole(planId as typeof role extends null ? never : NonNullable<typeof role>);
      await refreshProfile();
      toast.success(`Upgraded to ${plans.find(p => p.id === planId)?.name}! Pro features are now active.`, {
        icon: <Zap className="w-4 h-4" />,
      });
      setUpgrading(null);
      navigate(planId === "buyer_enterprise" ? "/dashboard/enterprise" : "/dashboard/pro");
    }, 3000);

  };

  return (
    <DashboardShell title="Upgrade Plan">
      <div className="mb-8 text-center">
        <h2 className="font-display font-bold text-2xl text-foreground">Choose Your Plan</h2>
        <p className="text-muted-foreground text-sm mt-2">Unlock powerful features to grow your agricultural business</p>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan, i) => {
          const isCurrent = plan.id === role;
          const isPro = plan.variant === "pro";
          const isEnterprise = plan.variant === "enterprise";

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-[2rem] p-6 flex flex-col relative ${
                isPro
                  ? "glass-obsidian glow-gold"
                  : isEnterprise
                  ? "glass-steel border-steel-500/20"
                  : "bento-card"
              }`}
            >
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-gradient text-foreground text-[10px] font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isPro ? "bg-gold-500/20" : isEnterprise ? "bg-steel-500/20" : "bg-primary/10"
                }`}>
                  <plan.icon className={`w-5 h-5 ${
                    isPro ? "text-gold-500" : isEnterprise ? "text-steel-400" : "text-primary"
                  }`} />
                </div>
                <div>
                  <h3 className={`font-display font-bold text-sm ${isPro ? "text-gold-400" : "text-foreground"}`}>{plan.name}</h3>
                  <p className="text-[10px] text-muted-foreground">{plan.description}</p>
                </div>
              </div>

              <div className="mb-4">
                <span className={`text-3xl font-display font-bold ${isPro ? "text-gradient-gold" : "text-foreground"}`}>{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>

              <div className="flex-1 space-y-2 mb-6">
                {plan.features.map(f => (
                  <div key={f} className="flex items-start gap-2">
                    <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isPro ? "text-gold-500" : "text-primary"}`} />
                    <span className="text-xs text-muted-foreground">{f}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrent || upgrading !== null}
                className={`w-full rounded-xl ${
                  isCurrent
                    ? "bg-muted text-muted-foreground cursor-default"
                    : isPro
                    ? "bg-gold-gradient text-foreground glow-gold"
                    : isEnterprise
                    ? "bg-steel-gradient text-primary-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {isCurrent ? "Current Plan" : upgrading === plan.id ? "Processing..." : `Upgrade to ${plan.name}`}
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* Why PRO section */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-12 max-w-4xl mx-auto">
        <h3 className="font-display font-bold text-lg text-foreground text-center mb-6">Why Go Pro?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: "AI Crop Advisor", desc: "Get personalized crop and profit recommendations powered by AI" },
            { title: "Disease Scanner", desc: "Instant AI diagnosis of crop diseases with 99.2% accuracy" },
            { title: "Smart Logistics", desc: "Automated delivery matching and route optimization" },
            { title: "Voice Commands", desc: "Interact using voice in Swahili and English" },
            { title: "Micro-Loans", desc: "Access financing based on your sales history" },
            { title: "Premium Analytics", desc: "Real-time sales, revenue, and market insights" },
          ].map((f, i) => (
            <div key={i} className="bento-card">
              <h4 className="font-display font-bold text-sm text-foreground mb-1">{f.title}</h4>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </DashboardShell>
  );
}
