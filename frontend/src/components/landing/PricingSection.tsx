import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Farmer Free",
    tagline: "Start Small, Grow Smart",
    price: "Free",
    subtitle: "Forever free",
    features: [
      { text: "Basic farm profile & up to 5 listings/month", included: true },
      { text: "AI-driven price guidance", included: true },
      { text: "Community tips & market alerts", included: true },
      { text: "Limited buyer chat (10 messages/month)", included: true },
      { text: "Offline mode — sync when back online", included: true },
      { text: "M-Pesa escrow payments", included: true },
      { text: "AI Crop Advisor", included: false },
      { text: "Smart logistics", included: false },
      { text: "Micro-loans & credit scoring", included: false },
    ],
    cta: "Start Free",
    featured: false,
  },
  {
    name: "Farmer Pro",
    tagline: "Scale Your Farm, Maximize Profits",
    price: "$12",
    subtitle: "/month",
    features: [
      { text: "Unlimited product listings", included: true },
      { text: "AI Crop & Profit Advisor dashboard", included: true },
      { text: "Predict demand & optimize planting", included: true },
      { text: "Priority in buyer search results", included: true },
      { text: "Smart logistics — automated delivery", included: true },
      { text: "Real-time sales analytics & reports", included: true },
      { text: "Voice-assisted interface (Swahili)", included: true },
      { text: "Micro-loans & credit scoring", included: true },
      { text: "Contract farming (Future Market)", included: true },
    ],
    cta: "Go Pro",
    featured: true,
  },
  {
    name: "Buyer Enterprise",
    tagline: "Secure, Predictable Supply",
    price: "$75",
    subtitle: "/month",
    features: [
      { text: "Search farmers by crop, location, quality", included: true },
      { text: "Contract farming — advance orders", included: true },
      { text: "Bulk order management & coordination", included: true },
      { text: "Predictive AI supply & demand dashboard", included: true },
      { text: "Featured farmer listings (priority match)", included: true },
      { text: "Automated M-Pesa escrow system", included: true },
      { text: "Export reports & cost projections", included: true },
      { text: "Verified farmers access only", included: true },
      { text: "Dedicated account manager", included: true },
    ],
    cta: "Contact Sales",
    featured: false,
  },
];

export default function PricingSection() {
  const { role, user } = useAuth();

  return (
    <section id="pricing" className="py-24 md:py-32 bg-muted/50">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold tracking-widest uppercase text-accent">
            Pricing
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 mb-4 text-foreground">
            Simple, <span className="text-gradient-gold">Fair Pricing</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Free for farmers to start. Only pay when you grow.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => {
            let ctaText = plan.cta;
            let ctaLink = user ? "/dashboard" : "/signup";
            let isDisabled = false;

            if (plan.name === "Farmer Free") {
              if (role === "farmer_free") {
                ctaText = "Current Plan";
                ctaLink = "/dashboard/free";
                isDisabled = true;
              } else if (user) {
                ctaText = "Open Dashboard";
                ctaLink = "/dashboard";
              }
            }

            if (plan.name === "Farmer Pro") {
              if (!user) {
                ctaLink = "/signup";
              } else if (role === "farmer_pro") {
                ctaText = "Current Plan";
                ctaLink = "/dashboard/pro";
                isDisabled = true;
              } else {
                ctaText = "Upgrade to Pro";
                ctaLink = "/dashboard/upgrade";
              }
            }

            if (plan.name === "Buyer Enterprise") {
              if (!user) {
                ctaLink = "/signup";
              } else if (role === "buyer_enterprise") {
                ctaText = "Current Plan";
                ctaLink = "/dashboard/enterprise";
                isDisabled = true;
              } else {
                ctaText = "Upgrade Plan";
                ctaLink = "/dashboard/upgrade";
              }
            }

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                id={plan.name === "Buyer Enterprise" ? "buyer-enterprise" : undefined}
                className={`relative rounded-2xl p-8 flex flex-col ${
                  plan.featured
                    ? "bg-primary text-primary-foreground shadow-glow border-2 border-primary md:scale-105"
                    : "bg-card border border-border"
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gold-gradient text-foreground text-xs font-bold">
                    Most Popular
                  </span>
                )}
                <h3 className="font-display font-bold text-lg">{plan.name}</h3>
                <p className={`text-xs mt-1 ${plan.featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {plan.tagline}
                </p>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-display font-bold">{plan.price}</span>
                  <span className={`text-sm ml-1 ${plan.featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {plan.subtitle}
                  </span>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-start gap-2 text-sm">
                      {f.included ? (
                        <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.featured ? "text-agri-gold-400" : "text-primary"}`} />
                      ) : (
                        <X className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground/40" />
                      )}
                      <span className={
                        f.included
                          ? plan.featured ? "text-primary-foreground/90" : "text-foreground"
                          : "text-muted-foreground/50 line-through"
                      }>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full h-12 font-semibold ${
                    plan.featured
                      ? "bg-gold-gradient text-foreground hover:opacity-90"
                      : ""
                  }`}
                  variant={plan.featured ? "default" : "outline"}
                  disabled={isDisabled}
                  asChild={!isDisabled}
                >
                  {isDisabled ? <span>{ctaText}</span> : <Link to={ctaLink}>{ctaText}</Link>}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

