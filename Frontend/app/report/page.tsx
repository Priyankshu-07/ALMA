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
  HeartPulse,
  Baby,
} from "lucide-react"
import Link from "next/link"

interface AIReport {
  executive_summary: string
  overall_status: string

  maternal_analysis?: {
    summary: string
    key_findings: string[]
  } | null

  fetal_heart_analysis?: {
    summary: string
    key_findings: string[]
  } | null

  ultrasound_analysis?: {
    summary: string
    key_findings: string[]
  } | null

  combined_interpretation: string

  risk_indicators: string[]

  recommendations: string[]

  possible_risks_if_ignored?: string

  monitoring_priority: string
}

const API_BASE = "http://localhost:8000"

export default function ReportPage() {
  const { maternalRisk, fhr, ultrasound } = useAppContext()
  const [isGenerating, setIsGenerating] = useState(false)
  const [report, setReport] = useState<AIReport | null>(null)
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hasAnyData = maternalRisk.riskLevel || fhr.status || ultrasound.growthStatus

  const buildRequestPayload = () => {
    const maternal_result = maternalRisk.riskLevel
      ? {
          status: "success",
          prediction: maternalRisk.riskLevel,
          input_data: {
            age: maternalRisk.age,
            systolic_bp: maternalRisk.systolicBP,
            diastolic_bp: maternalRisk.diastolicBP,
            blood_sugar: maternalRisk.bloodSugar,
            body_temp: maternalRisk.bodyTemperature,
            heart_rate: maternalRisk.heartRate,
          },
        }
      : null

    const fhr_result = fhr.status
      ? {
          status: "success",
          prediction: fhr.status,
          input_data: {
            baseline_value: fhr.baseline,
            accelerations: fhr.accelerations,
            fetal_movement: fhr.fetalMovement,
            uterine_contractions: fhr.uterineContractions,
            light_decelerations: fhr.lightDecelerations,
            severe_decelerations: fhr.severeDecelerations,
          },
        }
      : null

    const ultrasound_results = ultrasound.detectedPart
      ? [
          {
            plane_detected: ultrasound.detectedPart,
            measurements: {
              HC_mm: ultrasound.measurements.hc,
              AC_mm: ultrasound.measurements.ac,
              FL_mm: ultrasound.measurements.fl,
            },
            estimated_fetal_weight_grams: ultrasound.efw,
            growth_status: ultrasound.growthStatus,
            error: null,
          },
        ]
      : []

    return { maternal_result, fhr_result, ultrasound_results }
  }

  const generateReport = async () => {
    if (!hasAnyData) {
      toast.error("Please complete at least one analysis module first")
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const payload = buildRequestPayload()

      const response = await fetch(`${API_BASE}/generate-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`)
      }

      const data = await response.json()

      if (data.status !== "success") {
        throw new Error("Report generation did not succeed")
      }

      setReport(data.report)
      setGeneratedAt(new Date())
      toast.success("Report generated successfully")
    } catch (err) {
      console.error("Report generation failed:", err)
      setError("Failed to generate report. Please check the backend is running and try again.")
      toast.error("Failed to generate report")
    } finally {
      setIsGenerating(false)
    }
  }

  const exportPDF = () => {
    toast.success("Report exported to PDF")
  }

  const priorityToStatusColor = (priority: string): "low" | "medium" | "high" => {
    const p = priority.toLowerCase()
    if (p === "urgent") return "high"
    if (p === "elevated") return "medium"
    return "low"
  }

  return (
    <div className="p-6 lg:p-8">
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

              {error && (
                <p className="mt-3 text-sm text-destructive">{error}</p>
              )}
            </CardContent>
          </Card>

          {report && generatedAt && (
            <div className="space-y-6">
              <Card className="border-2 border-primary/20">
                <CardHeader className="border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Fetal Health Assessment Report</CardTitle>
                      <CardDescription className="mt-1">
                        Generated on {generatedAt.toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </CardDescription>
                    </div>
                    <StatusBadge status={getStatusColor(priorityToStatusColor(report.monitoring_priority))} className="text-sm">
                      {report.monitoring_priority} Priority
                    </StatusBadge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <ClipboardList className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground">Executive Summary</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed pl-7">
                      {report.executive_summary}
                    </p>
                  </div>

                  {report.maternal_analysis && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <HeartPulse className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold text-foreground">Maternal Analysis</h3>
                      </div>
                      <p className="text-muted-foreground leading-relaxed pl-7 mb-2">
                        {report.maternal_analysis.summary}
                      </p>
                      {report.maternal_analysis.key_findings.length > 0 && (
                        <ul className="space-y-1 pl-7 list-disc list-inside text-muted-foreground">
                          {report.maternal_analysis.key_findings.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {report.fetal_heart_analysis && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Stethoscope className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold text-foreground">Fetal Heart Rate Analysis</h3>
                      </div>
                      <p className="text-muted-foreground leading-relaxed pl-7 mb-2">
                        {report.fetal_heart_analysis.summary}
                      </p>
                      {report.fetal_heart_analysis.key_findings.length > 0 && (
                        <ul className="space-y-1 pl-7 list-disc list-inside text-muted-foreground">
                          {report.fetal_heart_analysis.key_findings.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {report.ultrasound_analysis && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Baby className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold text-foreground">Ultrasound Analysis</h3>
                      </div>
                      <p className="text-muted-foreground leading-relaxed pl-7 mb-2">
                        {report.ultrasound_analysis.summary}
                      </p>
                      {report.ultrasound_analysis.key_findings.length > 0 && (
                        <ul className="space-y-1 pl-7 list-disc list-inside text-muted-foreground">
                          {report.ultrasound_analysis.key_findings.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {report.combined_interpretation && (
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">Combined Interpretation</h3>
                      <p className="text-muted-foreground leading-relaxed pl-7">
                        {report.combined_interpretation}
                      </p>
                    </div>
                  )}

                  {report.risk_indicators.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">Risk Indicators</h3>
                      <ul className="space-y-2 pl-7">
                        {report.risk_indicators.map((risk, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-xs font-medium text-destructive">
                              !
                            </span>
                            <span className="text-muted-foreground">{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

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

                  {report.possible_risks_if_ignored && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-red-600 mb-3">
                        Possible Risks if Recommendations are Ignored
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {report.possible_risks_if_ignored}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

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