import Link from "next/link";
import {
  Heart,
  Stethoscope,
  Baby,
  Shield,
  Activity,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Heart className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">
              FetalHealth
            </span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="#features"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="#about"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              About
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-secondary/50 to-background px-4 py-20 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
              <Activity className="h-4 w-4" />
              AI-Powered Health Monitoring
            </div>
            <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Fetal Health Analysis using Machine Learning
            </h1>
            <p className="mb-10 text-pretty text-lg text-muted-foreground md:text-xl">
              Connect with healthcare professionals and leverage AI technology
              to monitor fetal health throughout your pregnancy journey.
            </p>

            {/* Role Selection Cards */}
            <div className="mx-auto grid max-w-2xl gap-6 md:grid-cols-2">
              <Card className="group relative overflow-hidden border-2 border-transparent transition-all hover:border-[var(--doctor-primary)] hover:shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--doctor-primary)]/5 to-transparent" />
                <CardHeader className="relative">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--doctor-primary)]/10">
                    <Stethoscope className="h-6 w-6 text-[var(--doctor-primary)]" />
                  </div>
                  <CardTitle className="text-xl">Healthcare Provider</CardTitle>
                  <CardDescription>
                    Access patient records, review assessments, and manage care
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative flex flex-col gap-3">
                  <Button
                    asChild
                    className="w-full bg-[var(--doctor-primary)] hover:bg-[var(--doctor-primary)]/90"
                  >
                    <Link href="/auth/doctor/login">Doctor Login</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-doctor-primary text-doctor-primary hover:bg-doctor-primary hover:text-white"
                  >
                    <Link href="/auth/doctor/register">Register as Doctor</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-2 border-transparent transition-all hover:border-[var(--patient-primary)] hover:shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--patient-primary)]/5 to-transparent" />
                <CardHeader className="relative">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--patient-primary)]/10">
                    <Baby className="h-6 w-6 text-[var(--patient-primary)]" />
                  </div>
                  <CardTitle className="text-xl">Expecting Parent</CardTitle>
                  <CardDescription>
                    Track your pregnancy, upload health data, and get insights
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative flex flex-col gap-3">
                  <Button
                    asChild
                    className="w-full bg-[var(--patient-primary)] hover:bg-[var(--patient-primary)]/90"
                  >
                    <Link href="/auth/patient/login">Parent Login</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-patient-primary text-patient-primary hover:bg-patient-primary hover:text-white"
                  >
                    <Link href="/auth/patient/register">
                      Register as Parent
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              Why Choose FetalHealth?
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Our platform combines advanced AI technology with expert medical
              care to provide comprehensive fetal health monitoring.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="group relative overflow-hidden border-0 bg-secondary/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-secondary/50">
              <div className="absolute inset-0 bg-linear-to-br from-primary/0 to-primary/0 transition-all duration-300 group-hover:from-primary/10 group-hover:to-transparent" />
              <CardHeader className="relative">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:rotate-6">
                  <Activity className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                </div>
                <CardTitle className="transition-colors duration-300 group-hover:text-primary">
                  AI-Powered Analysis
                </CardTitle>
                <CardDescription className="transition-opacity duration-300 group-hover:opacity-80">
                  Advanced machine learning algorithms analyze health data to
                  provide accurate risk assessments and recommendations.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="group relative overflow-hidden border-0 bg-secondary/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-secondary/50">
              <div className="absolute inset-0 bg-linear-to-br from-primary/0 to-primary/0 transition-all duration-300 group-hover:from-primary/10 group-hover:to-transparent" />
              <CardHeader className="relative">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:rotate-6">
                  <Shield className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                </div>
                <CardTitle className="transition-colors duration-300 group-hover:text-primary">
                  Secure & Private
                </CardTitle>
                <CardDescription className="transition-opacity duration-300 group-hover:opacity-80">
                  Your health data is encrypted and stored securely. Only you
                  and your healthcare provider can access your information.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="group relative overflow-hidden border-0 bg-secondary/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-secondary/50">
              <div className="absolute inset-0 bg-linear-to-br from-primary/0 to-primary/0 transition-all duration-300 group-hover:from-primary/10 group-hover:to-transparent" />
              <CardHeader className="relative">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:rotate-6">
                  <Users className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                </div>
                <CardTitle className="transition-colors duration-300 group-hover:text-primary">
                  Connected Care
                </CardTitle>
                <CardDescription className="transition-opacity duration-300 group-hover:opacity-80">
                  Seamlessly connect with your healthcare provider, share
                  assessments, and receive personalized guidance throughout your
                  pregnancy.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-4 py-8">
        <div className="mx-auto max-w-7xl text-center">
          <div className="flex items-center justify-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">FetalHealth</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            AI-powered fetal health monitoring. Always consult with healthcare
            professionals for medical decisions.
          </p>
        </div>
      </footer>
    </div>
  );
}
