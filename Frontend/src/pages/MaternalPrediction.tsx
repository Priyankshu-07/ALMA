import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HeartPulse, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const fields = [
  { name: "age", label: "Age", placeholder: "e.g. 25" },
  { name: "systolicBP", label: "Systolic BP", placeholder: "e.g. 120" },
  { name: "diastolicBP", label: "Diastolic BP", placeholder: "e.g. 80" },
  { name: "bloodSugar", label: "Blood Sugar (mmol/L)", placeholder: "e.g. 7.5" },
  { name: "bodyTemp", label: "Body Temperature (°F)", placeholder: "e.g. 98.6" },
  { name: "heartRate", label: "Heart Rate (bpm)", placeholder: "e.g. 76" },
];

type RiskLevel = "low" | "mid" | "high";

const riskConfig: Record<
  RiskLevel,
  { label: string; color: string; bg: string; icon: typeof CheckCircle }
> = {
  low: {
    label: "Low Risk",
    color: "text-success",
    bg: "bg-success/10",
    icon: CheckCircle,
  },
  mid: {
    label: "Mid Risk",
    color: "text-warning",
    bg: "bg-warning/10",
    icon: AlertTriangle,
  },
  high: {
    label: "High Risk",
    color: "text-destructive",
    bg: "bg-destructive/10",
    icon: XCircle,
  },
};

export default function MaternalPrediction() {
  const [form, setForm] = useState<Record<string, string>>({});
  const [result, setResult] = useState<RiskLevel | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    const empty = fields.some((f) => !form[f.name]);

    if (empty) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/predict-maternal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          age: Number(form.age),
          systolic_bp: Number(form.systolicBP),
          diastolic_bp: Number(form.diastolicBP),
          blood_sugar: Number(form.bloodSugar),
          body_temp: Number(form.bodyTemp),
          heart_rate: Number(form.heartRate),
        }),
      });

      if (!res.ok) {
        throw new Error("Backend request failed");
      }

      const data = await res.json();

      // Backend returns numeric classes
      const riskMap: Record<number, RiskLevel> = {
        0: "low",
        1: "mid",
        2: "high",
      };

      setResult(riskMap[data.risk_level]);

      toast.success("Prediction completed");
    } catch (error) {
      console.error(error);
      toast.error("Failed to connect to prediction server");
    } finally {
      setLoading(false);
    }
  };

  const config = result ? riskConfig[result] : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <HeartPulse className="h-5 w-5 text-primary" />
            </div>

            <div>
              <CardTitle className="text-lg">
                Maternal Risk Prediction
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Enter maternal health parameters
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.name} className="space-y-1.5">
                <Label htmlFor={f.name} className="text-sm font-medium">
                  {f.label}
                </Label>

                <Input
                  id={f.name}
                  type="number"
                  placeholder={f.placeholder}
                  value={form[f.name] || ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      [f.name]: e.target.value,
                    }))
                  }
                />
              </div>
            ))}
          </div>

          <Button
            className="w-full mt-6"
            size="lg"
            onClick={handlePredict}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Predict Risk"}
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence>
        {config && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card
              className={`border-2 ${
                result === "high"
                  ? "border-destructive/30"
                  : result === "mid"
                  ? "border-warning/30"
                  : "border-success/30"
              }`}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${config.bg}`}>
                  <config.icon className={`h-8 w-8 ${config.color}`} />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Prediction Result
                  </p>
                  <p
                    className={`text-2xl font-display font-bold ${config.color}`}
                  >
                    {config.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}