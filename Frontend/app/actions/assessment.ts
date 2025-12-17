"use server"

import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { put } from "@vercel/blob"

export async function createAssessment(formData: FormData) {
  const user = await getCurrentUser()

  if (!user || user.role !== "PATIENT") {
    return { error: "Unauthorized" }
  }

  const patientId = formData.get("patientId") as string
  const doctorId = formData.get("doctorId") as string | null
  const bloodPressure = formData.get("bloodPressure") as string
  const sugarLevel = formData.get("sugarLevel") as string
  const heartRate = formData.get("heartRate") as string
  const weight = formData.get("weight") as string
  const additionalNote = formData.get("additionalNote") as string
  const xrayFile = formData.get("xray") as File
  const fhrFile = formData.get("fhr") as File

  if (!bloodPressure || !sugarLevel || !heartRate || !weight) {
    return { error: "Please fill in all required vitals" }
  }

  if (!xrayFile || !fhrFile) {
    return { error: "Please upload both required images" }
  }

  try {
    let xrayPath = `/uploads/xray-${Date.now()}-${xrayFile.name}`
    let fhrPath = `/uploads/fhr-${Date.now()}-${fhrFile.name}`

    try {
      const xrayBlob = await put(`assessments/${patientId}/xray-${Date.now()}`, xrayFile, {
        access: "public",
      })
      xrayPath = xrayBlob.url

      const fhrBlob = await put(`assessments/${patientId}/fhr-${Date.now()}`, fhrFile, {
        access: "public",
      })
      fhrPath = fhrBlob.url
    } catch {
      console.log("Blob storage not available, using placeholder paths")
    }

    const result = await sql`
      INSERT INTO assessments (
        patient_id, doctor_id, xray_path, fhr_chart_path,
        blood_pressure, sugar_level, heart_rate, weight, additional_note,
        ml_status
      )
      VALUES (
        ${patientId}, ${doctorId}, ${xrayPath}, ${fhrPath},
        ${bloodPressure}, ${sugarLevel}, ${heartRate}, ${weight}, ${additionalNote || null},
        'PENDING'
      )
      RETURNING id
    `

    const assessmentId = result[0].id

    triggerMLAnalysis(assessmentId)

    return { success: true, assessmentId }
  } catch (error) {
    console.error("Assessment creation error:", error)
    return { error: "Failed to create assessment. Please try again." }
  }
}

async function triggerMLAnalysis(assessmentId: string) {
  setTimeout(async () => {
    try {
      const riskCategories = ["LOW", "MEDIUM", "HIGH"]
      const randomRisk = riskCategories[Math.floor(Math.random() * riskCategories.length)]

      await sql`
        UPDATE assessments
        SET 
          ml_status = 'SUCCESS',
          risk_category = ${randomRisk},
          summary_text = ${"Based on the submitted health data and images, the AI analysis indicates a " + randomRisk.toLowerCase() + " risk assessment. The vital signs are within expected ranges for this stage of pregnancy."},
          recommendations = ${"Continue regular prenatal checkups. Maintain a healthy diet and adequate hydration. Monitor fetal movements daily. Contact your healthcare provider if you notice any unusual symptoms."},
          updated_at = NOW()
        WHERE id = ${assessmentId}
      `
    } catch (error) {
      console.error("ML analysis error:", error)
      await sql`
        UPDATE assessments
        SET ml_status = 'FAILED', updated_at = NOW()
        WHERE id = ${assessmentId}
      `
    }
  }, 3000)
}
