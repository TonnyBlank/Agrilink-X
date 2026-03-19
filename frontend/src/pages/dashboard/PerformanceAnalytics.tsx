import DashboardShell from "@/components/dashboard/DashboardShell";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

const revenueData = [
  { month: "Jan", revenue: 12000 }, { month: "Feb", revenue: 18000 },
  { month: "Mar", revenue: 15000 }, { month: "Apr", revenue: 22000 },
  { month: "May", revenue: 28000 }, { month: "Jun", revenue: 35000 },
];

const productMix = [
  { name: "Tomatoes", value: 35 }, { name: "Maize", value: 25 },
  { name: "Onions", value: 20 }, { name: "Sukuma", value: 20 },
];

const orderVolume = [
  { week: "W1", orders: 12 }, { week: "W2", orders: 18 },
  { week: "W3", orders: 15 }, { week: "W4", orders: 22 },
];

const COLORS = [
  "hsl(152, 60%, 36%)", "hsl(42, 90%, 55%)",
  "hsl(215, 25%, 45%)", "hsl(0, 84%, 60%)",
];

export default function PerformanceAnalytics() {
  return (
    <DashboardShell title="Performance Analytics">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Revenue", value: "KES 130K", delta: "+22%" },
          { label: "Orders Completed", value: "67", delta: "+8" },
          { label: "Avg. Order Value", value: "KES 1,940", delta: "+5%" },
          { label: "Customer Rating", value: "4.8", delta: "★" },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bento-card">
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="text-xl font-display font-bold text-foreground mt-1">{k.value}</p>
            <span className="text-xs text-primary font-semibold">{k.delta}</span>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Area Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bento-card lg:col-span-2">
          <h3 className="font-display font-bold text-foreground text-sm mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(152, 60%, 36%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(152, 60%, 36%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(140, 10%, 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(150, 10%, 45%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(150, 10%, 45%)" />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="hsl(152, 60%, 36%)" fill="url(#colorRev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Product Mix */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="bento-card">
          <h3 className="font-display font-bold text-foreground text-sm mb-4">Product Mix</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={productMix} innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                {productMix.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {productMix.map((p, i) => (
              <div key={p.name} className="flex items-center gap-1 text-[10px]">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                <span className="text-muted-foreground">{p.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Order Volume */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="bento-card mt-4">
        <h3 className="font-display font-bold text-foreground text-sm mb-4">Weekly Order Volume</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={orderVolume}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(140, 10%, 90%)" />
            <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(150, 10%, 45%)" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(150, 10%, 45%)" />
            <Tooltip />
            <Bar dataKey="orders" fill="hsl(152, 60%, 36%)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </DashboardShell>
  );
}
