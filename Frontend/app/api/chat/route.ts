import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { streamText } from "ai"

export async function POST(request: Request) {
  const user = await getCurrentUser()

  if (!user || user.role !== "PATIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { assessmentId, message, context } = await request.json()

  if (!assessmentId || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // Verify the assessment belongs to the user
  const assessments = await sql`
    SELECT * FROM assessments 
    WHERE id = ${assessmentId} AND patient_id = ${user.patient?.id}
  `

  if (assessments.length === 0) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 })
  }

  try {
    // Save user message
    const userMsgResult = await sql`
      INSERT INTO chat_messages (assessment_id, sender, content)
      VALUES (${assessmentId}, 'PATIENT', ${message})
      RETURNING *
    `

    // Generate AI response using AI SDK
    const systemPrompt = `You are a helpful maternal health assistant providing information about pregnancy health assessments. 

IMPORTANT DISCLAIMERS TO ALWAYS INCLUDE:
- You are an AI assistant and can make mistakes
- Your responses are for informational purposes only
- Always recommend consulting with a healthcare provider for medical decisions
- You cannot diagnose conditions or prescribe treatments

Current assessment context:
- Blood Pressure: ${context.bloodPressure || "Not provided"}
- Sugar Level: ${context.sugarLevel || "Not provided"}  
- Heart Rate: ${context.heartRate || "Not provided"}
- Weight: ${context.weight || "Not provided"}
- Risk Category: ${context.riskCategory || "Pending analysis"}
- Summary: ${context.summary || "Analysis not yet complete"}

Provide helpful, empathetic responses about general pregnancy health. Always be supportive and encourage the user to discuss concerns with their healthcare provider.`

    const { text } = await streamText({
      model: "openai/gpt-4o-mini",
      system: systemPrompt,
      prompt: message,
    })

    // Get the full response
    let aiResponse = ""
    for await (const chunk of text) {
      aiResponse += chunk
    }

    // Save AI response
    const aiMsgResult = await sql`
      INSERT INTO chat_messages (assessment_id, sender, content)
      VALUES (${assessmentId}, 'AI', ${aiResponse})
      RETURNING *
    `

    return NextResponse.json({
      userMessage: userMsgResult[0],
      aiMessage: aiMsgResult[0],
    })
  } catch (error) {
    console.error("Chat API error:", error)

    // Fallback response if AI fails
    const fallbackResponse =
      "I apologize, but I'm having trouble processing your request right now. Please try again later or contact your healthcare provider directly for urgent concerns. Remember, I'm an AI assistant and my responses are for informational purposes only."

    const aiMsgResult = await sql`
      INSERT INTO chat_messages (assessment_id, sender, content)
      VALUES (${assessmentId}, 'AI', ${fallbackResponse})
      RETURNING *
    `

    const userMsgResult = await sql`
      SELECT * FROM chat_messages 
      WHERE assessment_id = ${assessmentId} AND sender = 'PATIENT'
      ORDER BY created_at DESC LIMIT 1
    `

    return NextResponse.json({
      userMessage: userMsgResult[0],
      aiMessage: aiMsgResult[0],
    })
  }
}
