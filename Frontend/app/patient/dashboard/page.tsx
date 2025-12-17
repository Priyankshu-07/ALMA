import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"
import { Plus, FileText, Calendar, Stethoscope, AlertTriangle, CreditCard } from "lucide-react"

export default async function PatientDashboardPage() {
  const user = await getCurrentUser()
  const patient = user?.patient

  if (!patient) return null

  // Check subscription status
  const subscriptions = await sql`
    SELECT * FROM subscriptions 
    WHERE patient_id = ${patient.id} AND status = 'ACTIVE'
    ORDER BY created_at DESC
    LIMIT 1
  `
  const hasActiveSubscription = subscriptions.length > 0

  // Fetch linked doctor info
  let linkedDoctor = null
  if (patient.linked_doctor_id) {
    const doctors = await sql`
      SELECT * FROM doctors WHERE id = ${patient.linked_doctor_id}
    `
    linkedDoctor = doctors[0]
  }

  // Fetch recent assessments
  const recentAssessments = await sql`
    SELECT * FROM assessments 
    WHERE patient_id = ${patient.id}
    ORDER BY created_at DESC
    LIMIT 3
  `

  // Count assessments
  const assessmentCountResult = await sql`
    SELECT COUNT(*) as count FROM assessments WHERE patient_id = ${patient.id}
  `
  const assessmentCount = Number(assessmentCountResult[0].count)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Hello, {patient.full_name.split(" ")[0]}</h2>
          <p className="text-muted-foreground">
            {patient.pregnancy_week
              ? `Week ${patient.pregnancy_week} of your pregnancy`
              : "Track your pregnancy health"}
          </p>
        </div>
        {hasActiveSubscription && (
          <Button asChild className="bg-[var(--patient-primary)] hover:bg-[var(--patient-primary)]/90">
            <Link href="/patient/new-assessment">
              <Plus className="mr-2 h-4 w-4" />
              New Assessment
            </Link>
          </Button>
        )}
      </div>

      {/* Subscription Notice */}
      {!hasActiveSubscription && (
        <Alert className="border-[var(--warning)] bg-[var(--warning)]/10">
          <CreditCard className="h-4 w-4 text-[var(--warning)]" />
          <AlertTitle>Subscription Required</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>Subscribe to start tracking your pregnancy health and receive AI-powered assessments.</span>
            <Button
              asChild
              size="sm"
              className="w-fit bg-[var(--patient-primary)] hover:bg-[var(--patient-primary)]/90"
            >
              <Link href="/patient/subscribe">Subscribe Now</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pregnancy Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patient.pregnancy_week || "N/A"}</div>
            <p className="text-xs text-muted-foreground">Current week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assessments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assessmentCount}</div>
            <p className="text-xs text-muted-foreground">Total completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Healthcare Provider</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {linkedDoctor ? `Dr. ${linkedDoctor.full_name.split(" ").pop()}` : "Not linked"}
            </div>
            <p className="text-xs text-muted-foreground">
              {linkedDoctor ? linkedDoctor.hospital_name || "Healthcare Provider" : "Link a doctor in settings"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Assessments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Assessments</CardTitle>
              <CardDescription>Your latest health analyses</CardDescription>
            </div>
            {assessmentCount > 0 && (
              <Button asChild variant="outline" size="sm">
                <Link href="/patient/assessments">View All</Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {recentAssessments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No Assessments Yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {hasActiveSubscription
                  ? "Start your first assessment to track your health"
                  : "Subscribe to start tracking your pregnancy health"}
              </p>
              {hasActiveSubscription && (
                <Button asChild className="mt-4 bg-[var(--patient-primary)] hover:bg-[var(--patient-primary)]/90">
                  <Link href="/patient/new-assessment">
                    <Plus className="mr-2 h-4 w-4" />
                    New Assessment
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {recentAssessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div>
                    <p className="font-medium">Assessment #{assessment.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(assessment.created_at).toLocaleDateString()} • BP: {assessment.blood_pressure}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        assessment.risk_category === "HIGH"
                          ? "destructive"
                          : assessment.risk_category === "MEDIUM"
                            ? "secondary"
                            : assessment.ml_status === "PENDING"
                              ? "outline"
                              : "default"
                      }
                    >
                      {assessment.risk_category || assessment.ml_status}
                    </Badge>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/patient/assessments/${assessment.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Disclaimer */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Important Notice</AlertTitle>
        <AlertDescription>
          AI-generated health assessments are for informational purposes only. AI can make mistakes. Always consult with
          your healthcare provider for medical advice and decisions.
        </AlertDescription>
      </Alert>
    </div>
  )
}
