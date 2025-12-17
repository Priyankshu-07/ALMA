import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { Users } from "lucide-react"

export default async function DoctorPatientsPage() {
  const user = await getCurrentUser()
  const doctor = user?.doctor

  if (!doctor) return null

  const patients = await sql`
    SELECT p.*, 
      (SELECT COUNT(*) FROM assessments WHERE patient_id = p.id) as assessment_count,
      (SELECT risk_category FROM assessments WHERE patient_id = p.id ORDER BY created_at DESC LIMIT 1) as latest_risk
    FROM patients p
    WHERE p.linked_doctor_id = ${doctor.id}
    ORDER BY p.created_at DESC
  `

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Patients</h2>
        <p className="text-muted-foreground">Manage your linked patients</p>
      </div>

      {patients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No Patients Yet</h3>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              Share your doctor code with patients to link their accounts
            </p>
            <div className="mt-4 rounded-lg bg-secondary px-4 py-2">
              <p className="text-xs text-muted-foreground">Your Doctor Code</p>
              <p className="font-mono text-lg font-semibold">{doctor.doctor_code}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {patients.map((patient) => {
            const initials = patient.full_name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)

            return (
              <Card key={patient.id} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-[var(--patient-primary)] text-primary-foreground">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{patient.full_name}</CardTitle>
                        <CardDescription>Week {patient.pregnancy_week || "N/A"}</CardDescription>
                      </div>
                    </div>
                    {patient.latest_risk && (
                      <Badge
                        variant={
                          patient.latest_risk === "HIGH"
                            ? "destructive"
                            : patient.latest_risk === "MEDIUM"
                              ? "secondary"
                              : "default"
                        }
                      >
                        {patient.latest_risk}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Assessments</span>
                    <span className="font-medium">{patient.assessment_count}</span>
                  </div>
                  <Button asChild className="w-full bg-transparent" variant="outline">
                    <Link href={`/doctor/patients/${patient.id}`}>View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
