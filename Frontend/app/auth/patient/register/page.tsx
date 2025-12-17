import { AuthLayout } from "@/components/auth/auth-layout"
import { PatientRegisterForm } from "@/components/auth/patient-register-form"

export default function PatientRegisterPage() {
  return (
    <AuthLayout variant="patient">
      <PatientRegisterForm />
    </AuthLayout>
  )
}
