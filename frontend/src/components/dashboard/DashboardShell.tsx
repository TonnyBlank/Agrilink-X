import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Menu } from "lucide-react";

interface DashboardShellProps {
  children: ReactNode;
  title?: string;
  variant?: "standard" | "pro" | "enterprise";
}

export default function DashboardShell({ children, title, variant = "standard" }: DashboardShellProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="min-h-14 flex items-center gap-3 px-4 py-3 border-b border-border glass sticky top-0 z-40">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground">
              <Menu className="w-5 h-5" />
            </SidebarTrigger>
            {title && (
              <h1 className="font-display font-bold text-foreground text-base sm:text-lg leading-tight">{title}</h1>
            )}
          </header>
          <main className="flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
