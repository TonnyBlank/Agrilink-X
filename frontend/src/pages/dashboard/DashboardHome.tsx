import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CalendarDays,
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
import { useOrders } from "@/hooks/useOrders";
import { useMyProducts } from "@/hooks/useProducts";
import { Link } from "react-router-dom";
import maizeImage from "@/assets/maize.jpg";

const revenueCardLabel = "Revenue This Week";

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
  {
    crop: "Tomatoes",
    trend: "Hot demand",
    detail: "Urban buyers are paying 14% above last week.",
    image:
      "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=900&q=80",
  },
  {
    crop: "Maize",
    trend: "Stable",
    detail: "Hold inventory and watch western counties for movement.",
    image: maizeImage,
  },
  {
    crop: "Onions",
    trend: "Opportunity",
    detail: "Regional supply is tightening ahead of next market day.",
    image:
      "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=900&q=80",
  },
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
  const { sellingOrders, buyingOrders, loading: ordersLoading } = useOrders();
  const { products, loading: productsLoading } = useMyProducts();
  const planLabel = role === "farmer_pro" ? "Farmer Pro" : role === "buyer_enterprise" ? "Enterprise" : "Farmer Free";
  const rawDisplayName =
    profile?.full_name ||
    (typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ||
    "Farmer";
  const welcomeName = rawDisplayName.split(" ")[0];

  const dashboardMetrics = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(now.getDate() - 7);

    const previousWeekStart = new Date(weekStart);
    previousWeekStart.setDate(weekStart.getDate() - 7);

    const revenueStatuses = new Set(["confirmed", "processing", "shipped", "delivered"]);
    const pendingStatuses = new Set(["pending", "confirmed", "processing"]);

    const currentWeekRevenue = sellingOrders
      .filter((order) => revenueStatuses.has(order.status) && new Date(order.created_at) >= weekStart)
      .reduce((sum, order) => sum + order.total_price, 0);

    const previousWeekRevenue = sellingOrders
      .filter((order) => {
        const createdAt = new Date(order.created_at);
        return revenueStatuses.has(order.status) && createdAt >= previousWeekStart && createdAt < weekStart;
      })
      .reduce((sum, order) => sum + order.total_price, 0);

    const pendingOrders = sellingOrders.filter((order) => pendingStatuses.has(order.status)).length;
    const previousPendingOrders = buyingOrders.filter((order) => pendingStatuses.has(order.status)).length;
    const activeListings = products.filter((product) => product.is_available).length;
    const listingsWithVideo = products.filter((product) => product.video_url).length;

    let recommendationCount = 0;
    if (profile?.county) recommendationCount += 1;
    if (profile?.main_crops?.length) recommendationCount += 1;
    if (products.length) recommendationCount += 1;
    if (weather.loading === false && location) recommendationCount += 1;
    if (pendingOrders > 0) recommendationCount += 1;

    const revenueDelta =
      previousWeekRevenue > 0
        ? `${currentWeekRevenue >= previousWeekRevenue ? "+" : ""}${Math.round(((currentWeekRevenue - previousWeekRevenue) / previousWeekRevenue) * 100)}%`
        : currentWeekRevenue > 0
          ? "New"
          : "";

    return {
      currentWeekRevenue,
      revenueDelta,
      activeListings,
      listingsWithVideo,
      pendingOrders,
      previousPendingOrders,
      recommendationCount,
    };
  }, [buyingOrders, location, products, profile?.county, profile?.main_crops, sellingOrders, weather.loading]);

  const kpis = [
    {
      label: "Revenue This Week",
      value: ordersLoading
        ? "Loading..."
        : new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(
            dashboardMetrics.currentWeekRevenue,
          ),
      delta: dashboardMetrics.revenueDelta,
      icon: TrendingUp,
      positive: true,
    },
    {
      label: "Active Listings",
      value: productsLoading ? "Loading..." : String(dashboardMetrics.activeListings),
      delta: productsLoading ? "" : `+${dashboardMetrics.listingsWithVideo}`,
      icon: Package,
      positive: true,
    },
    {
      label: "Pending Orders",
      value: ordersLoading ? "Loading..." : String(dashboardMetrics.pendingOrders),
      delta: dashboardMetrics.previousPendingOrders ? `${dashboardMetrics.previousPendingOrders} buying` : "",
      icon: ShoppingCart,
      positive: true,
    },
    {
      label: "AI Recommendations",
      value: String(dashboardMetrics.recommendationCount),
      delta: dashboardMetrics.recommendationCount ? "Live" : "Setup",
      icon: Zap,
      positive: true,
    },
  ];

  const sensorCards = [
    {
      label: "County",
      value: profile?.county || "Not set",
      unit: "",
      icon: <MapPin className="h-4 w-4 text-emerald-700" />,
      iconTone: "bg-emerald-100",
      lineColor: "#22c55e",
      path: "M8 20 C24 16, 40 18, 56 17 S88 20, 112 18",
    },
    {
      label: "Temperature",
      value: weather.loading ? "--" : weather.temperature.toFixed(1),
      unit: "°C",
      icon: <Thermometer className="h-4 w-4 text-rose-500" />,
      iconTone: "bg-rose-50",
      lineColor: "#ef4444",
      path: "M8 20 C24 21, 38 19, 56 20 S88 22, 112 20",
    },
    {
      label: "Humidity",
      value: weather.loading ? "--" : weather.humidity.toFixed(1),
      unit: "%",
      icon: <Wind className="h-4 w-4 text-slate-500" />,
      iconTone: "bg-slate-100",
      lineColor: "#64748b",
      path: "M8 19 C24 19, 42 20, 60 19 S88 20, 112 19",
    },
  ];

  return (
    <DashboardShell title="Dashboard">
      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-primary/15 bg-[radial-gradient(circle_at_top_left,_hsl(var(--primary)/0.18),_transparent_40%),linear-gradient(135deg,_hsl(var(--background)),_hsl(var(--primary)/0.06))] p-6 shadow-card"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                {planLabel}
              </span>
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Karibu, {welcomeName}</h2>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  Your farm operations, market signals, and buyer activity are all in one place so you can act faster every day.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {kpis.map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-[1.75rem] p-5 shadow-sm ${
                  kpi.label === revenueCardLabel
                    ? "border border-emerald-300/70 bg-[radial-gradient(circle_at_top_left,_rgb(52_211_153_/_0.42),_transparent_42%),linear-gradient(145deg,_rgb(240_253_244),_rgb(209_250_229))] shadow-[0_22px_44px_-26px_rgb(22_163_74_/_0.9)] dark:border-emerald-500/30 dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.2),_transparent_40%),linear-gradient(145deg,_rgba(15,23,42,0.92),_rgba(17,24,39,0.98))] dark:shadow-[0_22px_44px_-26px_rgba(16,185,129,0.35)]"
                    : "border border-border/70 bg-background/80"
                }`}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      kpi.label === revenueCardLabel
                        ? "bg-emerald-500/20 ring-1 ring-emerald-400/50 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.55)] dark:bg-emerald-500/15 dark:ring-emerald-500/30 dark:shadow-none"
                        : "bg-primary/10"
                    }`}
                  >
                    <kpi.icon className={`h-5 w-5 ${kpi.label === revenueCardLabel ? "text-emerald-700 dark:text-emerald-300" : "text-primary"}`} />
                  </div>
                </div>
                <p className={`text-xs font-medium ${kpi.label === revenueCardLabel ? "text-emerald-800/80 dark:text-emerald-200/80" : "text-muted-foreground"}`}>
                  {kpi.label}
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className={`font-display text-xl font-bold ${kpi.label === revenueCardLabel ? "text-emerald-800 dark:text-emerald-100" : "text-foreground"}`}>
                    {kpi.value}
                  </span>
                  {kpi.delta && (
                    <span
                      className={`text-xs font-semibold ${
                        kpi.positive ? (kpi.label === revenueCardLabel ? "text-emerald-700" : "text-primary") : "text-destructive"
                      }`}
                    >
                      {kpi.delta}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.aside
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bento-card"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Quick Actions</p>
              <h3 className="mt-1 font-display text-lg font-bold text-foreground">Keep the day moving</h3>
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

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bento-card"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Market Watch</p>
              <h3 className="mt-1 font-display text-lg font-bold text-foreground">What needs attention now</h3>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to="/dashboard/marketplace">Open marketplace</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {marketSignals.map((signal) => (
              <div key={signal.crop} className="group overflow-hidden rounded-[1.75rem] border border-border bg-background/80 shadow-sm">
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={signal.image}
                    alt={signal.crop}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                  <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 backdrop-blur dark:bg-background/80 dark:text-emerald-300">
                    {signal.trend}
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="font-display text-2xl font-bold text-white">{signal.crop}</p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">{signal.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="space-y-3">
          {sensorCards.map((card) => (
              <div
              key={card.label}
              className="flex items-center gap-3 rounded-[1.5rem] border border-border/70 bg-white/90 px-4 py-3.5 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.2)] dark:bg-card/90 dark:shadow-[0_16px_32px_-24px_rgba(0,0,0,0.55)]"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.iconTone}`}>{card.icon}</div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{card.label}</p>
                <p className="font-display text-2xl font-bold leading-none text-foreground">
                  {card.value}
                  {card.unit ? <span className="font-display ml-1 text-lg text-muted-foreground">{card.unit}</span> : null}
                </p>
              </div>
              <svg width="110" height="30" viewBox="0 0 120 36" className="hidden shrink-0 sm:block">
                <path d={card.path} fill="none" stroke={card.lineColor} strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
          ))}
        </motion.section>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bento-card glass-emerald"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-foreground">AI Intelligence</h3>
            <p className="text-xs text-muted-foreground">Powered by AgriLink AI</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
