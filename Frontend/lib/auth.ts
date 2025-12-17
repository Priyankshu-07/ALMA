import { cookies } from "next/headers"
import { sql, type User, type Doctor, type Patient } from "./db"
import bcrypt from "bcryptjs"

const SESSION_COOKIE_NAME = "fetal_health_session"
const SESSION_EXPIRY_DAYS = 7

// Simple session management using signed cookies
export async function createSession(userId: string, role: "DOCTOR" | "PATIENT") {
  const cookieStore = await cookies()
  const sessionData = {
    userId,
    role,
    expiresAt: Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  }

  // Base64 encode the session data
  const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString("base64")

  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    path: "/",
  })

  return sessionToken
}

export async function getSession() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionToken) return null

  try {
    const sessionData = JSON.parse(Buffer.from(sessionToken, "base64").toString())

    if (sessionData.expiresAt < Date.now()) {
      await destroySession()
      return null
    }

    return sessionData as { userId: string; role: "DOCTOR" | "PATIENT"; expiresAt: number }
  } catch {
    return null
  }
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function getCurrentUser(): Promise<(User & { doctor?: Doctor; patient?: Patient }) | null> {
  const session = await getSession()
  if (!session) return null

  const users = await sql`
    SELECT * FROM users WHERE id = ${session.userId}
  `

  if (users.length === 0) return null

  const user = users[0] as User

  if (user.role === "DOCTOR") {
    const doctors = await sql`
      SELECT * FROM doctors WHERE user_id = ${user.id}
    `
    return { ...user, doctor: doctors[0] as Doctor }
  } else {
    const patients = await sql`
      SELECT * FROM patients WHERE user_id = ${user.id}
    `
    return { ...user, patient: patients[0] as Patient }
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateDoctorCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = "DR-"
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
