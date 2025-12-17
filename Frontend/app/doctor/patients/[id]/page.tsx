import { notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { ArrowLeft, Calendar, Phone, Mail, FileText } from "lucide-react"

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  const doctor = user?.doctor

  if (!doctor) return null

  const patients = await sql`
    SELECT p.*, u.email
    FROM patients p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = ${id} AND p.linked_doctor_id = ${doctor.id}
  `

  if (patients.length === 0) {
    notFound()
  }

  const patient = patients[0]

  const assessments = await sql`
    SELECT * FROM assessments 
    WHERE patient_id = ${id}
    ORDER BY created_at DESC
  `

  const initials = patient.full_name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/doctor/patients">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">{patient.full_name}</h2>
          <p className="text-muted-foreground">Patient Details</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Patient Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-[var(--patient-primary)] text-lg text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{patient.full_name}</CardTitle>
                <CardDescription>Week {patient.pregnancy_week || "N/A"}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {patient.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{patient.email}</span>
              </div>
            )}
            {patient.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{patient.phone}</span>
              </div>
            )}
            {patient.date_of_birth && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(patient.date_of_birth).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assessments List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Assessments</CardTitle>
            <CardDescription>All health analyses for this patient</CardDescription>
          </CardHeader>
          <CardContent>
            {assessments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No assessments yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4"
                  >
                    <div>
                      <p className="font-medium">Assessment #{assessment.id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(assessment.created_at).toLocaleDateString()} at{" "}
                        {new Date(assessment.created_at).toLocaleTimeString()}
                      </p>
                      <p className="mt-1 text-sm">
                        BP: {assessment.blood_pressure} • HR: {assessment.heart_rate}
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
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/doctor/assessments/${assessment.id}`}>View</Link>
                      </Button>
                    </div>
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
