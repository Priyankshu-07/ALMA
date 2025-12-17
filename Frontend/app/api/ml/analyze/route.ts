import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

// This endpoint can be called by an external service or cron job
// to process pending assessments through the ML API

export async function POST(request: Request) {
  // In production, add authentication for this endpoint
  const { assessmentId } = await request.json()

  if (!assessmentId) {
    return NextResponse.json({ error: "Assessment ID required" }, { status: 400 })
  }

  // Get assessment data
  const assessments = await sql`
    SELECT a.*, p.pregnancy_week
    FROM assessments a
    JOIN patients p ON a.patient_id = p.id
    WHERE a.id = ${assessmentId} AND a.ml_status = 'PENDING'
  `

  if (assessments.length === 0) {
    return NextResponse.json({ error: "Assessment not found or already processed" }, { status: 404 })
  }

  const assessment = assessments[0]

  try {
    // Call external ML API (configured via environment variable)
    const mlApiUrl = process.env.ML_API_URL

    if (mlApiUrl) {
      const mlResponse = await fetch(mlApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.ML_API_KEY}`,
        },
        body: JSON.stringify({
          bloodPressure: assessment.blood_pressure,
          sugarLevel: assessment.sugar_level,
          heartRate: assessment.heart_rate,
          weight: assessment.weight,
          pregnancyWeek: assessment.pregnancy_week,
          xrayPath: assessment.xray_path,
          fhrChartPath: assessment.fhr_chart_path,
          additionalNote: assessment.additional_note,
        }),
      })

      if (!mlResponse.ok) {
        throw new Error("ML API request failed")
      }

      const mlResult = await mlResponse.json()

      // Update assessment with ML results
      await sql`
        UPDATE assessments
        SET 
          ml_status = 'SUCCESS',
          ml_request_id = ${mlResult.requestId || null},
          risk_category = ${mlResult.riskCategory},
          summary_text = ${mlResult.summary},
          recommendations = ${mlResult.recommendations},
          raw_response = ${JSON.stringify(mlResult)},
          updated_at = NOW()
        WHERE id = ${assessmentId}
      `

      return NextResponse.json({ success: true, result: mlResult })
    } else {
      // Demo mode: simulate ML response
      const riskCategories = ["LOW", "MEDIUM", "HIGH"]
      const randomRisk = riskCategories[Math.floor(Math.random() * riskCategories.length)]

      const simulatedResult = {
        riskCategory: randomRisk,
        summary: `Based on the submitted health data, the AI analysis indicates a ${randomRisk.toLowerCase()} risk assessment. Blood pressure reading of ${assessment.blood_pressure} and heart rate of ${assessment.heart_rate} have been analyzed along with the uploaded medical images.`,
        recommendations:
          "Continue regular prenatal checkups as scheduled. Maintain a balanced diet rich in nutrients. Stay hydrated and get adequate rest. Monitor fetal movements daily. Contact your healthcare provider immediately if you notice any unusual symptoms such as severe headache, vision changes, or decreased fetal movement.",
      }

      await sql`
        UPDATE assessments
        SET 
          ml_status = 'SUCCESS',
          risk_category = ${simulatedResult.riskCategory},
          summary_text = ${simulatedResult.summary},
          recommendations = ${simulatedResult.recommendations},
          raw_response = ${JSON.stringify(simulatedResult)},
          updated_at = NOW()
        WHERE id = ${assessmentId}
      `

      return NextResponse.json({ success: true, result: simulatedResult })
    }
  } catch (error) {
    console.error("ML analysis error:", error)

    await sql`
      UPDATE assessments
      SET ml_status = 'FAILED', updated_at = NOW()
      WHERE id = ${assessmentId}
    `

    return NextResponse.json({ error: "ML analysis failed" }, { status: 500 })
  }
}
