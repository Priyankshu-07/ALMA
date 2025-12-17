import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, AlertTriangle, Clock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default async function DoctorDashboardPage() {
  const user = await getCurrentUser()
  const doctor = user?.doctor

  if (!doctor) return null

  // Fetch statistics
  const patientsResult = await sql`
    SELECT COUNT(*) as count FROM patients WHERE linked_doctor_id = ${doctor.id}
  `
  const patientCount = Number(patientsResult[0].count)

  const assessmentsResult = await sql`
    SELECT COUNT(*) as count FROM assessments WHERE doctor_id = ${doctor.id}
  `
  const assessmentCount = Number(assessmentsResult[0].count)

  const pendingResult = await sql`
    SELECT COUNT(*) as count FROM assessments 
    WHERE doctor_id = ${doctor.id} AND ml_status = 'PENDING'
  `
  const pendingCount = Number(pendingResult[0].count)

  const highRiskResult = await sql`
    SELECT COUNT(*) as count FROM assessments 
    WHERE doctor_id = ${doctor.id} AND risk_category = 'HIGH'
  `
  const highRiskCount = Number(highRiskResult[0].count)

  // Fetch recent assessments with patient info
  const recentAssessments = await sql`
    SELECT a.*, p.full_name as patient_name, p.pregnancy_week
    FROM assessments a
    JOIN patients p ON a.patient_id = p.id
    WHERE a.doctor_id = ${doctor.id}
    ORDER BY a.created_at DESC
    LIMIT 5
  `

  // Fetch recent patients
  const recentPatients = await sql`
    SELECT * FROM patients 
    WHERE linked_doctor_id = ${doctor.id}
    ORDER BY created_at DESC
    LIMIT 5
  `

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Welcome, Dr. {doctor.full_name.split(" ").pop()}</h2>
        <p className="text-muted-foreground">Here&apos;s an overview of your practice</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patientCount}</div>
            <p className="text-xs text-muted-foreground">Linked to your account</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assessmentCount}</div>
            <p className="text-xs text-muted-foreground">AI analyses completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting AI analysis</p>
          </CardContent>
        </Card>
        <Card className={highRiskCount > 0 ? "border-destructive/50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">High Risk Cases</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${highRiskCount > 0 ? "text-destructive" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${highRiskCount > 0 ? "text-destructive" : ""}`}>{highRiskCount}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Assessments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Assessments</CardTitle>
                <CardDescription>Latest patient health analyses</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/doctor/assessments">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentAssessments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assessments yet</p>
            ) : (
              <div className="space-y-4">
                {recentAssessments.map((assessment) => (
                  <div key={assessment.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{assessment.patient_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Week {assessment.pregnancy_week} • {new Date(assessment.created_at).toLocaleDateString()}
                      </p>
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Patients */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Patients</CardTitle>
                <CardDescription>Recently added to your practice</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/doctor/patients">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentPatients.length === 0 ? (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">No patients linked yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Share your doctor code <span className="font-mono font-semibold">{doctor.doctor_code}</span> with
                  patients
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentPatients.map((patient) => (
                  <div key={patient.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{patient.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Week {patient.pregnancy_week || "N/A"} • Joined{" "}
                        {new Date(patient.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/doctor/patients/${patient.id}`}>View</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
