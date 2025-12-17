import type React from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { DoctorSidebar } from "@/components/doctor/doctor-sidebar"
import { DoctorHeader } from "@/components/doctor/doctor-header"

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user || user.role !== "DOCTOR") {
    redirect("/auth/doctor/login")
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DoctorSidebar doctor={user.doctor!} />
      <div className="flex flex-1 flex-col">
        <DoctorHeader doctor={user.doctor!} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
