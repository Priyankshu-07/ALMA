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
import { HeartPulse, AlertTriangle, CheckCircle, Info } from "lucide-react"

export default function MaternalRiskPage() {
  const { maternalRisk, setMaternalRisk } = useAppContext()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [formData, setFormData] = useState({
    age: maternalRisk.age || "",
    systolicBP: maternalRisk.systolicBP || "",
    diastolicBP: maternalRisk.diastolicBP || "",
    bloodSugar: maternalRisk.bloodSugar || "",
    bodyTemperature: maternalRisk.bodyTemperature || "",
    heartRate: maternalRisk.heartRate || "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const analyzeRisk = () => {
    // Validate all fields
    const values = Object.values(formData)
    if (values.some((v) => v === "" || v === 0)) {
      toast.error("Please fill in all fields")
      return
    }

    setIsAnalyzing(true)

    // Simulate AI analysis with realistic delay
    setTimeout(() => {
      const age = Number(formData.age)
      const systolicBP = Number(formData.systolicBP)
      const diastolicBP = Number(formData.diastolicBP)
      const bloodSugar = Number(formData.bloodSugar)
      const bodyTemp = Number(formData.bodyTemperature)
      const heartRate = Number(formData.heartRate)

      // Risk calculation logic
      let riskScore = 0
      const factors: string[] = []

      // Age risk
      if (age < 18 || age > 35) {
        riskScore += 2
        factors.push(age < 18 ? "young maternal age" : "advanced maternal age")
      }

      // Blood pressure risk
      if (systolicBP >= 140 || diastolicBP >= 90) {
        riskScore += 3
        factors.push("elevated blood pressure (hypertension)")
      } else if (systolicBP >= 130 || diastolicBP >= 85) {
        riskScore += 1
        factors.push("pre-hypertensive blood pressure")
      }

      // Blood sugar risk
      if (bloodSugar > 140) {
        riskScore += 3
        factors.push("high blood glucose levels")
      } else if (bloodSugar > 120) {
        riskScore += 1
        factors.push("elevated blood glucose")
      }

      // Temperature risk
      if (bodyTemp > 38 || bodyTemp < 36) {
        riskScore += 2
        factors.push(bodyTemp > 38 ? "fever present" : "hypothermia detected")
      }

      // Heart rate risk
      if (heartRate > 100 || heartRate < 60) {
        riskScore += 2
        factors.push(heartRate > 100 ? "tachycardia" : "bradycardia")
      }

      let riskLevel: "low" | "medium" | "high"
      let explanation: string

      if (riskScore <= 2) {
        riskLevel = "low"
        explanation = "All maternal health indicators are within normal ranges. Continue routine prenatal care and monitoring."
      } else if (riskScore <= 5) {
        riskLevel = "medium"
        explanation = `Moderate risk factors detected: ${factors.join(", ")}. Enhanced monitoring and lifestyle modifications recommended. Consider additional consultations.`
      } else {
        riskLevel = "high"
        explanation = `High-risk pregnancy indicators: ${factors.join(", ")}. Immediate specialist consultation recommended. Close monitoring and intervention may be required.`
      }

      setMaternalRisk({
        age,
        systolicBP,
        diastolicBP,
        bloodSugar,
        bodyTemperature: bodyTemp,
        heartRate,
        riskLevel,
        explanation,
      })

      setIsAnalyzing(false)
      toast.success("Analysis complete")
    }, 1500)
  }

  const getRiskIcon = () => {
    if (!maternalRisk.riskLevel) return null
    switch (maternalRisk.riskLevel) {
      case "low":
        return <CheckCircle className="h-6 w-6 text-emerald-500" />
      case "medium":
        return <Info className="h-6 w-6 text-amber-500" />
      case "high":
        return <AlertTriangle className="h-6 w-6 text-red-500" />
    }
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <HeartPulse className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Maternal Risk Prediction
            </h1>
            <p className="text-muted-foreground">
              Assess maternal health risk based on vital signs
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
            <CardDescription>
              Enter maternal health parameters for risk assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="age">Age (years)</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="e.g., 28"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                <Input
                  id="heartRate"
                  type="number"
                  placeholder="e.g., 75"
                  value={formData.heartRate}
                  onChange={(e) => handleInputChange("heartRate", e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="systolicBP">Systolic BP (mmHg)</Label>
                <Input
                  id="systolicBP"
                  type="number"
                  placeholder="e.g., 120"
                  value={formData.systolicBP}
                  onChange={(e) => handleInputChange("systolicBP", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diastolicBP">Diastolic BP (mmHg)</Label>
                <Input
                  id="diastolicBP"
                  type="number"
                  placeholder="e.g., 80"
                  value={formData.diastolicBP}
                  onChange={(e) => handleInputChange("diastolicBP", e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bloodSugar">Blood Sugar (mg/dL)</Label>
                <Input
                  id="bloodSugar"
                  type="number"
                  placeholder="e.g., 100"
                  value={formData.bloodSugar}
                  onChange={(e) => handleInputChange("bloodSugar", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bodyTemperature">Body Temperature (°C)</Label>
                <Input
                  id="bodyTemperature"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 36.8"
                  value={formData.bodyTemperature}
                  onChange={(e) => handleInputChange("bodyTemperature", e.target.value)}
                />
              </div>
            </div>

            <Button onClick={analyzeRisk} disabled={isAnalyzing} className="w-full mt-4">
              {isAnalyzing ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Analyzing...
                </>
              ) : (
                "Analyze Risk"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Assessment Result</CardTitle>
            <CardDescription>
              AI-powered maternal health risk analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {maternalRisk.riskLevel ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {getRiskIcon()}
                  <StatusBadge
                    status={getStatusColor(maternalRisk.riskLevel)}
                    className="text-base px-4 py-1.5"
                  >
                    {maternalRisk.riskLevel.charAt(0).toUpperCase() + maternalRisk.riskLevel.slice(1)} Risk
                  </StatusBadge>
                </div>

                <div className="rounded-lg bg-muted/50 p-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    Clinical Interpretation
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {maternalRisk.explanation}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Blood Pressure</p>
                    <p className="text-lg font-semibold">
                      {maternalRisk.systolicBP}/{maternalRisk.diastolicBP}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Blood Sugar</p>
                    <p className="text-lg font-semibold">{maternalRisk.bloodSugar} mg/dL</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Heart Rate</p>
                    <p className="text-lg font-semibold">{maternalRisk.heartRate} bpm</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Temperature</p>
                    <p className="text-lg font-semibold">{maternalRisk.bodyTemperature}°C</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <HeartPulse className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">
                  Enter patient information and click &quot;Analyze Risk&quot; to see results
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
