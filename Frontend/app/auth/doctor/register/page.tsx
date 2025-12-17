import { AuthLayout } from "@/components/auth/auth-layout"
import { DoctorRegisterForm } from "@/components/auth/doctor-register-form"

export default function DoctorRegisterPage() {
  return (
    <AuthLayout variant="doctor">
      <DoctorRegisterForm />
    </AuthLayout>
  )
}
