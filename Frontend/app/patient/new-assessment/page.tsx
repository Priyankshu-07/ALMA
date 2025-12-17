import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { NewAssessmentForm } from "@/components/patient/new-assessment-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export default async function NewAssessmentPage() {
  const user = await getCurrentUser()
  const patient = user?.patient

  if (!patient) redirect("/auth/patient/login")

  // Check subscription
  const subscriptions = await sql`
    SELECT * FROM subscriptions 
    WHERE patient_id = ${patient.id} AND status = 'ACTIVE'
    LIMIT 1
  `

  if (subscriptions.length === 0) {
    redirect("/patient/subscribe")
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">New Health Assessment</h2>
        <p className="text-muted-foreground">Upload your health data for AI analysis</p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          Please ensure all information is accurate. This data will be analyzed by our AI system and shared with your
          linked healthcare provider. AI can make mistakes - always verify results with a medical professional.
        </AlertDescription>
      </Alert>

      <NewAssessmentForm patientId={patient.id} doctorId={patient.linked_doctor_id} />
    </div>
  )
}
