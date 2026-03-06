import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, HeartPulse, Activity, Cpu, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const features = [
  { icon: HeartPulse, text: "Maternal Risk Prediction" },
  { icon: Activity, text: "Fetal Heart Rate Analysis" },
  { icon: Cpu, text: "AI Medical Insights" },
];

export default function Payment() {
  const [showSuccess, setShowSuccess] = useState(false);

  return (
    <div className="max-w-md mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-border/60 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-primary to-accent" />
          <CardHeader className="text-center pb-2">
            <div className="mx-auto p-3 rounded-2xl bg-primary/10 w-fit mb-3">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Medical AI Analysis Plan</CardTitle>
            <p className="text-sm text-muted-foreground">Complete access to AI health predictions</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              {features.map((f) => (
                <div key={f.text} className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-success/10">
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{f.text}</span>
                </div>
              ))}
            </div>

            <div className="text-center py-4">
              <div className="text-4xl font-display font-bold text-foreground">₹199</div>
              <p className="text-sm text-muted-foreground">Demo Access</p>
            </div>

            <Button className="w-full" size="lg" onClick={() => setShowSuccess(true)}>
              Pay Now
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="text-center sm:max-w-sm">
          <DialogHeader>
            <div className="mx-auto p-3 rounded-full bg-success/10 w-fit mb-2">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <DialogTitle className="text-xl">Payment Successful!</DialogTitle>
            <DialogDescription>
              Your demo payment of ₹199 has been processed. You now have full access to all AI prediction features.
            </DialogDescription>
          </DialogHeader>
          <Button className="w-full mt-2" onClick={() => setShowSuccess(false)}>
            Continue to Dashboard
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
