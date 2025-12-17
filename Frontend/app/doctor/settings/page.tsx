import { getCurrentUser } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export default async function DoctorSettingsPage() {
  const user = await getCurrentUser()
  const doctor = user?.doctor

  if (!doctor) return null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your professional details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={doctor.full_name} disabled />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Registration Number</Label>
              <Input value={doctor.registration_number} disabled />
            </div>
            <div className="space-y-2">
              <Label>Specialization</Label>
              <Input value={doctor.specialization || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Hospital/Clinic</Label>
              <Input value={doctor.hospital_name || ""} disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Doctor Code</CardTitle>
            <CardDescription>Share this code with patients to link their accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1 rounded-lg bg-secondary p-4 text-center">
                <p className="font-mono text-2xl font-bold tracking-wider">{doctor.doctor_code}</p>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              When patients register, they can enter this code to automatically link their account to your practice.
              This allows you to view their assessments and health data.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
