-- Fetal Health Analysis Database Schema
-- Run this script to create all necessary tables

-- Create enum type for roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('DOCTOR', 'PATIENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum type for subscription status
DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'INACTIVE', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum type for ML status
DO $$ BEGIN
    CREATE TYPE ml_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    registration_number TEXT UNIQUE NOT NULL,
    specialization TEXT,
    hospital_name TEXT,
    years_of_experience INTEGER,
    phone TEXT,
    doctor_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    date_of_birth DATE,
    pregnancy_week INTEGER,
    linked_doctor_id TEXT REFERENCES doctors(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    plan TEXT NOT NULL,
    status subscription_status NOT NULL DEFAULT 'INACTIVE',
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessments table
CREATE TABLE IF NOT EXISTS assessments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id TEXT REFERENCES doctors(id) ON DELETE SET NULL,
    xray_path TEXT NOT NULL,
    fhr_chart_path TEXT NOT NULL,
    blood_pressure TEXT NOT NULL,
    sugar_level TEXT NOT NULL,
    heart_rate TEXT NOT NULL,
    weight TEXT NOT NULL,
    additional_note TEXT,
    ml_status ml_status NOT NULL DEFAULT 'PENDING',
    ml_request_id TEXT,
    risk_category TEXT,
    summary_text TEXT,
    recommendations TEXT,
    raw_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    sender TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_doctor_code ON doctors(doctor_code);
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_linked_doctor ON patients(linked_doctor_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_patient ON subscriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_assessments_patient ON assessments(patient_id);
CREATE INDEX IF NOT EXISTS idx_assessments_doctor ON assessments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_assessment ON chat_messages(assessment_id);
