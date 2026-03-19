import { useAuth } from "@/hooks/useAuth";
import DashboardShell from "@/components/dashboard/DashboardShell";
import SensorSparkline from "@/components/dashboard/SensorSparkline";
import SentinelAlertFeed from "@/components/dashboard/SentinelAlertFeed";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CalendarDays,
  Droplets,
  MapPin,
  MessageSquare,
  Package,
  ScanLine,
  ShoppingCart,
  Thermometer,
  TrendingUp,
  Wind,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { useWeather } from "@/hooks/useWeather";
import { Link } from "react-router-dom";

const kpis = [
  { label: "Revenue This Week", value: "KES 45,200", delta: "+12%", icon: TrendingUp, positive: true },
  { label: "Active Listings", value: "8", delta: "+2", icon: Package, positive: true },
  { label: "Pending Orders", value: "3", delta: "", icon: ShoppingCart, positive: true },
  { label: "AI Recommendations", value: "5", delta: "New", icon: Zap, positive: true },
];

const quickActions = [
  {
    title: "Add New Listing",
    description: "Publish fresh produce and update pricing for buyers.",
    href: "/dashboard/products",
    icon: Package,
  },
  {
    title: "Scan Crop Health",
    description: "Run a field check and review AI crop diagnostics.",
    href: "/dashboard/ai-scanner",
    icon: ScanLine,
  },
  {
    title: "Plan This Week",
    description: "Review planting dates, weather windows, and reminders.",
    href: "/dashboard/calendar",
    icon: CalendarDays,
  },
  {
    title: "Reply to Buyers",
    description: "Keep orders moving with fast message follow-up.",
    href: "/dashboard/messages",
    icon: MessageSquare,
  },
];

const marketSignals = [
  { crop: "Tomatoes", trend: "Hot demand", detail: "Urban buyers are paying 14% above last week." },
  { crop: "Maize", trend: "Stable", detail: "Hold inventory and watch western counties for movement." },
  { crop: "Onions", trend: "Opportunity", detail: "Regional supply is tightening ahead of next market day." },
];

const weatherCodeDesc = (code: number): string => {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 9) return "Foggy";
  if (code <= 19) return "Drizzle";
  if (code <= 29) return "Precipitation";
  if (code <= 39) return "Thunderstorm";
  if (code <= 49) return "Blowing snow";
  if (code <= 59) return "Rain";
  if (code <= 69) return "Snow";
  if (code <= 79) return "Sleet";
  if (code <= 84) return "Rain showers";
  if (code <= 94) return "Thundershower";
  return "Thunderstorm with hail";
};

