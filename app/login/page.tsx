"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Landmark, Building2, User, ArrowRight } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState("government")
  const [loading, setLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // 1. Set LocalStorage for the frontend components
    localStorage.setItem("userRole", role)
    if (role === "university") {
      localStorage.setItem("userInstitution", "BIT Mesra")
    }

    // 2. CRITICAL: Set the Cookie for the Middleware to read
    document.cookie = `userRole=${role}; path=/; max-age=86400`
    if (role === "university") {
      document.cookie = `userInstitution=BIT Mesra; path=/; max-age=86400`
    }

    // 3. Route to the correct dashboard
    setTimeout(() => {
      if (role === "government") {
        router.push("/")
      } else if (role === "university") {
        router.push("/challenges")
      } else {
        router.push("/my-submissions")
      }
    }, 500)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card/60 p-8 shadow-xl backdrop-blur-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Landmark className="size-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Sahyug</h1>
          <p className="text-sm text-muted-foreground mt-1">Select your portal access level</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <label 
            className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors ${role === "government" ? "border-primary bg-primary/5" : "border-border/60 hover:bg-muted/50"}`}
            onClick={() => setRole("government")}
          >
            <Landmark className={`size-5 ${role === "government" ? "text-primary" : "text-muted-foreground"}`} />
            <div className="flex-1">
              <p className="font-semibold text-foreground">Government Admin</p>
              <p className="text-xs text-muted-foreground">State Command Center</p>
            </div>
            <div className={`size-4 rounded-full border-2 ${role === "government" ? "border-primary bg-primary" : "border-muted-foreground"}`} />
          </label>

          <label 
            className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors ${role === "university" ? "border-primary bg-primary/5" : "border-border/60 hover:bg-muted/50"}`}
            onClick={() => setRole("university")}
          >
            <Building2 className={`size-5 ${role === "university" ? "text-primary" : "text-muted-foreground"}`} />
            <div className="flex-1">
              <p className="font-semibold text-foreground">University Node</p>
              <p className="text-xs text-muted-foreground">BIT Mesra R&D</p>
            </div>
            <div className={`size-4 rounded-full border-2 ${role === "university" ? "border-primary bg-primary" : "border-muted-foreground"}`} />
          </label>

          <label 
            className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors ${role === "citizen" ? "border-primary bg-primary/5" : "border-border/60 hover:bg-muted/50"}`}
            onClick={() => setRole("citizen")}
          >
            <User className={`size-5 ${role === "citizen" ? "text-primary" : "text-muted-foreground"}`} />
            <div className="flex-1">
              <p className="font-semibold text-foreground">Citizen</p>
              <p className="text-xs text-muted-foreground">Public Grievance Portal</p>
            </div>
            <div className={`size-4 rounded-full border-2 ${role === "citizen" ? "border-primary bg-primary" : "border-muted-foreground"}`} />
          </label>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-70"
          >
            {loading ? "Authenticating..." : "Access System"} 
            {!loading && <ArrowRight className="size-4" />}
          </button>
        </form>
      </div>
    </div>
  )
}