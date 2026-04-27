"use client"

import { useState } from "react"
import { useAppContext } from "@/lib/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StatusBadge, getStatusColor } from "@/components/status-badge"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { Activity, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react"

export default function FHRPage() {
  const { fhr, setFHR } = useAppContext()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [formData, setFormData] = useState({
    baseline: fhr.baseline || "",
    accelerations: fhr.accelerations || "",
    fetalMovement: fhr.fetalMovement || "",
    uterineContractions: fhr.uterineContractions || "",
    lightDecelerations: fhr.lightDecelerations || "",
    severeDecelerations: fhr.severeDecelerations || "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const analyzeFHR = () => {
    // Validate all fields
    const values = Object.values(formData)
    if (values.some((v) => v === "")) {
      toast.error("Please fill in all fields")
      return
    }

    setIsAnalyzing(true)

    // Simulate AI analysis
    setTimeout(() => {
      const baseline = Number(formData.baseline)
      const accelerations = Number(formData.accelerations)
      const fetalMovement = Number(formData.fetalMovement)
      const uterineContractions = Number(formData.uterineContractions)
      const lightDecelerations = Number(formData.lightDecelerations)
      const severeDecelerations = Number(formData.severeDecelerations)

      // FHR classification logic based on FIGO guidelines
      let status: "normal" | "suspect" | "pathological"
      let interpretation: string
      let score = 0

      // Baseline assessment (normal: 110-160 bpm)
      if (baseline < 100 || baseline > 180) {
        score += 3
      } else if (baseline < 110 || baseline > 160) {
        score += 1
      }

      // Accelerations (reactive pattern desired)
      if (accelerations === 0) {
        score += 2
      } else if (accelerations < 2) {
        score += 1
      }

      // Fetal movement
      if (fetalMovement === 0) {
        score += 2
      } else if (fetalMovement < 3) {
        score += 1
      }

      // Uterine contractions (high number with poor variability is concerning)
      if (uterineContractions > 5) {
        score += 1
      }

      // Decelerations
      if (severeDecelerations > 0) {
        score += 3
      }
      if (lightDecelerations > 3) {
        score += 1
      }

      if (score <= 2) {
        status = "normal"
        interpretation = "The fetal heart rate pattern shows normal baseline with adequate variability and appropriate accelerations. This is a reassuring trace indicating good fetal oxygenation. Continue routine monitoring."
      } else if (score <= 5) {
        status = "suspect"
        interpretation = "The FHR trace shows some concerning features that warrant closer observation. The pattern may indicate early fetal compromise or stress. Recommend continuous monitoring and consider further evaluation."
      } else {
        status = "pathological"
        interpretation = "The FHR pattern is abnormal and suggests significant fetal compromise. Features indicate possible hypoxia or distress. Immediate clinical assessment and intervention may be required. Consider urgent delivery if pattern persists."
      }

      setFHR({
        baseline,
        accelerations,
        fetalMovement,
        uterineContractions,
        lightDecelerations,
        severeDecelerations,
        status,
        interpretation,
      })

      setIsAnalyzing(false)
      toast.success("FHR analysis complete")
    }, 1500)
  }

  const getStatusIcon = () => {
    if (!fhr.status) return null
    switch (fhr.status) {
      case "normal":
        return <CheckCircle className="h-6 w-6 text-emerald-500" />
      case "suspect":
        return <AlertCircle className="h-6 w-6 text-amber-500" />
      case "pathological":
        return <AlertTriangle className="h-6 w-6 text-red-500" />
    }
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Fetal Heart Rate Analysis
            </h1>
            <p className="text-muted-foreground">
              Cardiotocography (CTG) interpretation assistant
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>CTG Parameters</CardTitle>
            <CardDescription>
              Enter fetal heart rate monitoring data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="baseline">Baseline FHR (bpm)</Label>
                <Input
                  id="baseline"
                  type="number"
                  placeholder="e.g., 140"
                  value={formData.baseline}
                  onChange={(e) => handleInputChange("baseline", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Normal: 110-160 bpm</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accelerations">Accelerations (count)</Label>
                <Input
                  id="accelerations"
                  type="number"
                  placeholder="e.g., 3"
                  value={formData.accelerations}
                  onChange={(e) => handleInputChange("accelerations", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Number in 20 min window</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fetalMovement">Fetal Movements (count)</Label>
                <Input
                  id="fetalMovement"
                  type="number"
                  placeholder="e.g., 5"
                  value={formData.fetalMovement}
                  onChange={(e) => handleInputChange("fetalMovement", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Per monitoring session</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="uterineContractions">Uterine Contractions</Label>
                <Input
                  id="uterineContractions"
                  type="number"
                  placeholder="e.g., 2"
                  value={formData.uterineContractions}
                  onChange={(e) => handleInputChange("uterineContractions", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Per 10 minutes</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lightDecelerations">Light Decelerations</Label>
                <Input
                  id="lightDecelerations"
                  type="number"
                  placeholder="e.g., 1"
                  value={formData.lightDecelerations}
                  onChange={(e) => handleInputChange("lightDecelerations", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Early or variable</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="severeDecelerations">Severe Decelerations</Label>
                <Input
                  id="severeDecelerations"
                  type="number"
                  placeholder="e.g., 0"
                  value={formData.severeDecelerations}
                  onChange={(e) => handleInputChange("severeDecelerations", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Late or prolonged</p>
              </div>
            </div>

            <Button onClick={analyzeFHR} disabled={isAnalyzing} className="w-full mt-4">
              {isAnalyzing ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Analyzing...
                </>
              ) : (
                "Analyze FHR Pattern"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card>
          <CardHeader>
            <CardTitle>FHR Classification</CardTitle>
            <CardDescription>
              AI-powered cardiotocography interpretation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {fhr.status ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon()}
                  <StatusBadge
                    status={getStatusColor(fhr.status)}
                    className="text-base px-4 py-1.5"
                  >
                    {fhr.status.charAt(0).toUpperCase() + fhr.status.slice(1)}
                  </StatusBadge>
                </div>

                <div className="rounded-lg bg-muted/50 p-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    Clinical Interpretation
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {fhr.interpretation}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-xs text-muted-foreground">Baseline</p>
                    <p className="text-lg font-semibold">{fhr.baseline} bpm</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-xs text-muted-foreground">Accelerations</p>
                    <p className="text-lg font-semibold">{fhr.accelerations}</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-xs text-muted-foreground">Movement</p>
                    <p className="text-lg font-semibold">{fhr.fetalMovement}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-3">
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    <strong>Note:</strong> This analysis is for decision support only. 
                    Clinical judgment should always be exercised in conjunction with 
                    this assessment.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Activity className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">
                  Enter CTG parameters and click &quot;Analyze FHR Pattern&quot; to see results
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
