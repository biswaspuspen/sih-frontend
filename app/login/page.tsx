"use client"

import { useRouter } from "next/navigation"
import { Landmark, Building, User, ShieldCheck } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()

  const handleLogin = (role: string) => {
    // Save the role to local storage so the rest of the app knows who is logged in
    localStorage.setItem("userRole", role)
    document.cookie = `userRole=${role}; path=/` // ADD THIS LINE

    // ... rest of your routing code stays the same

    // Route to the correct home page based on the rules you defined
    if (role === "citizen") {
      router.push("/my-submissions")
    } else if (role === "university") {
      router.push("/challenges")
    } else {
      router.push("/") // Government goes to overview
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border/50 bg-card p-8 shadow-lg">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Landmark className="size-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Jharkhand Grid</h1>
          <p className="text-sm text-muted-foreground">Select your role to access the portal</p>
        </div>

        <div className="space-y-3 pt-4">
          <button
            onClick={() => handleLogin("government")}
            className="flex w-full items-center gap-4 rounded-xl border border-border/80 bg-background p-4 text-left hover:border-primary hover:bg-primary/5 transition-all"
          >
            <ShieldCheck className="size-5 text-blue-500" />
            <div>
              <p className="font-semibold text-foreground">Government Admin</p>
              <p className="text-xs text-muted-foreground">R. Mehta • Full Access</p>
            </div>
          </button>

          <button
            onClick={() => handleLogin("university")}
            className="flex w-full items-center gap-4 rounded-xl border border-border/80 bg-background p-4 text-left hover:border-primary hover:bg-primary/5 transition-all"
          >
            <Building className="size-5 text-emerald-500" />
            <div>
              <p className="font-semibold text-foreground">University Node</p>
              <p className="text-xs text-muted-foreground">Dr. Sharma • BIT Mesra</p>
            </div>
          </button>

          <button
            onClick={() => handleLogin("citizen")}
            className="flex w-full items-center gap-4 rounded-xl border border-border/80 bg-background p-4 text-left hover:border-primary hover:bg-primary/5 transition-all"
          >
            <User className="size-5 text-amber-500" />
            <div>
              <p className="font-semibold text-foreground">Citizen</p>
              <p className="text-xs text-muted-foreground">Submit & Track Grievances</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}