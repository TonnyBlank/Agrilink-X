import {
  LayoutDashboard,
  BarChart3,
  Sprout,
  Package,
  ShoppingCart,
  MessageSquare,
  ClipboardList,
  Users,
  Calendar,
  ScanLine,
  Zap,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const mainNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Performance", url: "/dashboard/analytics", icon: BarChart3 },
];

const farmerNav = [
  { title: "My Farm", url: "/dashboard/farm", icon: Sprout },
  { title: "Upload & Sell", url: "/dashboard/products", icon: Package },
];

const tradeNav = [
  { title: "Marketplace", url: "/dashboard/marketplace", icon: ShoppingCart },
  { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
  { title: "Orders", url: "/dashboard/orders", icon: ClipboardList },
];

const intelligenceNav = [
  { title: "AI Scanner", url: "/dashboard/ai-scanner", icon: ScanLine, pro: true },
  { title: "Crop Calendar", url: "/dashboard/calendar", icon: Calendar },
  { title: "Community", url: "/dashboard/community", icon: Users },
];

const monetizeNav = [
  { title: "Upgrade Plan", url: "/dashboard/upgrade", icon: Zap },
];

interface NavGroupProps {
  label: string;
  items: typeof mainNav;
  collapsed: boolean;
}

function NavGroup({ label, items, collapsed }: NavGroupProps) {
  const location = useLocation();
  const { role } = useAuth();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarGroup>
      {!collapsed && (
        <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest font-medium px-3">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = location.pathname === item.url ||
              (item.url === "/dashboard" && location.pathname === "/dashboard/free") ||
              (item.url === "/dashboard" && location.pathname === "/dashboard/pro") ||
              (item.url === "/dashboard" && location.pathname === "/dashboard/enterprise");
            const isPro = (item as any).pro;

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink
                    to={item.url}
                    end={item.url === "/dashboard"}
                    onClick={() => {
                      if (isMobile) {
                        setOpenMobile(false);
                      }
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-sidebar-primary/20 text-sidebar-primary"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }`}
                    activeClassName=""
                  >
                    <item.icon className="w-[18px] h-[18px] shrink-0" />
                    {!collapsed && (
                      <span className="truncate">{item.title}</span>
                    )}
                    {!collapsed && isPro && role !== "farmer_pro" && role !== "buyer_enterprise" && (
                      <span className="ml-auto text-[10px] bg-gold-500/20 text-gold-400 px-1.5 py-0.5 rounded-full font-semibold">
                        PRO
                      </span>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, profile, role, user } = useAuth();
  const navigate = useNavigate();
  const showUpgradeLink = role === "farmer_free";
  const displayName =
    profile?.full_name ||
    (typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ||
    "User";

  const tierBadge = role === "buyer_enterprise"
    ? { label: "Enterprise", cls: "bg-steel-500/20 text-steel-400" }
    : role === "farmer_pro"
    ? { label: "Pro", cls: "bg-gold-500/20 text-gold-400" }
    : { label: "Free", cls: "bg-emerald-500/20 text-emerald-400" };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-gradient flex items-center justify-center shadow-glow-emerald shrink-0">
            <span className="text-primary-foreground font-display font-bold text-lg">A</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="font-display font-bold text-sidebar-foreground text-base">AgriLink X</h1>
              {showUpgradeLink ? (
                <Link to="/dashboard/upgrade" className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-semibold hover:opacity-80 transition-opacity ${tierBadge.cls}`}>
                  {tierBadge.label}
                </Link>
              ) : (
                <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-semibold ${tierBadge.cls}`}>
                  {tierBadge.label}
                </span>
              )}
            </div>
          )}
          {!collapsed && (
            <button
              onClick={toggleSidebar}
              className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 space-y-1">
        <NavGroup label="Command Center" items={mainNav} collapsed={collapsed} />
        <NavGroup label="Farm Operations" items={farmerNav} collapsed={collapsed} />
        <NavGroup label="Trade" items={tradeNav} collapsed={collapsed} />
        <NavGroup label="Intelligence" items={intelligenceNav} collapsed={collapsed} />
        {showUpgradeLink && <NavGroup label="Growth" items={monetizeNav} collapsed={collapsed} />}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        {!collapsed && (
          <Link to="/dashboard/profile" className="flex items-center gap-3 mb-3 hover:bg-sidebar-accent/50 p-2 rounded-xl transition-colors">
            {profile?.photo_url ? (
              <img
                src={profile.photo_url}
                alt={displayName}
                className="w-8 h-8 rounded-xl object-cover border border-sidebar-border"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-sidebar-accent flex items-center justify-center text-sidebar-foreground text-xs font-bold">
                {(displayName[0] || "U").toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {displayName}
              </p>
              <p className="text-[11px] text-sidebar-foreground/50 truncate">
                {profile?.county || "Kenya"}
              </p>
            </div>
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          onClick={async () => { await signOut(); navigate("/"); }}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {!collapsed && "Sign Out"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
