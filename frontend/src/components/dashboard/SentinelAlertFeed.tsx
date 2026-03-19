import { motion } from "framer-motion";
import { AlertTriangle, Droplets, TrendingUp, Bug, Sun } from "lucide-react";

const alerts = [
  { id: 1, icon: Droplets, text: "Soil moisture dropped below 30% in Field B", time: "2m ago", severity: "warning" },
  { id: 2, icon: TrendingUp, text: "Tomato prices up 18% in Nairobi market", time: "15m ago", severity: "info" },
  { id: 3, icon: Bug, text: "Possible aphid detection on maize crops", time: "1h ago", severity: "critical" },
  { id: 4, icon: Sun, text: "Heat wave alert: 34°C expected tomorrow", time: "2h ago", severity: "warning" },
  { id: 5, icon: TrendingUp, text: "New buyer request: 500kg onions, Mombasa", time: "3h ago", severity: "info" },
];

const severityColors: Record<string, string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  warning: "bg-gold-500/10 text-gold-600 border-gold-500/20",
  info: "bg-primary/10 text-primary border-primary/20",
};

export default function SentinelAlertFeed() {
  return (
    <div className="bento-card col-span-full lg:col-span-1">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-primary sensor-pulse" />
        <h3 className="font-display font-bold text-foreground text-sm">Sentinel Live</h3>
      </div>
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {alerts.map((alert, i) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex items-start gap-3 p-3 rounded-xl border text-xs ${severityColors[alert.severity]}`}
          >
            <alert.icon className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium leading-snug">{alert.text}</p>
              <p className="opacity-60 mt-1">{alert.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
