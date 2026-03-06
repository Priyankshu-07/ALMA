import { HeartPulse, Activity, Cpu, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const cards = [
  {
    title: "Maternal Health Prediction",
    description: "Predict maternal health risks using vitals like blood pressure, blood sugar, and heart rate.",
    icon: HeartPulse,
    route: "/maternal",
    stat: "6 Parameters",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Fetal Heart Rate Analysis",
    description: "Analyze CTG data to classify fetal health as Normal, Suspect, or Pathological.",
    icon: Activity,
    route: "/fetal",
    stat: "CTG Analysis",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    title: "AI System Status",
    description: "Machine learning models are trained and ready for real-time predictions.",
    icon: Cpu,
    route: "#",
    stat: "Online",
    color: "text-success",
    bgColor: "bg-success/10",
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">
          Welcome to Fetal Health AI
        </h2>
        <p className="text-muted-foreground mt-1">
          AI-powered maternal and fetal health risk prediction system
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-border/60"
              onClick={() => card.route !== "#" && navigate(card.route)}
            >
              <CardHeader className="flex flex-row items-start gap-4 pb-2">
                <div className={`p-3 rounded-xl ${card.bgColor}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base font-semibold">{card.title}</CardTitle>
                  <span className={`text-xs font-medium ${card.color}`}>{card.stat}</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{card.description}</p>
                {card.route !== "#" && (
                  <Button variant="ghost" size="sm" className="group-hover:text-primary p-0 h-auto">
                    Get started <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-medium text-foreground">All AI models operational</span>
            <span className="text-xs text-muted-foreground ml-auto">Last updated: just now</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
