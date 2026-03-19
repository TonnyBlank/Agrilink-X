import { motion } from "framer-motion";
import {
  Brain,
  TrendingUp,
  Shield,
  Truck,
  BarChart3,
  Camera,
  CreditCard,
  Wifi,
  Mic,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Farming Brain",
    description: "Know what to plant, when to plant, and your expected profit — powered by weather, demand, and price data.",
    tag: "Game Changer",
  },
  {
    icon: TrendingUp,
    title: "Future Market",
    description: "Buyers post demand in advance. Farmers grow for guaranteed markets. Contract farming, reimagined.",
    tag: "Contract 2.0",
  },
  {
    icon: Shield,
    title: "Smart Escrow",
    description: "M-Pesa powered escrow holds funds securely until delivery is confirmed. Trust built into every deal.",
    tag: "M-Pesa",
  },
  {
    icon: Truck,
    title: "Integrated Logistics",
    description: "Like Uber for farm produce. Auto-matched drivers, optimized routes, and live tracking.",
    tag: "Logistics",
  },
  {
    icon: BarChart3,
    title: "Market Intelligence",
    description: "Real-time price trends, demand spikes, and crop analytics. Become a data-driven entrepreneur.",
    tag: "Live Data",
  },
  {
    icon: Camera,
    title: "AI Quality Scanner",
    description: "Upload a photo, get instant grading. AI detects defects and suggests the right price.",
    tag: "Computer Vision",
  },
  {
    icon: CreditCard,
    title: "Farmer Credit Score",
    description: "Build credit through sales history and reliability. Unlock microloans, seeds, and fertilizer.",
    tag: "Financing",
  },
  {
    icon: Wifi,
    title: "Offline-First",
    description: "Works without internet and syncs when back online. Critical for rural Africa.",
    tag: "No Internet? No Problem",
  },
  {
    icon: Mic,
    title: "Voice Interface",
    description: "Speak in Swahili or English. Voice commands for listing, pricing, and selling.",
    tag: "Swahili Ready",
  },
  {
    icon: Users,
    title: "Community Hub",
    description: "Share tips, post updates, and learn from other farmers. Build relationships that grow.",
    tag: "Social",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 md:py-32 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold tracking-widest uppercase text-accent">
            Revolutionary Features
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 mb-4 text-foreground">
            10 Features That Change <span className="text-gradient-gold">Everything</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Not just a marketplace — an entire ecosystem that makes African agriculture
            intelligent, profitable, and connected.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={item}
              className="group relative p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-elevated transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-accent/15 text-accent mb-3">
                {f.tag}
              </span>
              <h3 className="font-display font-semibold text-foreground mb-2 text-sm">
                {f.title}
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {f.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
