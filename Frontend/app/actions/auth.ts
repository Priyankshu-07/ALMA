"use server"

import { sql } from "@/lib/db"
import { createSession, hashPassword, verifyPassword, generateDoctorCode } from "@/lib/auth"

export async function registerDoctor(formData: FormData) {
  const fullName = formData.get("fullName") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string
  const registrationNumber = formData.get("registrationNumber") as string
  const specialization = formData.get("specialization") as string | null
  const hospitalName = formData.get("hospitalName") as string | null
  const yearsOfExperience = formData.get("yearsOfExperience") as string | null
  const phone = formData.get("phone") as string | null

  if (!fullName || !email || !password || !registrationNumber) {
    return { error: "Please fill in all required fields" }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" }
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" }
  }

  try {
    const existingUser = await sql`SELECT id FROM users WHERE email = ${email}`
    if (existingUser.length > 0) {
      return { error: "An account with this email already exists" }
    }

    const existingDoctor = await sql`SELECT id FROM doctors WHERE registration_number = ${registrationNumber}`
    if (existingDoctor.length > 0) {
      return { error: "This registration number is already registered" }
    }

    const passwordHash = await hashPassword(password)

    let doctorCode = generateDoctorCode()
    let codeExists = await sql`SELECT id FROM doctors WHERE doctor_code = ${doctorCode}`
    while (codeExists.length > 0) {
      doctorCode = generateDoctorCode()
      codeExists = await sql`SELECT id FROM doctors WHERE doctor_code = ${doctorCode}`
    }

    const userResult = await sql`
      INSERT INTO users (email, password_hash, role)
      VALUES (${email}, ${passwordHash}, 'DOCTOR')
      RETURNING id
    `
    const userId = userResult[0].id

    await sql`
      INSERT INTO doctors (user_id, full_name, registration_number, specialization, hospital_name, years_of_experience, phone, doctor_code)
      VALUES (
        ${userId},
        ${fullName},
        ${registrationNumber},
        ${specialization || null},
        ${hospitalName || null},
        ${yearsOfExperience ? Number.parseInt(yearsOfExperience) : null},
        ${phone || null},
        ${doctorCode}
      )
    `

    await createSession(userId, "DOCTOR")

    return { success: true }
  } catch (error) {
    console.error("Registration error:", error)
    return { error: "An error occurred during registration. Please try again." }
  }
}

export async function loginDoctor(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Please fill in all fields" }
  }

  try {
    const users = await sql`
      SELECT * FROM users WHERE email = ${email} AND role = 'DOCTOR'
    `

    if (users.length === 0) {
      return { error: "Invalid email or password" }
    }

    const user = users[0]
    const isValid = await verifyPassword(password, user.password_hash)

    if (!isValid) {
      return { error: "Invalid email or password" }
    }

    await createSession(user.id, "DOCTOR")

    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "An error occurred during login. Please try again." }
  }
}

export async function registerPatient(formData: FormData) {
  const fullName = formData.get("fullName") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string
  const phone = formData.get("phone") as string | null
  const dateOfBirth = formData.get("dateOfBirth") as string | null
  const pregnancyWeek = formData.get("pregnancyWeek") as string | null
  const doctorCode = formData.get("doctorCode") as string | null

  if (!fullName || !email || !password) {
    return { error: "Please fill in all required fields" }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" }
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" }
  }

  try {
    const existingUser = await sql`SELECT id FROM users WHERE email = ${email}`
    if (existingUser.length > 0) {
      return { error: "An account with this email already exists" }
    }

    let linkedDoctorId: string | null = null
    if (doctorCode) {
      const doctors = await sql`SELECT id FROM doctors WHERE doctor_code = ${doctorCode.toUpperCase()}`
      if (doctors.length === 0) {
        return { error: "Invalid doctor code. Please check and try again." }
      }
      linkedDoctorId = doctors[0].id
    }

    const passwordHash = await hashPassword(password)

    const userResult = await sql`
      INSERT INTO users (email, password_hash, role)
      VALUES (${email}, ${passwordHash}, 'PATIENT')
      RETURNING id
    `
    const userId = userResult[0].id

    await sql`
      INSERT INTO patients (user_id, full_name, phone, date_of_birth, pregnancy_week, linked_doctor_id)
      VALUES (
        ${userId},
        ${fullName},
        ${phone || null},
        ${dateOfBirth || null},
        ${pregnancyWeek ? Number.parseInt(pregnancyWeek) : null},
        ${linkedDoctorId}
      )
    `

    await createSession(userId, "PATIENT")

    return { success: true }
  } catch (error) {
    console.error("Registration error:", error)
    return { error: "An error occurred during registration. Please try again." }
  }
}

export async function loginPatient(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Please fill in all fields" }
  }

  try {
    const users = await sql`
      SELECT * FROM users WHERE email = ${email} AND role = 'PATIENT'
    `

    if (users.length === 0) {
      return { error: "Invalid email or password" }
    }

    const user = users[0]
    const isValid = await verifyPassword(password, user.password_hash)

    if (!isValid) {
      return { error: "Invalid email or password" }
    }

    await createSession(user.id, "PATIENT")

    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "An error occurred during login. Please try again." }
  }
}

export async function logout() {
  const { destroySession } = await import("@/lib/auth")
  await destroySession()
  return { success: true }
}
