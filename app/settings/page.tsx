"use client"

import { useEffect, useState } from "react"
import { Settings as SettingsIcon, User2, Bell, DatabaseBackup, Download, RefreshCw, CheckCircle2, LifeBuoy, AlertTriangle } from "lucide-react"

function readCookie(name: string): string {
  if (typeof document === "undefined") return ""
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"))
  return m ? decodeURIComponent(m[1]) : ""
}

const PREFS_KEY = "sahyog:prefs"
type Prefs = { emailDigest: boolean; smsAlerts: boolean; autoRefresh: boolean }

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-primary" : "bg-muted"}`}
    >
      <span
        className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`}
      />
    </button>
  )
}

export default function SettingsPage() {
  const [role, setRole] = useState("")
  const [name, setName] = useState("")
  const [institution, setInstitution] = useState("")
  const [prefs, setPrefs] = useState<Prefs>({ emailDigest: true, smsAlerts: false, autoRefresh: false })
  const [savedAt, setSavedAt] = useState("")
  const [resetMsg, setResetMsg] = useState("")
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    setRole(readCookie("userRole") || "user")
    setName(readCookie("userName") || "System User")
    setInstitution(readCookie("userInstitution") || readCookie("userCompany") || "—")
    try {
      const raw = localStorage.getItem(PREFS_KEY)
      if (raw) setPrefs({ emailDigest: true, smsAlerts: false, autoRefresh: false, ...JSON.parse(raw) })
    } catch {}
  }, [])

  const set = (key: keyof Prefs) => {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    localStorage.setItem(PREFS_KEY, JSON.stringify(next))
    setSavedAt(new Date().toLocaleTimeString())
  }

  const downloadLedger = async () => {
    const res = await fetch("/api/problems")
    const data = await res.json()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sahyog-ledger-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const factoryReset = async () => {
    if (!window.confirm("Reset the ENTIRE ledger back to the seeded demo state? All claims, solutions, and interests will be wiped. This only affects the running store — the seed stays intact.")) return
    setResetting(true)
    setResetMsg("")
    try {
      const res = await fetch("/api/reseed", { method: "POST" })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || "failed")
      setResetMsg(`✅ Ledger reset complete — ${body.problems} seeded problems restored, ${body.interests} interests. Reload any data page to see the pristine state.`)
    } catch {
      setResetMsg("❌ Reset failed — check the app server and retry.")
    } finally {
      setResetting(false)
    }
  }

  const prefRows: { key: keyof Prefs; label: string; hint: string }[] = [
    { key: "emailDigest", label: "Daily email digest", hint: "Morning summary of new SIPs in your domain" },
    { key: "smsAlerts", label: "SMS instant alerts", hint: "For high-priority assignments in your district" },
    { key: "autoRefresh", label: "Auto-refresh dashboards", hint: "Polling every 30s on overview screens" },
  ]

  return (
    <div className="flex-1 px-6 py-8 lg:px-10 max-w-3xl mx-auto w-full">
      <div className="mb-8 flex items-center gap-2.5">
        <SettingsIcon className="size-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Control Room Settings</h1>
      </div>

      {/* Profile */}
      <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur p-5 mb-5">
        <h2 className="text-sm font-semibold text-foreground mb-4 inline-flex items-center gap-2">
          <User2 className="size-4 text-primary" /> Session Profile
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg border border-border/60 bg-background/40 px-3.5 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Signed in as</p>
            <p className="text-foreground font-medium truncate">{name}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/40 px-3.5 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Role</p>
            <p className="text-foreground font-medium capitalize">{role}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/40 px-3.5 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Node</p>
            <p className="text-foreground font-medium truncate">{institution}</p>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground inline-flex items-center gap-2">
            <Bell className="size-4 text-primary" /> Notification Preferences
          </h2>
          {savedAt && (
            <span className="text-[11px] text-emerald-400 inline-flex items-center gap-1">
              <CheckCircle2 className="size-3.5" /> saved {savedAt}
            </span>
          )}
        </div>
        <div className="divide-y divide-border/50">
          {prefRows.map((r) => (
            <div key={r.key} className="py-3.5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-foreground">{r.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{r.hint}</p>
              </div>
              <Toggle on={prefs[r.key]} onClick={() => set(r.key)} />
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground/70">Preferences persist locally on this machine.</p>
      </div>

      {/* Data & Ledger */}
      <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur p-5 mb-5">
        <h2 className="text-sm font-semibold text-foreground mb-4 inline-flex items-center gap-2">
          <DatabaseBackup className="size-4 text-primary" /> Data & Ledger
        </h2>
        <div className="space-y-3">
          <button
            onClick={downloadLedger}
            className="w-full inline-flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/40 px-4 py-3 text-sm text-foreground hover:bg-muted/40 transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <Download className="size-4 text-primary" /> Download full ledger (JSON)
            </span>
            <span className="text-[11px] text-muted-foreground">backup / audit</span>
          </button>
          <div className="rounded-lg border border-rose-500/25 bg-rose-500/5 p-4">
            <p className="text-xs text-rose-300 flex items-start gap-2 mb-3">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <span><span className="font-semibold">Demo control.</span> Restores the ledger to its original seeded state — every claim, upload, and interest disappears. The git-tracked seed file is never touched.</span>
            </p>
            <button
              onClick={factoryReset}
              disabled={resetting}
              className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-500 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`size-3.5 ${resetting ? "animate-spin" : ""}`} />
              {resetting ? "Resetting…" : "Factory Reset Ledger"}
            </button>
            {resetMsg && <p className="mt-3 text-xs text-muted-foreground">{resetMsg}</p>}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground/70">
        Something not working? <a href="/support" className="text-primary hover:underline inline-flex items-center gap-1">Open control-room support <LifeBuoy className="size-3" /></a>
      </p>
    </div>
  )
}