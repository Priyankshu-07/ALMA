"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  HeartPulse,
  Activity,
  Image,
  FileText,
  Moon,
  Sun,
  Baby,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppContext } from "@/lib/app-context"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Maternal Risk", href: "/maternal-risk", icon: HeartPulse },
  { name: "FHR Analysis", href: "/fhr", icon: Activity },
  { name: "Ultrasound", href: "/ultrasound", icon: Image },
  { name: "AI Report", href: "/report", icon: FileText },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { isDarkMode, toggleDarkMode } = useAppContext()

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary">
          <Baby className="h-6 w-6 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="text-base font-semibold tracking-tight">Fetal Health</h1>
          <p className="text-xs text-sidebar-foreground/60">Analysis System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Dark Mode Toggle */}
      <div className="border-t border-sidebar-border p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleDarkMode}
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        >
          {isDarkMode ? (
            <>
              <Sun className="h-5 w-5" />
              Light Mode
            </>
          ) : (
            <>
              <Moon className="h-5 w-5" />
              Dark Mode
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
