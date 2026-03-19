import { motion } from "framer-motion";
import { UserPlus, Search, Handshake, Banknote } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Sign Up in 60 Seconds",
    description: "Farmer or buyer — verify with your ID and phone number. Get instant access.",
  },
  {
    icon: Search,
    step: "02",
    title: "Discover & Connect",
    description: "Browse AI-curated listings or post what you need. Our algorithm matches supply to demand.",
  },
  {
    icon: Handshake,
    step: "03",
    title: "Secure the Deal",
    description: "Smart escrow holds payment via M-Pesa. Both parties protected until delivery confirmation.",
  },
  {
    icon: Banknote,
    step: "04",
    title: "Get Paid Instantly",
    description: "Delivery confirmed? Funds released immediately to farmer's M-Pesa. No middlemen, no delays.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-muted/50">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold tracking-widest uppercase text-accent">
            Simple Process
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 mb-4 text-foreground">
            From Farm to Market in <span className="text-gradient-gold">4 Steps</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative text-center"
            >
              <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-6 relative">
                <s.icon className="w-8 h-8 text-primary" />
                <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
                  {s.step}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-px bg-border" />
              )}
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                {s.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                {s.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
