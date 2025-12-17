// ML API Configuration
// This file provides a clean interface for configuring the external ML API

export const mlConfig = {
  // The URL of your external ML API
  // Set this in your .env file as ML_API_URL
  apiUrl: process.env.ML_API_URL || null,

  // API key for authentication
  // Set this in your .env file as ML_API_KEY
  apiKey: process.env.ML_API_KEY || null,

  // Timeout for ML API requests (in milliseconds)
  timeout: 30000,

  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000,
}

export interface MLAnalysisRequest {
  bloodPressure: string
  sugarLevel: string
  heartRate: string
  weight: string
  pregnancyWeek: number | null
  xrayPath: string
  fhrChartPath: string
  additionalNote: string | null
}

export interface MLAnalysisResponse {
  requestId?: string
  riskCategory: "LOW" | "MEDIUM" | "HIGH"
  summary: string
  recommendations: string
  confidence?: number
  rawData?: Record<string, unknown>
}

// Helper function to check if ML API is configured
export function isMLConfigured(): boolean {
  return Boolean(mlConfig.apiUrl && mlConfig.apiKey)
}
