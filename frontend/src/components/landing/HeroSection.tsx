import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-farm.jpg";
import { Link } from "react-router-dom";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Smart farming landscape"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-hero-gradient opacity-85" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      <div className="container relative z-10 py-20 md:py-32">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="mb-4 inline-flex items-center gap-3 font-display text-2xl font-black tracking-tight text-black dark:text-white md:text-3xl">
              <span className="h-3 w-3 rounded-full bg-agri-gold-500 shadow-[0_0_16px_rgba(234,179,8,0.95)] animate-pulse" />
              Revolutionizing Kenyan Agriculture
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.1] tracking-tight mb-6"
          >
            <span className="text-primary-foreground">Farm Smarter.</span>
            <br />
            <span className="text-primary-foreground">Sell Direct.</span>
            <br />
            <span className="text-gradient-gold">Earn More.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-agri-green-200/80 max-w-xl mb-10 leading-relaxed"
          >
            AgriLink X connects farmers directly to buyers with AI-powered insights,
            smart escrow payments, and integrated logistics. Increase your profits by up to 70%.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button asChild size="lg" className="h-14 px-8 text-base font-semibold text-foreground shadow-[0_14px_28px_-18px_rgba(0,0,0,0.45)] transition-opacity hover:opacity-90 bg-gold-gradient">
              <Link to="/login">
                Join
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" className="h-14 px-8 text-base font-semibold text-white shadow-[0_14px_28px_-18px_rgba(0,0,0,0.45)] transition-colors hover:bg-[#0b4a24] bg-[#0f5c2e]">
              <a href="#buyer-enterprise">
                Micro Loan
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-12 flex flex-wrap items-center gap-6 sm:gap-8"
          >
            {[
              { value: "10K+", label: "Farmers Onboarded" },
              { value: "KES 2B+", label: "Transactions" },
              { value: "47", label: "Counties Covered" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl md:text-3xl font-display font-bold text-primary-foreground">
                  {stat.value}
                </div>
                <div className="text-sm text-agri-green-200/60">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
