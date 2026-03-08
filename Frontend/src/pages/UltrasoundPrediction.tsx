import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ScanLine,
  CheckCircle,
  Smile,
  AlertTriangle,
  ImageIcon,
  XCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type ResultLevel = "normal" | "benign" | "malignant";

const resultConfig = {
  normal: {
    label: "Normal",
    emoji: "✅",
    color: "text-green-600",
    bg: "bg-green-100",
    border: "border-green-400",
    icon: CheckCircle,
    description:
      "Ultrasound shows a healthy fetus with no abnormalities detected."
  },
  benign: {
    label: "Benign",
    emoji: "😊",
    color: "text-yellow-600",
    bg: "bg-yellow-100",
    border: "border-yellow-400",
    icon: Smile,
    description:
      "Non-cancerous findings detected. Close monitoring recommended."
  },
  malignant: {
    label: "Malignant",
    emoji: "⚠️",
    color: "text-red-600",
    bg: "bg-red-100",
    border: "border-red-400",
    icon: AlertTriangle,
    description:
      "Potentially malignant findings detected. Immediate consultation required."
  }
};

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_SIZE_MB = 5;

export default function UltrasoundPrediction() {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ResultLevel | null>(null);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only PNG, JPG, JPEG, WEBP allowed");
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error("File too large (max 5MB)");
      return;
    }

    const url = URL.createObjectURL(file);

    setPreview(url);
    setFileName(file.name);
    setResult(null);
  };

  const handlePredict = async () => {
    if (!preview) {
      toast.error("Upload an ultrasound image first");
      return;
    }

    setLoading(true);

    try {
      const blob = await fetch(preview).then((r) => r.blob());

      const formData = new FormData();
      formData.append("file", blob, fileName);

      const res = await fetch("http://127.0.0.1:8000/predict-ultrasound", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      setResult(data.prediction);

      toast.success("Prediction complete");
    } catch (err) {
      console.error(err);
      toast.error("Backend connection failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPreview(null);
    setFileName("");
    setResult(null);

    if (inputRef.current) inputRef.current.value = "";
  };

  const config = result ? resultConfig[result] : null;
  const Icon = config?.icon;

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <Card>

        <CardHeader>
          <div className="flex items-center gap-3">
            <ScanLine className="text-primary" />
            <CardTitle>Ultrasound AI Prediction</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* Hidden file input */}
          <input
            ref={inputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />

          {/* Upload zone */}
          {!preview && (
            <div
              className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer hover:bg-muted/40"
              onClick={() => inputRef.current?.click()}
            >
              <ImageIcon className="mx-auto mb-2" />
              <p className="text-sm">Click to upload ultrasound image</p>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="relative">

              <img
                src={preview}
                alt="preview"
                className="rounded-xl w-full max-h-72 object-cover"
              />

              <Button
                size="icon"
                variant="secondary"
                className="absolute top-2 right-2"
                onClick={handleReset}
              >
                <XCircle size={18} />
              </Button>

              <p className="text-xs text-muted-foreground mt-2">
                {fileName}
              </p>
            </div>
          )}

          <Button
            className="w-full"
            onClick={handlePredict}
            disabled={!preview || loading}
          >
            {loading ? "Analyzing..." : "Predict Classification"}
          </Button>

        </CardContent>
      </Card>

      {/* Result */}

      <AnimatePresence>
        {config && Icon && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className={`border-2 ${config.border}`}>
              <CardContent className="p-6 flex items-center gap-4">

                <div className={`p-3 rounded-lg ${config.bg}`}>
                  <Icon className={config.color} />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Prediction Result
                  </p>

                  <p className={`text-xl font-bold ${config.color}`}>
                    {config.emoji} {config.label}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {config.description}
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