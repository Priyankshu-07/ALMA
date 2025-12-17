import { notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { AssessmentChat } from "@/components/patient/assessment-chat"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, AlertTriangle } from "lucide-react"

export default async function AssessmentChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  const patient = user?.patient

  if (!patient) return null

  const assessments = await sql`
    SELECT * FROM assessments 
    WHERE id = ${id} AND patient_id = ${patient.id}
  `

  if (assessments.length === 0) {
    notFound()
  }

  const assessment = assessments[0]

  // Fetch existing chat messages
  const messages = await sql`
    SELECT * FROM chat_messages 
    WHERE assessment_id = ${id}
    ORDER BY created_at ASC
  `

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/patient/assessments/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">AI Health Assistant</h2>
          <p className="text-muted-foreground">Ask questions about your assessment</p>
        </div>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>AI Disclaimer</AlertTitle>
        <AlertDescription>
          This AI assistant provides general health information only. AI can make mistakes. It is not a substitute for
          professional medical advice. Always consult your healthcare provider for medical decisions.
        </AlertDescription>
      </Alert>

      <AssessmentChat assessmentId={id} assessment={assessment} initialMessages={messages} />
    </div>
  )
}
