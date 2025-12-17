"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Heart, LayoutDashboard, Users, FileText, Settings, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Doctor } from "@/lib/db"
import { logout } from "@/app/actions/auth"
import { useRouter } from "next/navigation"

interface DoctorSidebarProps {
  doctor: Doctor
}

const navItems = [
  { href: "/doctor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/doctor/patients", label: "Patients", icon: Users },
  { href: "/doctor/assessments", label: "Assessments", icon: FileText },
  { href: "/doctor/settings", label: "Settings", icon: Settings },
]

export function DoctorSidebar({ doctor }: DoctorSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await logout()
    router.push("/")
  }

  return (
    <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--doctor-primary)]">
          <Heart className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-semibold text-sidebar-foreground">FetalHealth</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[var(--doctor-primary)] text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 rounded-lg bg-sidebar-accent p-3">
          <p className="text-xs text-muted-foreground">Your Doctor Code</p>
          <p className="font-mono text-sm font-semibold text-sidebar-foreground">{doctor.doctor_code}</p>
          <p className="mt-1 text-xs text-muted-foreground">Share this with patients to link accounts</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
