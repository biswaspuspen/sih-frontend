"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Building2,
  Factory,
  User,
  ArrowRight,
  X,
  Mail,
  Lock,
  UserCircle,
  ShieldCheck,
  Loader2,
} from "lucide-react"

type Role = "university" | "industry" | "citizen" | "admin"
type AuthMode = "login" | "register"

const NEEDS_AUTH: Role[] = ["university", "industry"]

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<Role>("university")
  const [loading, setLoading] = useState(false)

  // Login/Register modal state — used for university and industry only
  const [showModal, setShowModal] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>("login")
  const [form, setForm] = useState({ name: "", organization: "", email: "", password: "" })
  const [error, setError] = useState("")

  // Admin entry state — separate passkey-only box, as it originally was
  const [adminMode, setAdminMode] = useState(false)
  const [passkey, setPasskey] = useState("")

  const finishLogin = (finalRole: Role) => {
    localStorage.setItem("userRole", finalRole)

    if (finalRole === "university") {
      localStorage.setItem("userInstitution", form.organization || "BIT Mesra")
    } else {
      localStorage.removeItem("userInstitution")
    }

    if (finalRole === "industry") {
      localStorage.setItem("userCompany", form.organization || "Tata Steel Ltd.")
    } else {
      localStorage.removeItem("userCompany")
    }

    document.cookie = `userRole=${finalRole}; path=/; max-age=86400`
    if (finalRole === "university") {
      document.cookie = `userInstitution=${form.organization || "BIT Mesra"}; path=/; max-age=86400`
    } else {
      document.cookie = "userInstitution=; path=/; max-age=0"
    }

    setTimeout(() => {
      if (finalRole === "admin") {
        router.push("/")
      } else if (finalRole === "university") {
        router.push("/challenges")
      } else if (finalRole === "industry") {
        router.push("/industry")
      } else {
        router.push("/my-submissions")
      }
    }, 500)
  }

  // Citizen: no login/register step at all, matches original behavior
  const handleCitizenAccess = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    finishLogin("citizen")
  }

  const openAuthModal = (targetRole: Role) => {
    setRole(targetRole)
    setAuthMode("login")
    setForm({ name: "", organization: "", email: "", password: "" })
    setError("")
    setShowModal(true)
  }

  const handleAccessSystem = (e: React.FormEvent) => {
    e.preventDefault()
    if (role === "citizen") {
      handleCitizenAccess(e)
    } else {
      openAuthModal(role)
    }
  }

  // Admin: original passkey-only flow, untouched by the login/register modal
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!passkey.trim()) return
    setLoading(true)

    localStorage.setItem("userRole", "admin")
    localStorage.removeItem("userInstitution")

    document.cookie = `userRole=admin; path=/; max-age=86400`
    document.cookie = "userInstitution=; path=/; max-age=0"

    setTimeout(() => {
      router.push("/")
    }, 500)
  }

  const closeModal = () => {
    if (loading) return
    setShowModal(false)
  }

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!form.email.trim() || !form.password.trim()) {
      setError("Email and password are required.")
      return
    }
    if (authMode === "register" && (!form.name.trim() || !form.organization.trim())) {
      setError("Please fill in your name and organization.")
      return
    }

    setLoading(true)

    // Mock auth — no backend yet. Swap this block out once a real auth API exists.
    setTimeout(() => {
      setLoading(false)
      setShowModal(false)
      finishLogin(role)
    }, 700)
  }

  const roleLabel: Record<Role, string> = {
    university: "University Node",
    industry: "Industry Partner",
    citizen: "Citizen",
    admin: "Admin",
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card/60 p-8 shadow-xl backdrop-blur-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {adminMode ? <ShieldCheck className="size-6" /> : <Building2 className="size-6" />}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">SAHYOG</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {adminMode ? "System Administration Console" : "Select your portal access level"}
          </p>
        </div>

        {adminMode ? (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="admin-passkey" className="text-xs font-medium text-muted-foreground">
                Admin Passkey
              </label>
              <input
                id="admin-passkey"
                type="password"
                autoFocus
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="Enter admin passkey..."
                className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <p className="text-[10px] text-muted-foreground/70">
                Authorized personnel only. All admin sessions are logged.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !passkey.trim()}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-70"
            >
              {loading ? "Verifying Clearance..." : "Enter Admin Console"}
              {!loading && <ArrowRight className="size-4" />}
            </button>

            <button
              type="button"
              onClick={() => { setAdminMode(false); setPasskey("") }}
              className="flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Back to portal selection
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleAccessSystem} className="space-y-3">
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
                className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors ${role === "industry" ? "border-primary bg-primary/5" : "border-border/60 hover:bg-muted/50"}`}
                onClick={() => setRole("industry")}
              >
                <Factory className={`size-5 ${role === "industry" ? "text-primary" : "text-muted-foreground"}`} />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Industry Partner</p>
                  <p className="text-xs text-muted-foreground">Solution Exchange</p>
                </div>
                <div className={`size-4 rounded-full border-2 ${role === "industry" ? "border-primary bg-primary" : "border-muted-foreground"}`} />
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
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-70"
              >
                {loading ? "Authenticating..." : "Access System"}
                {!loading && <ArrowRight className="size-4" />}
              </button>
            </form>

            <div className="mt-4 border-t border-border/60 pt-4">
              <div
                onClick={() => setAdminMode(true)}
                className="flex cursor-pointer items-center gap-4 rounded-xl border border-border/60 bg-muted/20 p-4 transition-colors hover:border-primary hover:bg-primary/5"
              >
                <ShieldCheck className="size-5 text-primary" />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Admin</p>
                  <p className="text-xs text-muted-foreground">State Command Center</p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground" />
              </div>
            </div>
          </>
        )}
      </div>

      {showModal && NEEDS_AUTH.includes(role) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={closeModal}>
          <div
            className="w-full max-w-sm rounded-2xl border border-border/80 bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">{roleLabel[role]} Access</h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="mb-5 text-xs text-muted-foreground">Sign in or create an account to continue.</p>

            <div className="mb-5 grid grid-cols-2 rounded-lg border border-border/70 p-1">
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className={`rounded-md py-1.5 text-sm font-medium transition-all ${authMode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("register")}
                className={`rounded-md py-1.5 text-sm font-medium transition-all ${authMode === "register" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === "register" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Full Name</label>
                    <div className="relative">
                      <UserCircle className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Your full name"
                        className="w-full rounded-md border border-input bg-background/50 py-2 pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Organization</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={form.organization}
                        onChange={(e) => setForm({ ...form, organization: e.target.value })}
                        placeholder={role === "university" ? "e.g. BIT Mesra" : "Organization name"}
                        className="w-full rounded-md border border-input bg-background/50 py-2 pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full rounded-md border border-input bg-background/50 py-2 pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full rounded-md border border-input bg-background/50 py-2 pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              {error && <p className="text-xs text-rose-400">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {authMode === "login" ? "Logging in..." : "Registering..."}
                  </>
                ) : authMode === "login" ? (
                  "Log In"
                ) : (
                  "Create Account"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}