import { motion } from "framer-motion";
import {
  Brain,
  TrendingUp,
  Shield,
  Truck,
  Camera,
  CreditCard,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Farming Brain",
    description: "Know what to plant, when to plant, and your expected profit - powered by weather, demand, and price data.",
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
    <section id="features" className="bg-background py-24 md:py-32">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-widest text-accent">
            Revolutionary Features
          </span>
          <h2 className="mt-3 mb-4 text-3xl font-display font-bold text-foreground md:text-5xl">
            7 Features That Change <span className="text-gradient-gold">Everything</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Not just a marketplace for crops and trade, but an ecosystem that makes Kenyan agriculture
            intelligent, profitable, and connected.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="group relative rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-elevated"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <span className="mb-3 inline-block rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                {feature.tag}
              </span>
              <h3 className="mb-2 text-sm font-display font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
