import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { FileText, AlertTriangle } from "lucide-react"

export default async function DoctorAssessmentsPage() {
  const user = await getCurrentUser()
  const doctor = user?.doctor

  if (!doctor) return null

  const assessments = await sql`
    SELECT a.*, p.full_name as patient_name, p.pregnancy_week
    FROM assessments a
    JOIN patients p ON a.patient_id = p.id
    WHERE a.doctor_id = ${doctor.id}
    ORDER BY a.created_at DESC
  `

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Assessments</h2>
        <p className="text-muted-foreground">Review patient health analyses</p>
      </div>

      {assessments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No Assessments Yet</h3>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              Patient assessments will appear here once submitted
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assessments.map((assessment) => (
            <Card key={assessment.id} className={assessment.risk_category === "HIGH" ? "border-destructive/50" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {assessment.patient_name}
                      {assessment.risk_category === "HIGH" && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    </CardTitle>
                    <CardDescription>
                      Week {assessment.pregnancy_week} • {new Date(assessment.created_at).toLocaleDateString()}
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
                {assessment.summary_text && (
                  <p className="mb-4 text-sm text-muted-foreground">{assessment.summary_text}</p>
                )}
                <Button asChild variant="outline">
                  <Link href={`/doctor/assessments/${assessment.id}`}>View Full Report</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
