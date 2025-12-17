"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Upload, FileImage } from "lucide-react"
import { createAssessment } from "@/app/actions/assessment"

interface NewAssessmentFormProps {
  patientId: string
  doctorId: string | null
}

export function NewAssessmentForm({ patientId, doctorId }: NewAssessmentFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [xrayFile, setXrayFile] = useState<File | null>(null)
  const [fhrFile, setFhrFile] = useState<File | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.append("patientId", patientId)
    if (doctorId) formData.append("doctorId", doctorId)

    const result = await createAssessment(formData)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      router.push(`/patient/assessments/${result.assessmentId}`)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {error && <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

        {/* File Uploads */}
        <Card>
          <CardHeader>
            <CardTitle>Medical Images</CardTitle>
            <CardDescription>Upload your ultrasound and FHR chart images</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="xray">Ultrasound/X-Ray Image *</Label>
              <div className="relative">
                <Input
                  id="xray"
                  name="xray"
                  type="file"
                  accept="image/*"
                  required
                  className="hidden"
                  onChange={(e) => setXrayFile(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="xray"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-[var(--patient-primary)]"
                >
                  {xrayFile ? (
                    <>
                      <FileImage className="mb-2 h-8 w-8 text-[var(--patient-primary)]" />
                      <span className="text-sm font-medium">{xrayFile.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to upload</span>
                    </>
                  )}
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fhr">FHR Chart Image *</Label>
              <div className="relative">
                <Input
                  id="fhr"
                  name="fhr"
                  type="file"
                  accept="image/*"
                  required
                  className="hidden"
                  onChange={(e) => setFhrFile(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="fhr"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-[var(--patient-primary)]"
                >
                  {fhrFile ? (
                    <>
                      <FileImage className="mb-2 h-8 w-8 text-[var(--patient-primary)]" />
                      <span className="text-sm font-medium">{fhrFile.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to upload</span>
                    </>
                  )}
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vitals */}
        <Card>
          <CardHeader>
            <CardTitle>Health Vitals</CardTitle>
            <CardDescription>Enter your current health measurements</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bloodPressure">Blood Pressure *</Label>
              <Input id="bloodPressure" name="bloodPressure" placeholder="e.g. 120/80" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sugarLevel">Sugar Level *</Label>
              <Input id="sugarLevel" name="sugarLevel" placeholder="e.g. 95 mg/dL" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heartRate">Heart Rate *</Label>
              <Input id="heartRate" name="heartRate" placeholder="e.g. 72 bpm" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight *</Label>
              <Input id="weight" name="weight" placeholder="e.g. 65 kg" required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="additionalNote">Additional Notes</Label>
              <Textarea
                id="additionalNote"
                name="additionalNote"
                placeholder="Any additional symptoms, concerns, or information..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-[var(--patient-primary)] hover:bg-[var(--patient-primary)]/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Assessment"
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
