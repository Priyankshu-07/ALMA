"use client"

import { useState } from "react"
import { useAppContext } from "@/lib/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge, getStatusColor } from "@/components/status-badge"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import {
  FileText,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ClipboardList,
  Stethoscope,
  LightbulbIcon,
} from "lucide-react"
import Link from "next/link"

export default function ReportPage() {
  const { maternalRisk, fhr, ultrasound } = useAppContext()
  const [isGenerating, setIsGenerating] = useState(false)
  const [report, setReport] = useState<{
    summary: string
    riskAnalysis: string
    recommendations: string[]
    generatedAt: Date
  } | null>(null)

  const hasAnyData = maternalRisk.riskLevel || fhr.status || ultrasound.growthStatus

  const generateReport = () => {
    if (!hasAnyData) {
      toast.error("Please complete at least one analysis module first")
      return
    }

    setIsGenerating(true)

    setTimeout(() => {
      // Build comprehensive summary
      const summaryParts: string[] = []
      
      if (maternalRisk.riskLevel) {
        summaryParts.push(
          `Maternal health assessment indicates ${maternalRisk.riskLevel} risk level. ` +
          `Key vital signs: BP ${maternalRisk.systolicBP}/${maternalRisk.diastolicBP} mmHg, ` +
          `heart rate ${maternalRisk.heartRate} bpm, blood glucose ${maternalRisk.bloodSugar} mg/dL.`
        )
      }

      if (fhr.status) {
        const fhrDescription = fhr.status === "normal" 
          ? "reassuring with adequate variability and accelerations"
          : fhr.status === "suspect"
          ? "showing some concerning features warranting closer monitoring"
          : "abnormal with features suggesting possible fetal compromise"
        summaryParts.push(
          `Cardiotocography analysis shows ${fhr.status} pattern. ` +
          `The fetal heart rate trace is ${fhrDescription}. ` +
          `Baseline FHR: ${fhr.baseline} bpm with ${fhr.accelerations} accelerations noted.`
        )
      }

      if (ultrasound.growthStatus) {
        summaryParts.push(
          `Ultrasound biometry reveals ${ultrasound.detectedPart?.toLowerCase()} measurements. ` +
          `Estimated fetal weight: ${ultrasound.efw}g. ` +
          `Growth assessment: ${ultrasound.growthStatus}. ` +
          `HC: ${ultrasound.measurements.hc}mm, AC: ${ultrasound.measurements.ac}mm, FL: ${ultrasound.measurements.fl}mm.`
        )
      }

      // Build risk analysis
      const riskFactors: string[] = []
      
      if (maternalRisk.riskLevel === "high") {
        riskFactors.push("High-risk maternal health indicators requiring close monitoring")
      } else if (maternalRisk.riskLevel === "medium") {
        riskFactors.push("Moderate maternal risk factors present")
      }

      if (fhr.status === "pathological") {
        riskFactors.push("Abnormal FHR pattern indicating possible fetal distress")
      } else if (fhr.status === "suspect") {
        riskFactors.push("Suspicious FHR features requiring continued surveillance")
      }

      if (ultrasound.growthStatus === "underdeveloped") {
        riskFactors.push("Fetal growth restriction (FGR) suspected - below 10th percentile")
      } else if (ultrasound.growthStatus === "overgrowth") {
        riskFactors.push("Large for gestational age (LGA) - macrosomia risk")
      }

      const riskAnalysis = riskFactors.length > 0
        ? `Risk factors identified: ${riskFactors.join(". ")}. Comprehensive evaluation and multidisciplinary consultation may be warranted based on clinical presentation.`
        : "No significant risk factors identified across all assessed parameters. Routine prenatal care protocols are appropriate for continued monitoring."

      // Generate recommendations
      const recommendations: string[] = []

      if (maternalRisk.riskLevel === "high" || fhr.status === "pathological") {
        recommendations.push("Consider immediate specialist consultation and possible hospitalization")
        recommendations.push("Implement continuous fetal monitoring as clinically indicated")
      }

      if (maternalRisk.riskLevel === "high") {
        recommendations.push("Review and optimize maternal medication regimen")
        recommendations.push("Assess for preeclampsia and gestational diabetes")
      }

      if (fhr.status === "suspect" || fhr.status === "pathological") {
        recommendations.push("Continue CTG monitoring with attention to decelerations")
        recommendations.push("Consider biophysical profile assessment")
      }

      if (ultrasound.growthStatus === "underdeveloped") {
        recommendations.push("Schedule serial growth ultrasounds every 2-3 weeks")
        recommendations.push("Perform umbilical artery Doppler assessment")
        recommendations.push("Evaluate placental function and amniotic fluid volume")
      }

      if (ultrasound.growthStatus === "overgrowth") {
        recommendations.push("Screen for gestational diabetes if not already done")
        recommendations.push("Discuss delivery planning and potential birth complications")
      }

      if (recommendations.length === 0) {
        recommendations.push("Continue routine prenatal care schedule")
        recommendations.push("Maintain healthy lifestyle with balanced nutrition")
        recommendations.push("Schedule next routine growth ultrasound as per protocol")
        recommendations.push("Monitor for any new symptoms and report promptly")
      }

      setReport({
        summary: summaryParts.join(" "),
        riskAnalysis,
        recommendations,
        generatedAt: new Date(),
      })

      setIsGenerating(false)
      toast.success("Report generated successfully")
    }, 2000)
  }

  const exportPDF = () => {
    // In a real app, this would generate an actual PDF
    toast.success("Report exported to PDF")
  }

  const getOverallRisk = () => {
    const risks = [
      maternalRisk.riskLevel,
      fhr.status === "normal" ? "low" : fhr.status === "suspect" ? "medium" : fhr.status === "pathological" ? "high" : null,
      ultrasound.growthStatus === "normal" ? "low" : ultrasound.growthStatus ? "high" : null,
    ].filter(Boolean)

    if (risks.includes("high")) return "high"
    if (risks.includes("medium")) return "medium"
    if (risks.length > 0) return "low"
    return null
  }

  const overallRisk = getOverallRisk()

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              AI Clinical Report
            </h1>
            <p className="text-muted-foreground">
              Comprehensive fetal health assessment report
            </p>
          </div>
        </div>
      </div>

      {!hasAnyData ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No Analysis Data Available
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Complete at least one analysis module to generate a comprehensive clinical report.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild variant="outline">
                  <Link href="/maternal-risk">Maternal Risk Analysis</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/fhr">FHR Analysis</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/ultrasound">Ultrasound Analysis</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Data Sources Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Analysis Modules Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${maternalRisk.riskLevel ? "border-primary/50 bg-primary/5" : "border-muted"}`}>
                  {maternalRisk.riskLevel ? (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={maternalRisk.riskLevel ? "text-foreground" : "text-muted-foreground"}>
                    Maternal Risk
                  </span>
                </div>
                <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${fhr.status ? "border-primary/50 bg-primary/5" : "border-muted"}`}>
                  {fhr.status ? (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={fhr.status ? "text-foreground" : "text-muted-foreground"}>
                    FHR Analysis
                  </span>
                </div>
                <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${ultrasound.growthStatus ? "border-primary/50 bg-primary/5" : "border-muted"}`}>
                  {ultrasound.growthStatus ? (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={ultrasound.growthStatus ? "text-foreground" : "text-muted-foreground"}>
                    Ultrasound
                  </span>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <Button onClick={generateReport} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Generating Report...
                    </>
                  ) : report ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate Report
                    </>
                  ) : (
                    "Generate Clinical Report"
                  )}
                </Button>
                {report && (
                  <Button variant="outline" onClick={exportPDF}>
                    <Download className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Report Content */}
          {report && (
            <div className="space-y-6">
              {/* Report Header */}
              <Card className="border-2 border-primary/20">
                <CardHeader className="border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Fetal Health Assessment Report</CardTitle>
                      <CardDescription className="mt-1">
                        Generated on {report.generatedAt.toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </CardDescription>
                    </div>
                    {overallRisk && (
                      <StatusBadge status={getStatusColor(overallRisk as "low" | "medium" | "high")} className="text-sm">
                        {overallRisk === "low" ? "Low Risk" : overallRisk === "medium" ? "Moderate Risk" : "High Risk"}
                      </StatusBadge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Summary Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <ClipboardList className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground">Summary</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed pl-7">
                      {report.summary}
                    </p>
                  </div>

                  {/* Risk Analysis Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Stethoscope className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground">Risk Analysis</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed pl-7">
                      {report.riskAnalysis}
                    </p>
                  </div>

                  {/* Recommendations Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <LightbulbIcon className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground">Recommendations</h3>
                    </div>
                    <ul className="space-y-2 pl-7">
                      {report.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                            {index + 1}
                          </span>
                          <span className="text-muted-foreground">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Disclaimer */}
              <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
                <CardContent className="py-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Clinical Disclaimer:</strong> This AI-generated report is intended for 
                    decision support purposes only and should not replace clinical judgment. 
                    All findings should be verified and interpreted by qualified healthcare 
                    professionals in the context of the complete clinical picture.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
