import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET() {
  const user = await getCurrentUser()

  if (!user || user.role !== "PATIENT" || !user.patient) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let linkedDoctor = null
  if (user.patient.linked_doctor_id) {
    const doctors = await sql`
      SELECT * FROM doctors WHERE id = ${user.patient.linked_doctor_id}
    `
    linkedDoctor = doctors[0] || null
  }

  return NextResponse.json({
    patient: {
      ...user.patient,
      email: user.email,
    },
    linkedDoctor,
  })
}
