"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Loader2, Bot, User } from "lucide-react"
import type { Assessment, ChatMessage } from "@/lib/db"

interface AssessmentChatProps {
  assessmentId: string
  assessment: Assessment
  initialMessages: ChatMessage[]
}

export function AssessmentChat({ assessmentId, assessment, initialMessages }: AssessmentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setIsLoading(true)

    // Optimistically add user message
    const tempUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      assessment_id: assessmentId,
      sender: "PATIENT",
      content: userMessage,
      created_at: new Date(),
    }
    setMessages((prev) => [...prev, tempUserMessage])

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId,
          message: userMessage,
          context: {
            bloodPressure: assessment.blood_pressure,
            sugarLevel: assessment.sugar_level,
            heartRate: assessment.heart_rate,
            weight: assessment.weight,
            riskCategory: assessment.risk_category,
            summary: assessment.summary_text,
          },
        }),
      })

      const data = await res.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Add AI response
      setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMessage.id), data.userMessage, data.aiMessage])
    } catch (error) {
      console.error("Chat error:", error)
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id))
    }

    setIsLoading(false)
  }

  return (
    <Card className="flex h-[600px] flex-col">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-[var(--patient-primary)]" />
          Health Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Bot className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Start a Conversation</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Ask questions about your assessment results, health recommendations, or general pregnancy health
              information.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {["What do my results mean?", "How can I improve my health?", "Is my blood pressure normal?"].map(
                (suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(suggestion)}
                    className="text-xs"
                  >
                    {suggestion}
                  </Button>
                ),
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.sender === "PATIENT" ? "flex-row-reverse" : ""}`}>
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback
                    className={
                      message.sender === "AI" ? "bg-[var(--patient-primary)] text-primary-foreground" : "bg-secondary"
                    }
                  >
                    {message.sender === "AI" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.sender === "PATIENT"
                      ? "bg-[var(--patient-primary)] text-primary-foreground"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-[var(--patient-primary)] text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-lg bg-secondary px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t border-border p-4">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your health..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="bg-[var(--patient-primary)] hover:bg-[var(--patient-primary)]/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
