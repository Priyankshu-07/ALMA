"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function PatientSettingsPage() {
  const { data, isLoading } = useSWR("/api/patient/profile", fetcher)
  const [doctorCode, setDoctorCode] = useState("")
  const [isLinking, setIsLinking] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [linkSuccess, setLinkSuccess] = useState(false)
  const router = useRouter()

  async function handleLinkDoctor(e: React.FormEvent) {
    e.preventDefault()
    setIsLinking(true)
    setLinkError(null)
    setLinkSuccess(false)

    try {
      const res = await fetch("/api/patient/link-doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorCode }),
      })

      const result = await res.json()

      if (result.error) {
        setLinkError(result.error)
      } else {
        setLinkSuccess(true)
        setDoctorCode("")
        router.refresh()
      }
    } catch {
      setLinkError("Failed to link doctor. Please try again.")
    }

    setIsLinking(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const patient = data?.patient
  const linkedDoctor = data?.linkedDoctor

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={patient?.full_name || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={patient?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={patient?.phone || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Pregnancy Week</Label>
              <Input value={patient?.pregnancy_week || ""} disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Healthcare Provider</CardTitle>
            <CardDescription>Link your account to a doctor</CardDescription>
          </CardHeader>
          <CardContent>
            {linkedDoctor ? (
              <div className="rounded-lg bg-secondary p-4">
                <p className="text-sm text-muted-foreground">Currently linked to</p>
                <p className="text-lg font-semibold">{linkedDoctor.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {linkedDoctor.specialization || "Healthcare Provider"} • {linkedDoctor.hospital_name || ""}
                </p>
              </div>
            ) : (
              <form onSubmit={handleLinkDoctor} className="space-y-4">
                {linkError && (
                  <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{linkError}</div>
                )}
                {linkSuccess && (
                  <div className="rounded-lg bg-[var(--success)]/10 px-4 py-3 text-sm text-[var(--success)]">
                    Successfully linked to doctor!
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="doctorCode">Doctor Code</Label>
                  <Input
                    id="doctorCode"
                    value={doctorCode}
                    onChange={(e) => setDoctorCode(e.target.value)}
                    placeholder="DR-XXXXXX"
                  />
                  <p className="text-xs text-muted-foreground">Enter the code provided by your healthcare provider</p>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[var(--patient-primary)] hover:bg-[var(--patient-primary)]/90"
                  disabled={isLinking || !doctorCode}
                >
                  {isLinking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Linking...
                    </>
                  ) : (
                    "Link Doctor"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
