import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { Users, Brain, BookOpen, GraduationCap, Github } from "lucide-react";

const teamMembers = [
  { name: "Team Member 1", role: "ML Engineer", focus: "Model Training & Optimization" },
  { name: "Team Member 2", role: "Frontend Developer", focus: "Dashboard & UI Design" },
  { name: "Team Member 3", role: "Backend Developer", focus: "API & Data Pipeline" },
  { name: "Team Member 4", role: "Research Lead", focus: "Medical Data Analysis" },
];

const models = [
  {
    name: "Maternal Risk Classifier",
    algorithm: "Random Forest",
    accuracy: "92%",
    dataset: "UCI Maternal Health Risk Dataset",
    features: ["Age", "Systolic BP", "Diastolic BP", "Blood Sugar", "Body Temp", "Heart Rate"],
    output: "Low / Mid / High Risk",
  },
  {
    name: "Fetal Health Classifier",
    algorithm: "XGBoost",
    accuracy: "94%",
    dataset: "CTG Cardiotocography Dataset",
    features: ["Baseline Value", "Accelerations", "Fetal Movement", "Uterine Contractions", "Light Decelerations", "Severe Decelerations"],
    output: "Normal / Suspect / Pathological",
  },
];

const fade = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.08, duration: 0.4 },
});

const About = () => (
  <div className="space-y-8 max-w-4xl">
    {/* Project Overview */}
    <motion.div {...fade(0)}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">About Fetal Health AI</CardTitle>
              <CardDescription>Final Year College Project</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Fetal Health AI is a machine learning–powered system designed to assist healthcare professionals in predicting maternal health risks and classifying fetal heart rate conditions from CTG (Cardiotocography) data.
          </p>
          <p>
            Built as a final year project, it demonstrates how AI can support early detection and informed clinical decision-making in prenatal care.
          </p>
        </CardContent>
      </Card>
    </motion.div>

    {/* Team */}
    <motion.div {...fade(1)}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent/10">
              <Users className="h-6 w-6 text-accent" />
            </div>
            <CardTitle className="text-xl">Team</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {teamMembers.map((m) => (
              <div key={m.name} className="rounded-lg border bg-muted/40 p-4 space-y-1">
                <p className="font-semibold text-foreground">{m.name}</p>
                <Badge variant="secondary" className="text-xs">{m.role}</Badge>
                <p className="text-xs text-muted-foreground">{m.focus}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>

    {/* ML Models */}
    <motion.div {...fade(2)}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-success/10">
              <Brain className="h-6 w-6 text-success" />
            </div>
            <CardTitle className="text-xl">ML Model Documentation</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {models.map((model, i) => (
            <div key={model.name}>
              {i > 0 && <Separator className="mb-6" />}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-semibold text-foreground">{model.name}</h3>
                  <Badge className="bg-success/10 text-success border-0">{model.accuracy} Accuracy</Badge>
                </div>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">Algorithm:</span>{" "}
                    <span className="font-medium text-foreground">{model.algorithm}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dataset:</span>{" "}
                    <span className="font-medium text-foreground">{model.dataset}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Output:</span>{" "}
                    <span className="font-medium text-foreground">{model.output}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Input Features</p>
                  <div className="flex flex-wrap gap-1.5">
                    {model.features.map((f) => (
                      <Badge key={f} variant="outline" className="text-xs font-normal">{f}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>

    {/* Tech Stack */}
    <motion.div {...fade(3)}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Tech Stack</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {["React", "Tailwind CSS", "TypeScript", "Python", "FastAPI", "scikit-learn", "XGBoost", "Pandas"].map((t) => (
              <Badge key={t} variant="secondary">{t}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  </div>
);

export default About;
