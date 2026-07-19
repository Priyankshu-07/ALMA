"use client"
import { useState, useCallback } from "react"
import { useAppContext } from "@/lib/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StatusBadge, getStatusColor } from "@/components/status-badge"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import {
  Image as ImageIcon,
  Upload,
  Scan,
  Ruler,
  Scale,
  TrendingUp,
  X,
  Plus,
  Brain,
  Circle,
  Bone,
  AlertCircle,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────────
interface ImageSlot {
  file: File | null
  preview: string | null
}

interface ImageResult {
  image_index: number
  filename: string
  plane_detected: string
  raw_label: string
  confidence: number
  measurements: {
    HC_mm: number | null
    AC_mm: number | null
    FL_mm: number | null
  }
  measurement_status: string | null
  estimated_fetal_weight_grams: number | null
  growth_status: string | null
  error: string | null
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const getPlaneIcon = (plane: string) => {
  switch (plane) {
    case "HEAD":    return <Brain className="h-5 w-5 text-primary" />
    case "ABDOMEN": return <Circle className="h-5 w-5 text-primary" />
    case "FEMUR":   return <Bone className="h-5 w-5 text-primary" />
    default:        return <AlertCircle className="h-5 w-5 text-muted-foreground" />
  }
}

const getPlaneLabel = (plane: string) => {
  switch (plane) {
    case "HEAD":    return "Fetal Head (HC)"
    case "FEMUR":   return "Femur Length (FL)"
    default:        return "Unrecognized Plane"
  }
}

const getMeasurementLabel = (result: ImageResult) => {
  if (result.measurements.HC_mm) return { label: "HC", value: result.measurements.HC_mm }
  if (result.measurements.AC_mm) return { label: "AC", value: result.measurements.AC_mm }
  if (result.measurements.FL_mm) return { label: "FL", value: result.measurements.FL_mm }
  return null
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function UltrasoundPage() {
  const { setUltrasound } = useAppContext()

  const [gestationalAge, setGestationalAge] = useState<string>("")
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>([
    { file: null, preview: null },
  ])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState<ImageResult[]>([])
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  // ── Image slot handlers ──────────────────────────────────────────────────────
  const handleFileChange = (idx: number, file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setImageSlots((prev) => {
        const updated = [...prev]
        updated[idx] = { file, preview: e.target?.result as string }
        return updated
      })
    }
    reader.readAsDataURL(file)
  }

  const removeSlot = (idx: number) => {
    setImageSlots((prev) => prev.filter((_, i) => i !== idx))
  }

  const addSlot = () => {
    if (imageSlots.length < 3) {
      setImageSlots((prev) => [...prev, { file: null, preview: null }])
    }
  }

  const handleDrop = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault()
    setDragIdx(null)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      handleFileChange(idx, file)
    }
  }, [])

  // ── Analysis ─────────────────────────────────────────────────────────────────
  const analyzeImages = async () => {
    const filledSlots = imageSlots.filter((s) => s.file !== null)

    if (filledSlots.length === 0) {
      toast.error("Please upload at least one ultrasound image")
      return
    }
    if (!gestationalAge || Number(gestationalAge) < 12 || Number(gestationalAge) > 42) {
      toast.error("Please enter a valid gestational age (12-42 weeks)")
      return
    }

    setIsAnalyzing(true)
    setResults([])

    try {
      const formData = new FormData()
      filledSlots.forEach((slot) => {
        formData.append("files", slot.file!)
      })
      formData.append("gestational_age", gestationalAge)

      const response = await fetch("http://localhost:8000/analyze-images", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Analysis failed")
      }

      const data = await response.json()
      setResults(data.results)

      // Save first valid result to app context for report page
      const firstValid = data.results.find((r: ImageResult) => !r.error)
      if (firstValid) {
        setUltrasound({
          imageUrl: filledSlots[0].preview,
          maskUrl: null,
          detectedPart: firstValid.plane_detected,
          measurements: {
            hc: firstValid.measurements.HC_mm,
            ac: firstValid.measurements.AC_mm,
            fl: firstValid.measurements.FL_mm,
          },
          efw: firstValid.estimated_fetal_weight_grams,
          growthStatus: firstValid.growth_status,
        })
      }

      toast.success(`Analysis complete — ${data.results.length} image(s) processed`)

    } catch (error: any) {
      console.error("Analysis error:", error)
      toast.error(error.message || "Something went wrong during analysis")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const clearAll = () => {
    setImageSlots([{ file: null, preview: null }])
    setResults([])
    setGestationalAge("")
    setUltrasound({
      imageUrl: null,
      maskUrl: null,
      detectedPart: null,
      measurements: { hc: null, ac: null, fl: null },
      efw: null,
      growthStatus: null,
    })
  }

  const hasImages = imageSlots.some((s) => s.file !== null)

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <ImageIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Ultrasound Image Analysis
            </h1>
            <p className="text-muted-foreground">
              AI-powered fetal biometry and growth assessment
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Left: Upload Section ── */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Ultrasound Images</CardTitle>
              <CardDescription>
                Upload up to 3 fetal ultrasound images (HEAD, ABDOMEN, FEMUR)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Gestational Age Input */}
              <div className="space-y-2">
                <Label htmlFor="gestationalAge">
                  Gestational Age (weeks) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="gestationalAge"
                  type="number"
                  min={12}
                  max={42}
                  placeholder="e.g., 24"
                  value={gestationalAge}
                  onChange={(e) => setGestationalAge(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter weeks of pregnancy (12–42 weeks)
                </p>
              </div>

              {/* Image Slots */}
              <div className="space-y-3">
                {imageSlots.map((slot, idx) => (
                  <div key={idx}>
                    {slot.preview ? (
                      // Filled slot — show preview
                      <div className="relative rounded-lg overflow-hidden bg-black border border-border">
                        <img
                          src={slot.preview}
                          alt={`Ultrasound ${idx + 1}`}
                          className="w-full h-40 object-contain"
                        />
                        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                          Image {idx + 1}
                        </div>
                        <Button
                          onClick={() => removeSlot(idx)}
                          size="icon"
                          variant="ghost"
                          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 text-white hover:bg-black/70"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      // Empty slot — show dropzone
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragIdx(idx) }}
                        onDragLeave={() => setDragIdx(null)}
                        onDrop={(e) => handleDrop(e, idx)}
                        className={`
                          relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8
                          transition-colors cursor-pointer
                          ${dragIdx === idx
                            ? "border-primary bg-primary/5"
                            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                          }
                        `}
                      >
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(idx, e.target.files?.[0] || null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="h-7 w-7 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium text-foreground">
                          Image {idx + 1}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Drop or click to upload
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add more / actions */}
              <div className="flex gap-2">
                {imageSlots.length < 3 && (
                  <Button
                    variant="outline"
                    onClick={addSlot}
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Image
                  </Button>
                )}
                {hasImages && (
                  <Button
                    variant="ghost"
                    onClick={clearAll}
                    className="text-muted-foreground"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {/* Analyze Button */}
              <Button
                onClick={analyzeImages}
                disabled={isAnalyzing || !hasImages}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Analyzing Images...
                  </>
                ) : (
                  <>
                    <Scan className="mr-2 h-4 w-4" />
                    Analyze {imageSlots.filter(s => s.file).length} Image{imageSlots.filter(s => s.file).length !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Results Section ── */}
        <div className="space-y-4">
          {results.length === 0 ? (
            // Empty state
            <Card className="h-full">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <p className="text-base font-medium text-foreground mb-1">
                  No results yet
                </p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Upload ultrasound images and enter gestational age, then click Analyze
                </p>
              </CardContent>
            </Card>
          ) : (
            // Results cards — one per image
            results.map((result, idx) => (
              <Card key={idx} className={result.error ? "border-red-200" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      {getPlaneIcon(result.plane_detected)}
                      Image {result.image_index} — {getPlaneLabel(result.plane_detected)}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(result.confidence * 100)}% confidence
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.error ? (
                    <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-3">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-red-700 dark:text-red-300">{result.error}</p>
                    </div>
                  ) : (
                    <>
                      {/* Measurement */}
                      {(() => {
                        const m = getMeasurementLabel(result)
                        return m ? (
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Ruler className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{m.label}:</span>
                              <span className="text-lg font-semibold">{m.value} mm</span>
                            </div>
                            {result.measurement_status && (
                              <StatusBadge status={getStatusColor(
                                result.measurement_status === "Normal" ? "normal" :
                                result.measurement_status.includes("Severely") ? "high" : "medium"
                              )}>
                                {result.measurement_status}
                              </StatusBadge>
                            )}
                          </div>
                        ) : null
                      })()}

                      {/* EFW + Growth Status */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-muted/50 p-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Scale className="h-3.5 w-3.5 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Est. Fetal Weight</p>
                          </div>
                          <p className="text-xl font-bold text-foreground">
                            {result.estimated_fetal_weight_grams
                              ? `${result.estimated_fetal_weight_grams}g`
                              : "--"}
                          </p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Growth Status</p>
                          </div>
                          {result.growth_status ? (
                            <StatusBadge status={getStatusColor(
                              result.growth_status === "Normal" ? "normal" :
                              result.growth_status.includes("Severely") ? "high" : "medium"
                            )}>
                              {result.growth_status}
                            </StatusBadge>
                          ) : (
                            <p className="text-sm text-muted-foreground">--</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}