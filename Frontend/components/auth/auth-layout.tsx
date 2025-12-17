import type React from "react"
import Link from "next/link"
import { Heart } from "lucide-react"

interface AuthLayoutProps {
  children: React.ReactNode
  variant: "doctor" | "patient"
}

export function AuthLayout({ children, variant }: AuthLayoutProps) {
  const bgClass = variant === "doctor" ? "from-[var(--doctor-primary)]/5" : "from-[var(--patient-primary)]/5"

  return (
    <div className={`flex min-h-screen flex-col bg-gradient-to-br ${bgClass} to-background`}>
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Heart className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">FetalHealth</span>
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-8">{children}</main>
    </div>
  )
}
