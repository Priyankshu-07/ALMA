import { neon } from "@neondatabase/serverless"

export const sql = neon(process.env.DATABASE_URL!)

export type User = {
  id: string
  email: string
  password_hash: string
  role: "DOCTOR" | "PATIENT"
  created_at: Date
  updated_at: Date
}

export type Doctor = {
  id: string
  user_id: string
  full_name: string
  registration_number: string
  specialization: string | null
  hospital_name: string | null
  years_of_experience: number | null
  phone: string | null
  doctor_code: string
  created_at: Date
  updated_at: Date
}

export type Patient = {
  id: string
  user_id: string
  full_name: string
  phone: string | null
  date_of_birth: Date | null
  pregnancy_week: number | null
  linked_doctor_id: string | null
  created_at: Date
  updated_at: Date
}

export type Subscription = {
  id: string
  patient_id: string
  plan: string
  status: "ACTIVE" | "INACTIVE" | "CANCELLED"
  current_period_end: Date | null
  created_at: Date
  updated_at: Date
}

export type Assessment = {
  id: string
  patient_id: string
  doctor_id: string | null
  xray_path: string
  fhr_chart_path: string
  blood_pressure: string
  sugar_level: string
  heart_rate: string
  weight: string
  additional_note: string | null
  ml_status: "PENDING" | "SUCCESS" | "FAILED"
  ml_request_id: string | null
  risk_category: string | null
  summary_text: string | null
  recommendations: string | null
  raw_response: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
}

export type ChatMessage = {
  id: string
  assessment_id: string
  sender: string
  content: string
  created_at: Date
}
