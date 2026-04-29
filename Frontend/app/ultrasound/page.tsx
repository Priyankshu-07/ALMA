"use client"
import { useState, useCallback } from "react"
import { useAppContext } from "@/lib/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
} from "lucide-react"
export default function UltrasoundPage() {
  const { ultrasound, setUltrasound } = useAppContext()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(ultrasound.imageUrl)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const clearImage = () => {
    setUploadedImage(null)
    setImageFile(null)
    setUltrasound({
      imageUrl: null,
      maskUrl: null,
      detectedPart: null,
      measurements: { hc: null, ac: null, fl: null },
      efw: null,
      growthStatus: null,
    })
  }

  const analyzeImage = async () => {
    if (!uploadedImage || !imageFile) {
      toast.error("Please upload an ultrasound image first")
      return
    }

    setIsAnalyzing(true)

    try {
      const formData = new FormData()
      formData.append("file", imageFile)

      const response = await fetch("http://localhost:8000/analyze-image", {
        method: "POST",
        body: formData,
        // Do NOT manually set Content-Type — browser sets multipart boundary automatically
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Analysis failed")
      }

      const data = await response.json()

      setUltrasound({
        imageUrl: uploadedImage,
        maskUrl: uploadedImage,                        // backend doesn't return mask URL yet
        detectedPart: data.plane_detected,             // "HEAD" | "ABDOMEN" | "FEMUR"
        measurements: {
          hc: data.measurements.HC_mm,                // backend returns HC_mm
          ac: data.measurements.AC_mm,                // backend returns AC_mm
          fl: data.measurements.FL_mm,                // backend returns FL_mm
        },
        efw: data.estimated_fetal_weight_grams,
        growthStatus: data.growth_status,             // "normal" | "underdeveloped" | "overgrowth"
      })

      toast.success("Ultrasound analysis complete")

    } catch (error: any) {
      console.error("Analysis error:", error)
      toast.error(error.message || "Something went wrong during analysis")
    } finally {
      setIsAnalyzing(false)
    }
  }

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
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Ultrasound</CardTitle>
            <CardDescription>
              Upload a fetal ultrasound image for analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!uploadedImage ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12
                  transition-colors cursor-pointer
                  ${isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                  }
                `}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-sm font-medium text-foreground mb-1">
                  Drop your ultrasound image here
                </p>
                <p className="text-xs text-muted-foreground">
                  or click to browse (PNG, JPG)
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden bg-black">
                  <img
                    src={uploadedImage}
                    alt="Uploaded ultrasound"
                    className="w-full h-auto max-h-80 object-contain"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <Button onClick={analyzeImage} disabled={isAnalyzing} className="w-full">
                  {isAnalyzing ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Analyzing Image...
                    </>
                  ) : (
                    <>
                      <Scan className="mr-2 h-4 w-4" />
                      Analyze Ultrasound
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Detected Region */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Scan className="h-4 w-4 text-primary" />
                Detected Body Part
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ultrasound.detectedPart ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <span className="text-lg font-bold text-primary">
                      {ultrasound.detectedPart.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {ultrasound.detectedPart}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ultrasound.detectedPart === "HEAD"
                        ? "Cranial measurement plane"
                        : ultrasound.detectedPart === "ABDOMEN"
                        ? "Abdominal circumference plane"
                        : "Femur length measurement"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Upload and analyze an image to detect fetal anatomy
                </p>
              )}
            </CardContent>
          </Card>

          {/* Measurements */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Ruler className="h-4 w-4 text-primary" />
                Biometric Measurements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ultrasound.measurements.hc ? (
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">HC</p>
                    <p className="text-xl font-semibold text-foreground">
                      {ultrasound.measurements.hc}
                    </p>
                    <p className="text-xs text-muted-foreground">mm</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">AC</p>
                    <p className="text-xl font-semibold text-foreground">
                      {ultrasound.measurements.ac}
                    </p>
                    <p className="text-xs text-muted-foreground">mm</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">FL</p>
                    <p className="text-xl font-semibold text-foreground">
                      {ultrasound.measurements.fl}
                    </p>
                    <p className="text-xs text-muted-foreground">mm</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Measurements will appear after analysis
                </p>
              )}
            </CardContent>
          </Card>

          {/* EFW & Growth Status */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Scale className="h-4 w-4 text-primary" />
                  Fetal Weight (EFW)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ultrasound.efw ? (
                  <div>
                    <p className="text-3xl font-bold text-foreground">
                      {ultrasound.efw}
                      <span className="text-lg font-normal text-muted-foreground ml-1">g</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Estimated using Hadlock formula
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">--</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Growth Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ultrasound.growthStatus ? (
                  <div>
                    <StatusBadge status={getStatusColor(ultrasound.growthStatus)}>
                      {ultrasound.growthStatus.charAt(0).toUpperCase() +
                        ultrasound.growthStatus.slice(1)}
                    </StatusBadge>
                    <p className="text-xs text-muted-foreground mt-2">
                      {ultrasound.growthStatus === "normal"
                        ? "Growth within expected percentile range"
                        : ultrasound.growthStatus === "underdeveloped"
                        ? "Below 10th percentile - monitor closely"
                        : "Above 90th percentile - assess for macrosomia"}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">--</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Image Comparison (when analyzed) */}
      {ultrasound.imageUrl && ultrasound.detectedPart && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Analysis Visualization</CardTitle>
            <CardDescription>
              Original ultrasound with detected region highlighted
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Original Image</p>
                <div className="rounded-lg overflow-hidden bg-black">
                  <img
                    src={ultrasound.imageUrl}
                    alt="Original ultrasound"
                    className="w-full h-auto max-h-64 object-contain"
                  />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Detected Region</p>
                <div className="relative rounded-lg overflow-hidden bg-black">
                  <img
                    src={ultrasound.imageUrl}
                    alt="Analyzed ultrasound"
                    className="w-full h-auto max-h-64 object-contain"
                  />
                  <div className="absolute inset-0 bg-primary/20 pointer-events-none" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-primary border-dashed rounded-full w-32 h-32 flex items-center justify-center">
                      <span className="text-primary font-bold text-sm bg-background/80 px-2 py-1 rounded">
                        {ultrasound.detectedPart}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}