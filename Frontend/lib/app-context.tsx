"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export interface MaternalRiskData {
  age: number
  systolicBP: number
  diastolicBP: number
  bloodSugar: number
  bodyTemperature: number
  heartRate: number
  riskLevel: "low" | "medium" | "high" | null
  explanation: string
}

export interface FHRData {
  baseline: number
  accelerations: number
  fetalMovement: number
  uterineContractions: number
  lightDecelerations: number
  severeDecelerations: number
  status: "normal" | "suspect" | "pathological" | null
  interpretation: string
}

export interface UltrasoundData {
  imageUrl: string | null
  maskUrl: string | null
  detectedPart: "HEAD" | "ABDOMEN" | "FEMUR" | null
  measurements: {
    hc: number | null // Head Circumference
    fl: number | null // Femur Length
  }
  developmentStatus: string | null
}

interface AppContextType {
  maternalRisk: MaternalRiskData
  setMaternalRisk: (data: MaternalRiskData) => void
  fhr: FHRData
  setFHR: (data: FHRData) => void
  ultrasound: UltrasoundData
  setUltrasound: (data: UltrasoundData) => void
  isDarkMode: boolean
  toggleDarkMode: () => void
}

const defaultMaternalRisk: MaternalRiskData = {
  age: 0,
  systolicBP: 0,
  diastolicBP: 0,
  bloodSugar: 0,
  bodyTemperature: 0,
  heartRate: 0,
  riskLevel: null,
  explanation: "",
}

const defaultFHR: FHRData = {
  baseline: 0,
  accelerations: 0,
  fetalMovement: 0,
  uterineContractions: 0,
  lightDecelerations: 0,
  severeDecelerations: 0,
  status: null,
  interpretation: "",
}

const defaultUltrasound: UltrasoundData = {
  imageUrl: null,
  maskUrl: null,
  detectedPart: null,
  measurements: {
    hc: null,
    fl: null,
  },
  developmentStatus: null,
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [maternalRisk, setMaternalRisk] = useState<MaternalRiskData>(defaultMaternalRisk)
  const [fhr, setFHR] = useState<FHRData>(defaultFHR)
  const [ultrasound, setUltrasound] = useState<UltrasoundData>(defaultUltrasound)
  const [isDarkMode, setIsDarkMode] = useState(false)

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev
      if (newMode) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
      return newMode
    })
  }

  return (
    <AppContext.Provider
      value={{
        maternalRisk,
        setMaternalRisk,
        fhr,
        setFHR,
        ultrasound,
        setUltrasound,
        isDarkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider")
  }
  return context
}