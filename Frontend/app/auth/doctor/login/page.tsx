import { AuthLayout } from "@/components/auth/auth-layout"
import { DoctorLoginForm } from "@/components/auth/doctor-login-form"

export default function DoctorLoginPage() {
  return (
    <AuthLayout variant="doctor">
      <DoctorLoginForm />
    </AuthLayout>
  )
}