export default function DashboardHome() {
  const { profile, role, user } = useAuth();
  const location = profile?.county || null;
  const weather = useWeather(location);
  const planLabel = role === "farmer_pro" ? "Farmer Pro" : role === "buyer_enterprise" ? "Enterprise" : "Farmer Free";
  const rawDisplayName =
    profile?.full_name ||
    (typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ||
    "Farmer";
  const welcomeName = rawDisplayName.split(" ")[0];

  return (
    <DashboardShell title="Dashboard">
      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.9fr] gap-4 mb-6">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-primary/15 bg-[radial-gradient(circle_at_top_left,_hsl(var(--primary)/0.18),_transparent_40%),linear-gradient(135deg,_hsl(var(--background)),_hsl(var(--primary)/0.06))] p-6 shadow-card"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3 max-w-2xl">
              <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                {planLabel}
              </span>
              <div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                  Karibu, {welcomeName}
                </h2>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  Your farm operations, market signals, and buyer activity are all in one place so you can act faster every day.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 min-w-[220px]">
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Field Status</p>
                <p className="mt-2 text-lg font-display font-bold text-foreground">Healthy</p>
                <p className="text-xs text-primary">Sensors reporting normally</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Buyer Activity</p>
                <p className="mt-2 text-lg font-display font-bold text-foreground">9 chats</p>
                <p className="text-xs text-primary">3 need a reply today</p>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.aside
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bento-card"
        >
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Quick Actions</p>
              <h3 className="mt-1 text-lg font-display font-bold text-foreground">Keep the day moving</h3>
            </div>
          </div>
          <div className="space-y-3">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.href}
                className="flex items-center gap-3 rounded-2xl border border-border bg-background/70 p-3 transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                  <action.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </motion.aside>
      </div>

      {location && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bento-card mb-6 flex flex-col gap-4 border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-primary/5 sm:flex-row sm:items-center"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500/15 text-xs font-semibold text-sky-700">
              {weather.loading ? "..." : weatherCodeDesc(weather.weathercode).slice(0, 3).toUpperCase()}
            </div>
            <div>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {weather.loading ? "Fetching weather..." : weather.locationName}
              </p>
              <p className="text-lg font-display font-bold text-foreground">
                {weather.loading ? "--" : `${weather.temperature}°C`}
                {!weather.loading && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {weatherCodeDesc(weather.weathercode)}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-6 text-sm sm:ml-auto">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Humidity</p>
              <p className="font-display font-bold text-foreground">{weather.loading ? "--" : `${weather.humidity}%`}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Wind</p>
              <p className="font-display font-bold text-foreground">{weather.loading ? "--" : `${weather.windspeed} km/h`}</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SensorSparkline
          label="Soil Moisture"
          unit="%"
          icon={<Droplets className="w-5 h-5 text-primary" />}
          color="152 60% 36%"
          min={15}
          max={85}
          baseValue={42}
          variance={5}
        />
        <SensorSparkline
          label="Temperature"
          unit="°C"
          icon={<Thermometer className="w-5 h-5 text-destructive" />}
          color="0 84% 60%"
          min={10}
          max={45}
          baseValue={weather.loading ? 28 : weather.temperature}
          variance={1}
        />
        <SensorSparkline
          label="Humidity"
          unit="%"
          icon={<Wind className="w-5 h-5 text-steel-500" />}
          color="215 25% 45%"
          min={20}
          max={95}
          baseValue={weather.loading ? 65 : weather.humidity}
          variance={2}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bento-card"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <kpi.icon className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-display font-bold text-foreground">{kpi.value}</span>
                {kpi.delta && (
                  <span className={`text-xs font-semibold ${kpi.positive ? "text-primary" : "text-destructive"}`}>
                    {kpi.delta}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
        <SentinelAlertFeed />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4 mb-6">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bento-card"
        >
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Market Watch</p>
              <h3 className="mt-1 text-lg font-display font-bold text-foreground">What needs attention now</h3>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to="/dashboard/marketplace">Open marketplace</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {marketSignals.map((signal) => (
              <div key={signal.crop} className="rounded-2xl border border-border bg-background/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{signal.trend}</p>
                <p className="mt-2 text-lg font-display font-bold text-foreground">{signal.crop}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{signal.detail}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bento-card"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Today</p>
          <h3 className="mt-1 text-lg font-display font-bold text-foreground">Priority checklist</h3>
          <div className="mt-4 space-y-3">
            {[
              "Confirm harvest quantities for tomorrow's pickup.",
              "Reply to three buyers asking for tomato volume and pricing.",
              "Review irrigation timing before the evening weather shift.",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-border bg-background/70 p-3">
                <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-primary" />
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </motion.section>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bento-card glass-emerald"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-foreground text-sm">AI Intelligence</h3>
            <p className="text-xs text-muted-foreground">Powered by AgriLink AI</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { title: "Crop Recommendation", desc: "Plant sukuma wiki. Demand in Nairobi is expected to rise by 23% next month." },
            { title: "Price Alert", desc: "Sell tomatoes now. Current price KES 80/kg is 15% above the 30-day average." },
            {
              title: "Weather Advisory",
              desc:
                location && !weather.loading
                  ? `Current conditions in ${weather.locationName}: ${weather.temperature}°C, ${weatherCodeDesc(weather.weathercode)}. Plan your farm activities accordingly.`
                  : "Set your county in My Farm to get personalized weather advisories.",
            },
          ].map((tip) => (
            <div key={tip.title} className="rounded-xl border border-border bg-background/60 p-4">
              <p className="mb-1 text-xs font-semibold text-primary">{tip.title}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{tip.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </DashboardShell>
  );
}
