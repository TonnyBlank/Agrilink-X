import { motion } from "framer-motion";
import farmerImg from "@/assets/farmer-tablet.png";

const insights = [
  { crop: "Tomatoes", trend: "+23%", demand: "High", price: "KES 85/kg" },
  { crop: "Maize", trend: "+8%", demand: "Moderate", price: "KES 42/kg" },
  { crop: "Avocados", trend: "+45%", demand: "Very High", price: "KES 120/kg" },
  { crop: "Onions", trend: "-5%", demand: "Low", price: "KES 55/kg" },
];

export default function IntelligenceSection() {
  return (
    <section id="intelligence" className="py-24 md:py-32 bg-background overflow-hidden">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-sm font-semibold tracking-widest uppercase text-accent">
              Market Intelligence
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 mb-6 text-foreground">
              Data-Driven Decisions,{" "}
              <span className="text-gradient-gold">Bigger Profits</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Real-time market data, AI crop recommendations, and price forecasting
              — all in one dashboard. Know exactly what to grow, when to sell, and at what price.
            </p>

            <div className="rounded-2xl border border-border overflow-hidden bg-card">
              <div className="p-4 border-b border-border bg-muted/50">
                <span className="text-sm font-semibold text-foreground">Live Market Trends</span>
                <span className="ml-2 text-xs text-muted-foreground">Updated 5 min ago</span>
              </div>
              <div className="divide-y divide-border">
                {insights.map((item) => (
                  <div key={item.crop} className="flex items-center justify-between p-4">
                    <span className="font-medium text-foreground text-sm">{item.crop}</span>
                    <span
                      className={`text-sm font-semibold ${
                        item.trend.startsWith("+") ? "text-primary" : "text-destructive"
                      }`}
                    >
                      {item.trend}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {item.demand}
                    </span>
                    <span className="text-sm font-mono text-muted-foreground">{item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative flex justify-center"
          >
            <div className="relative">
              <div className="absolute -inset-8 rounded-full bg-primary/5 blur-3xl" />
              <img
                src={farmerImg}
                alt="Farmer using AgriLink X on a tablet"
                className="relative w-full max-w-[400px] md:max-w-[480px] drop-shadow-2xl animate-float"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
