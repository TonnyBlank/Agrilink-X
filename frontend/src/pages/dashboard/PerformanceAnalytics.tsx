import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { useAuth } from "@/hooks/useAuth";
import { useOrders } from "@/hooks/useOrders";
import { useMyProducts } from "@/hooks/useProducts";

const COLORS = [
  "hsl(152, 60%, 36%)",
  "hsl(42, 90%, 55%)",
  "hsl(215, 25%, 45%)",
  "hsl(0, 84%, 60%)",
  "hsl(188, 75%, 38%)",
  "hsl(268, 55%, 48%)",
];

const revenueStatuses = new Set(["confirmed", "processing", "shipped", "delivered"]);
const completedStatuses = new Set(["shipped", "delivered"]);

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - copy.getDay());
  return copy;
}

export default function PerformanceAnalytics() {
  const { profile } = useAuth();
  const { sellingOrders, loading: ordersLoading } = useOrders();
  const { products, loading: productsLoading } = useMyProducts();
  const loading = ordersLoading || productsLoading;

  const analytics = useMemo(() => {
    const revenueOrders = sellingOrders.filter((order) => revenueStatuses.has(order.status));
    const successfulOrders = sellingOrders.filter((order) => completedStatuses.has(order.status));
    const totalRevenue = revenueOrders.reduce((sum, order) => sum + order.total_price, 0);
    const ordersReceived = revenueOrders.length;
    const averageOrderValue = ordersReceived ? totalRevenue / ordersReceived : 0;

    const totalRatings = products.reduce((sum, product) => sum + (product.ratings_count || 0), 0);
    const weightedRatings = products.reduce(
      (sum, product) => sum + (product.average_rating || 0) * (product.ratings_count || 0),
      0,
    );
    const averageRating = totalRatings ? weightedRatings / totalRatings : 0;

    const now = new Date();
    const revenueByMonth = new Map<string, number>();
    const revenueData = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      revenueByMonth.set(key, 0);
      return {
        key,
        month: date.toLocaleDateString("en-KE", { month: "short" }),
        revenue: 0,
      };
    });

    revenueOrders.forEach((order) => {
      const orderDate = new Date(order.created_at);
      const monthStart = startOfMonth(orderDate);
      const key = `${monthStart.getFullYear()}-${monthStart.getMonth()}`;
      if (revenueByMonth.has(key)) {
        revenueByMonth.set(key, (revenueByMonth.get(key) || 0) + order.total_price);
      }
    });

    revenueData.forEach((entry) => {
      entry.revenue = revenueByMonth.get(entry.key) || 0;
    });

    const productRevenue = new Map<string, number>();
    revenueOrders.forEach((order) => {
      const name = order.product?.name || "Unnamed Product";
      productRevenue.set(name, (productRevenue.get(name) || 0) + order.total_price);
    });

    const productMix = Array.from(productRevenue.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const weekKeys = Array.from({ length: 4 }, (_, index) => {
      const start = startOfWeek(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (3 - index) * 7));
      return {
        key: start.toISOString(),
        label: `${start.toLocaleDateString("en-KE", { month: "short", day: "numeric" })}`,
        start,
        orders: 0,
      };
    });
    const weekMap = new Map(weekKeys.map((week) => [week.key, 0]));

    sellingOrders.forEach((order) => {
      const orderWeek = startOfWeek(new Date(order.created_at)).toISOString();
      if (weekMap.has(orderWeek)) {
        weekMap.set(orderWeek, (weekMap.get(orderWeek) || 0) + 1);
      }
    });

    weekKeys.forEach((week) => {
      week.orders = weekMap.get(week.key) || 0;
    });

    const profileSignals = [
      Boolean(profile?.county),
      Boolean(profile?.farm_size),
      Boolean(profile?.main_crops?.length),
      Boolean(profile?.bio),
    ];
    const profileScore = Math.round((profileSignals.filter(Boolean).length / profileSignals.length) * 100);

    return {
      totalRevenue,
      ordersReceived,
      successfulOrders: successfulOrders.length,
      averageOrderValue,
      averageRating,
      totalRatings,
      revenueData,
      productMix,
      orderVolume: weekKeys,
      totalListings: products.length,
      profileScore,
    };
  }, [products, profile, sellingOrders]);

  return (
    <DashboardShell title="Performance Analytics">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Revenue",
              value: formatCurrency(analytics.totalRevenue),
              detail: `${analytics.ordersReceived} revenue-generating orders`,
            },
            {
              label: "Orders Completed",
              value: String(analytics.successfulOrders),
              detail: `${sellingOrders.length} total selling orders`,
            },
            {
              label: "Avg. Order Value",
              value: analytics.ordersReceived ? formatCurrency(analytics.averageOrderValue) : "No sales yet",
              detail: "Based on confirmed, shipped, and delivered orders",
            },
            {
              label: "Customer Rating",
              value: analytics.totalRatings ? analytics.averageRating.toFixed(1) : "New",
              detail: analytics.totalRatings
                ? `${analytics.totalRatings} marketplace ratings`
                : `${analytics.totalListings} live listings, no ratings yet`,
            },
          ].map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bento-card"
            >
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <p className="mt-1 text-xl font-display font-bold text-foreground">{loading ? "Loading..." : metric.value}</p>
              <span className="text-xs text-primary font-semibold">{metric.detail}</span>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bento-card lg:col-span-2"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display font-bold text-foreground text-sm">Revenue Trend</h3>
                <p className="text-xs text-muted-foreground">Last 6 months from your real selling orders.</p>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-semibold text-muted-foreground">
                Profile readiness {analytics.profileScore}%
              </span>
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={analytics.revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(152, 60%, 36%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(152, 60%, 36%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(140, 10%, 90%)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(150, 10%, 45%)" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(150, 10%, 45%)" />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(152, 60%, 36%)" fill="url(#colorRevenue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bento-card"
          >
            <h3 className="font-display font-bold text-foreground text-sm mb-1">Top Products by Revenue</h3>
            <p className="text-xs text-muted-foreground">Share of earnings across your actual orders.</p>

            {analytics.productMix.length ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={analytics.productMix} innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                      {analytics.productMix.map((item, index) => (
                        <Cell key={item.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 flex flex-wrap gap-2">
                  {analytics.productMix.map((product, index) => (
                    <div key={product.name} className="flex items-center gap-1 text-[10px]">
                      <div className="h-2 w-2 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
                      <span className="text-muted-foreground">{product.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-center text-sm text-muted-foreground">
                Revenue mix will appear here after buyers start placing orders.
              </div>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bento-card"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-foreground text-sm">Weekly Order Volume</h3>
              <p className="text-xs text-muted-foreground">Last 4 weeks based on all incoming selling orders.</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              {analytics.totalListings} active listings
            </span>
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={analytics.orderVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(140, 10%, 90%)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(150, 10%, 45%)" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(150, 10%, 45%)" />
              <Tooltip formatter={(value: number) => `${value} orders`} />
              <Bar dataKey="orders" fill="hsl(152, 60%, 36%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </DashboardShell>
  );
}
