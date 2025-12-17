import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function POST(request: Request) {
  const user = await getCurrentUser()

  if (!user || user.role !== "PATIENT" || !user.patient) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { doctorCode } = await request.json()

  if (!doctorCode) {
    return NextResponse.json({ error: "Doctor code is required" }, { status: 400 })
  }

  // Find doctor by code
  const doctors = await sql`
    SELECT * FROM doctors WHERE doctor_code = ${doctorCode.toUpperCase()}
  `

  if (doctors.length === 0) {
    return NextResponse.json({ error: "Invalid doctor code. Please check and try again." }, { status: 404 })
  }

  const doctor = doctors[0]

  // Update patient with linked doctor
  await sql`
    UPDATE patients SET linked_doctor_id = ${doctor.id}, updated_at = NOW()
    WHERE id = ${user.patient.id}
  `

  return NextResponse.json({ success: true, doctor })
}
