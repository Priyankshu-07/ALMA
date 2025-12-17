import type React from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { PatientHeader } from "@/components/patient/patient-header"

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user || user.role !== "PATIENT") {
    redirect("/auth/patient/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--patient-primary)]/5 to-background">
      <PatientHeader patient={user.patient!} />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  )
}
