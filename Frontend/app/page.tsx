"use client"

import { useAppContext } from "@/lib/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge, getStatusColor } from "@/components/status-badge"
import { HeartPulse, Activity, Scale, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const { maternalRisk, fhr, ultrasound } = useAppContext()

  const hasAnyData = maternalRisk.riskLevel || fhr.status || ultrasound.growthStatus

  const getOverallStatus = () => {
    const statuses = [
      maternalRisk.riskLevel,
      fhr.status === "normal" ? "low" : fhr.status === "suspect" ? "medium" : fhr.status === "pathological" ? "high" : null,
      ultrasound.growthStatus === "normal" ? "low" : ultrasound.growthStatus ? "high" : null,
    ].filter(Boolean)

    if (statuses.length === 0) return null
    if (statuses.includes("high") || statuses.includes("pathological")) return "high"
    if (statuses.includes("medium") || statuses.includes("suspect")) return "medium"
    return "low"
  }

  const overallStatus = getOverallStatus()

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Overview of fetal health analysis results
        </p>
      </div>

      {/* Overall Assessment Card */}
      <Card className="mb-6 border-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {overallStatus === "low" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : overallStatus ? (
              <AlertCircle className="h-5 w-5 text-amber-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
            )}
            Overall Assessment
          </CardTitle>
          <CardDescription>Combined analysis from all modules</CardDescription>
        </CardHeader>
        <CardContent>
          {hasAnyData ? (
            <div className="flex items-center gap-4">
              <StatusBadge status={getStatusColor(overallStatus as "low" | "medium" | "high")} className="text-base px-4 py-1.5">
                {overallStatus === "low" ? "Low Risk" : overallStatus === "medium" ? "Moderate Risk" : "High Risk"}
              </StatusBadge>
              <p className="text-sm text-muted-foreground">
                {overallStatus === "low"
                  ? "All indicators are within normal ranges."
                  : overallStatus === "medium"
                  ? "Some indicators require attention."
                  : "Immediate clinical review recommended."}
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">No analysis data available yet.</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/maternal-risk">Start Maternal Risk Analysis</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/fhr">Start FHR Analysis</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/ultrasound">Upload Ultrasound</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Maternal Risk Card */}
        <Link href="/maternal-risk">
          <Card className="h-full transition-all hover:shadow-md hover:border-primary/30 cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Maternal Risk
                </CardTitle>
                <HeartPulse className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {maternalRisk.riskLevel ? (
                <>
                  <StatusBadge status={getStatusColor(maternalRisk.riskLevel)}>
                    {maternalRisk.riskLevel.charAt(0).toUpperCase() + maternalRisk.riskLevel.slice(1)} Risk
                  </StatusBadge>
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                    {maternalRisk.explanation || "Risk assessment completed"}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Not analyzed</p>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* FHR Status Card */}
        <Link href="/fhr">
          <Card className="h-full transition-all hover:shadow-md hover:border-primary/30 cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  FHR Status
                </CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {fhr.status ? (
                <>
                  <StatusBadge status={getStatusColor(fhr.status)}>
                    {fhr.status.charAt(0).toUpperCase() + fhr.status.slice(1)}
                  </StatusBadge>
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                    {fhr.interpretation || "FHR analysis completed"}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Not analyzed</p>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Estimated Fetal Weight Card */}
        <Link href="/ultrasound">
          <Card className="h-full transition-all hover:shadow-md hover:border-primary/30 cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Fetal Weight (EFW)
                </CardTitle>
                <Scale className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {ultrasound.efw ? (
                <>
                  <p className="text-2xl font-semibold text-foreground">
                    {ultrasound.efw}g
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Estimated from ultrasound measurements
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Not measured</p>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Growth Status Card */}
        <Link href="/ultrasound">
          <Card className="h-full transition-all hover:shadow-md hover:border-primary/30 cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Growth Status
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {ultrasound.growthStatus ? (
                <>
                  <StatusBadge status={getStatusColor(ultrasound.growthStatus)}>
                    {ultrasound.growthStatus.charAt(0).toUpperCase() + ultrasound.growthStatus.slice(1)}
                  </StatusBadge>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Based on biometric measurements
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Not analyzed</p>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      {hasAnyData && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/report">Generate AI Report</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/ultrasound">New Ultrasound Analysis</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
