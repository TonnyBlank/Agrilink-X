import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sprout } from "lucide-react";

const rotatingWords = ["timely", "flexible", "trusted", "practical"];

const cycleSteps = [
  {
    step: "01",
    title: "Trade Activity",
    description: "Sales, deliveries, and order consistency build the base trust signal.",
    desktopClass: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2",
    panelClass: "border-emerald-200 bg-emerald-50/90",
    badgeClass: "bg-emerald-600",
  },
  {
    step: "02",
    title: "Trust Score",
    description: "Platform behavior and repayment history improve financing visibility.",
    desktopClass: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2",
    panelClass: "border-cyan-200 bg-cyan-50/90",
    badgeClass: "bg-cyan-600",
  },
  {
    step: "03",
    title: "Loan Access",
    description: "Farmer Pro starts at KES 10K-30K while Buyer Enterprise ranges from KES 10K up to KES 500K.",
    desktopClass: "left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2",
    panelClass: "border-amber-200 bg-amber-50/90",
    badgeClass: "bg-amber-500",
  },
  {
    step: "04",
    title: "Growth Cycle",
    description: "Successful repayment and platform use open room for stronger financing over time.",
    desktopClass: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2",
    panelClass: "border-violet-200 bg-violet-50/90",
    badgeClass: "bg-violet-600",
  },
];

export default function MicroLoansSection() {
  const [activeWord, setActiveWord] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveWord((current) => (current + 1) % rotatingWords.length);
    }, 1800);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section id="micro-loans" className="bg-muted/50 py-24 md:py-32">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-4xl text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-widest text-accent">
            Micro Loans
          </span>
          <h2 className="mt-3 text-3xl font-display font-bold text-foreground md:text-5xl">
            Fast farm financing that stays{" "}
            <span className="relative inline-flex min-w-[8ch] justify-center text-gradient-gold">
              <AnimatePresence mode="wait">
                <motion.span
                  key={rotatingWords[activeWord]}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                >
                  {rotatingWords[activeWord]}
                </motion.span>
              </AnimatePresence>
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            AgriLink X connects marketplace trust, delivery history, and repayment behavior to create financing
            access that fits real trade activity. Farmers and buyers get clearer loan pathways based on how they
            use the platform.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
              Platform Logic
            </p>
            <h3 className="mt-2 text-2xl font-display font-bold text-foreground md:text-4xl">
              Financing moves in a cycle
            </h3>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-muted-foreground">
              Loan access is not random. It grows from real marketplace activity, trusted repayments, and successful
              platform use. That is why Farmer Pro starts with <span className="font-semibold text-foreground">KES 10K-30K</span>,
              while Buyer Enterprise begins from <span className="font-semibold text-foreground">KES 10K</span> and can scale
              up to <span className="font-semibold text-foreground">KES 500K</span> with verified business activity.
            </p>
          </div>

          <div className="mt-32 hidden lg:block">
            <div className="relative mx-auto h-[34rem] w-[34rem]">
              <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_180deg,_rgba(34,197,94,0.18),_rgba(14,165,233,0.16),_rgba(34,197,94,0.18))]" />
              <div className="absolute inset-10 rounded-full border border-border/40 bg-background/80" />
              <div className="absolute inset-[6.5rem] flex items-center justify-center rounded-full text-center">
                <div className="max-w-[14rem]">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                    Micro Loan Cycle
                  </p>
                  <h4 className="mt-3 text-3xl font-display font-bold text-foreground">
                    Trust builds access
                  </h4>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    Better activity leads to better financing, and better financing supports the next growth cycle.
                  </p>
                </div>
              </div>

              {cycleSteps.map((step) => (
                <div key={step.step} className={`absolute z-0 w-52 ${step.desktopClass}`}>
                  <div className={`rounded-3xl border p-4 text-center shadow-elevated backdrop-blur-sm ${step.panelClass}`}>
                    <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-primary-foreground shadow-elevated ${step.badgeClass}`}>
                      {step.step}
                    </div>
                    <h5 className="mt-4 text-lg font-display font-semibold text-foreground">{step.title}</h5>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-4 lg:hidden">
            {cycleSteps.map((step) => (
              <div key={step.step} className={`rounded-2xl border p-4 ${step.panelClass}`}>
                <div className="flex items-center gap-4">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-primary-foreground ${step.badgeClass}`}>
                    {step.step}
                  </div>
                  <h5 className="text-lg font-display font-semibold text-foreground">{step.title}</h5>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
