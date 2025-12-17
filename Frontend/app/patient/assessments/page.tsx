import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { FileText, Plus } from "lucide-react"

export default async function PatientAssessmentsPage() {
  const user = await getCurrentUser()
  const patient = user?.patient

  if (!patient) return null

  const assessments = await sql`
    SELECT * FROM assessments 
    WHERE patient_id = ${patient.id}
    ORDER BY created_at DESC
  `

  // Check subscription
  const subscriptions = await sql`
    SELECT * FROM subscriptions 
    WHERE patient_id = ${patient.id} AND status = 'ACTIVE'
    LIMIT 1
  `
  const hasActiveSubscription = subscriptions.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">My Assessments</h2>
          <p className="text-muted-foreground">View all your health analyses</p>
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

      {assessments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No Assessments Yet</h3>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              Start your first assessment to track your pregnancy health
            </p>
            {hasActiveSubscription && (
              <Button asChild className="mt-4 bg-[var(--patient-primary)] hover:bg-[var(--patient-primary)]/90">
                <Link href="/patient/new-assessment">
                  <Plus className="mr-2 h-4 w-4" />
                  New Assessment
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assessments.map((assessment) => (
            <Card key={assessment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Assessment #{assessment.id.slice(0, 8)}</CardTitle>
                    <CardDescription>
                      {new Date(assessment.created_at).toLocaleDateString()} at{" "}
                      {new Date(assessment.created_at).toLocaleTimeString()}
                    </CardDescription>
                  </div>
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
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                  <div>
                    <p className="text-muted-foreground">Blood Pressure</p>
                    <p className="font-medium">{assessment.blood_pressure}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sugar Level</p>
                    <p className="font-medium">{assessment.sugar_level}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Heart Rate</p>
                    <p className="font-medium">{assessment.heart_rate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Weight</p>
                    <p className="font-medium">{assessment.weight}</p>
                  </div>
                </div>
                <Button asChild variant="outline">
                  <Link href={`/patient/assessments/${assessment.id}`}>View Details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
