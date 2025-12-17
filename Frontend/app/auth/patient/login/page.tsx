import { AuthLayout } from "@/components/auth/auth-layout"
import { PatientLoginForm } from "@/components/auth/patient-login-form"

export default function PatientLoginPage() {
  return (
    <AuthLayout variant="patient">
      <PatientLoginForm />
    </AuthLayout>
  )
}
