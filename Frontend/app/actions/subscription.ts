"use server"

import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function createSubscription(planId: string) {
  const user = await getCurrentUser()

  if (!user || user.role !== "PATIENT" || !user.patient) {
    return { error: "Unauthorized" }
  }

  const patientId = user.patient.id

  const now = new Date()
  let periodEnd: Date

  switch (planId) {
    case "monthly":
      periodEnd = new Date(now.setMonth(now.getMonth() + 1))
      break
    case "quarterly":
      periodEnd = new Date(now.setMonth(now.getMonth() + 3))
      break
    case "annual":
      periodEnd = new Date(now.setFullYear(now.getFullYear() + 1))
      break
    default:
      periodEnd = new Date(now.setMonth(now.getMonth() + 1))
  }

  try {
    await sql`
      UPDATE subscriptions SET status = 'CANCELLED' WHERE patient_id = ${patientId} AND status = 'ACTIVE'
    `

    await sql`
      INSERT INTO subscriptions (patient_id, plan, status, current_period_end)
      VALUES (${patientId}, ${planId.toUpperCase()}, 'ACTIVE', ${periodEnd.toISOString()})
    `

    return { success: true }
  } catch (error) {
    console.error("Subscription error:", error)
    return { error: "Failed to create subscription" }
  }
}
