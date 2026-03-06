import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const fields = [
  { name: "baseline", label: "Baseline Value", placeholder: "e.g. 120" },
  { name: "accelerations", label: "Accelerations", placeholder: "e.g. 0.003" },
  { name: "fetalMovement", label: "Fetal Movement", placeholder: "e.g. 0.0" },
  { name: "uterineContractions", label: "Uterine Contractions", placeholder: "e.g. 0.004" },
];

type FetalResult = "Normal" | "Suspect" | "Pathological";

const resultConfig: Record<
  FetalResult,
  { color: string; bg: string; icon: typeof CheckCircle; desc: string }
> = {
  Normal: {
    color: "text-success",
    bg: "bg-success/10",
    icon: CheckCircle,
    desc: "Fetal health appears normal. Continue routine monitoring.",
  },
  Suspect: {
    color: "text-warning",
    bg: "bg-warning/10",
    icon: AlertTriangle,
    desc: "Some indicators require attention. Further evaluation recommended.",
  },
  Pathological: {
    color: "text-destructive",
    bg: "bg-destructive/10",
    icon: XCircle,
    desc: "Critical indicators detected. Immediate medical attention advised.",
  },
};

export default function FetalPrediction() {
  const [form, setForm] = useState<Record<string, string>>({});
  const [result, setResult] = useState<FetalResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    const empty = fields.some((f) => !form[f.name]);

    if (empty) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/predict-fhr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          baseline: Number(form.baseline),
          accelerations: Number(form.accelerations),
          fetal_movement: Number(form.fetalMovement),
          uterine_contractions: Number(form.uterineContractions),
        }),
      });

      if (!res.ok) {
        throw new Error("Backend request failed");
      }

      const data = await res.json();

      setResult(data.fetal_health);

      toast.success("Fetal health analysis completed");
    } catch (error) {
      console.error(error);
      toast.error("Failed to connect to prediction server");
    } finally {
      setLoading(false);
    }
  };

  const config = result ? resultConfig[result] : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent/10">
              <Activity className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-lg">Fetal Heart Rate Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">
                Enter CTG parameters for analysis
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
                  step="any"
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
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Analyze Fetal Health"}
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence>
        {config && result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card
              className={`border-2 ${
                result === "Pathological"
                  ? "border-destructive/30"
                  : result === "Suspect"
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
                    Analysis Result
                  </p>
                  <p
                    className={`text-2xl font-display font-bold ${config.color}`}
                  >
                    {result}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {config.desc}
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