import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useLocation } from "react-router-dom";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/maternal": "Maternal Risk Prediction",
  "/fetal": "Fetal Heart Rate Analysis",
  "/payment": "Pricing",
  "/about": "About",
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const title = pageTitles[location.pathname] || "Fetal Health AI";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-card px-4 gap-3 sticky top-0 z-10">
            <SidebarTrigger />
            <div className="h-6 w-px bg-border" />
            <h1 className="font-display text-lg font-semibold text-foreground">{title}</h1>
            <div className="ml-auto flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
                AI
              </div>
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
