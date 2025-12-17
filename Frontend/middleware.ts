import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const SESSION_COOKIE_NAME = "fetal_health_session"

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const path = request.nextUrl.pathname

  // Parse session if exists
  let session: { userId: string; role: "DOCTOR" | "PATIENT"; expiresAt: number } | null = null
  if (sessionToken) {
    try {
      session = JSON.parse(Buffer.from(sessionToken, "base64").toString())
      if (session && session.expiresAt < Date.now()) {
        session = null
      }
    } catch {
      session = null
    }
  }

  // Protect doctor routes
  if (path.startsWith("/doctor")) {
    if (!session) {
      return NextResponse.redirect(new URL("/auth/doctor/login", request.url))
    }
    if (session.role !== "DOCTOR") {
      return NextResponse.redirect(new URL("/patient/dashboard", request.url))
    }
  }

  // Protect patient routes
  if (path.startsWith("/patient")) {
    if (!session) {
      return NextResponse.redirect(new URL("/auth/patient/login", request.url))
    }
    if (session.role !== "PATIENT") {
      return NextResponse.redirect(new URL("/doctor/dashboard", request.url))
    }
  }

  // Redirect authenticated users away from auth pages
  if (path.startsWith("/auth") && session) {
    if (session.role === "DOCTOR") {
      return NextResponse.redirect(new URL("/doctor/dashboard", request.url))
    } else {
      return NextResponse.redirect(new URL("/patient/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/doctor/:path*", "/patient/:path*", "/auth/:path*"],
}
