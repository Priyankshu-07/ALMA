"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2 } from "lucide-react"
import { createSubscription } from "@/app/actions/subscription"

const plans = [
  {
    id: "monthly",
    name: "Monthly",
    price: "$9.99",
    period: "/month",
    features: [
      "Unlimited assessments",
      "AI-powered analysis",
      "PDF reports",
      "Chat with AI assistant",
      "Doctor linkage",
    ],
    popular: false,
  },
  {
    id: "quarterly",
    name: "Quarterly",
    price: "$24.99",
    period: "/3 months",
    features: ["Everything in Monthly", "Priority support", "Extended history", "Save 17%"],
    popular: true,
  },
  {
    id: "annual",
    name: "Annual",
    price: "$89.99",
    period: "/year",
    features: ["Everything in Quarterly", "Full pregnancy coverage", "Family sharing", "Save 25%"],
    popular: false,
  },
]

export default function SubscribePage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubscribe(planId: string) {
    setIsLoading(true)
    setSelectedPlan(planId)

    const result = await createSubscription(planId)

    if (result.success) {
      router.push("/patient/dashboard")
    } else {
      setIsLoading(false)
      setSelectedPlan(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Choose Your Plan</h2>
        <p className="mt-2 text-muted-foreground">Select a subscription plan to start tracking your pregnancy health</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.popular ? "border-[var(--patient-primary)] border-2" : ""}`}>
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--patient-primary)]">
                Most Popular
              </Badge>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-[var(--success)]" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className={`w-full ${plan.popular ? "bg-[var(--patient-primary)] hover:bg-[var(--patient-primary)]/90" : "bg-transparent"}`}
                variant={plan.popular ? "default" : "outline"}
                onClick={() => handleSubscribe(plan.id)}
                disabled={isLoading}
              >
                {isLoading && selectedPlan === plan.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Subscribe"
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        All plans include a 7-day free trial. Cancel anytime. By subscribing, you agree to our Terms of Service.
      </p>
    </div>
  )
}
