"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Handshake, Inbox, MapPin, Users, FileCheck2, X, ArrowUpRight, Building2 } from "lucide-react"

interface TeamMember {
  id: string
  name: string
  role: string
}

interface Interest {
  id: string | number
  problemId: string
  sipId?: string
  title: string
  category: string
  district?: string
  institution: string
  status: string
  solutionFileName?: string
  solutionNotes?: string
  team?: TeamMember[]
  company: string
  interestedAt?: string
}

function fmtDate(iso?: string) {
  if (!iso) return "—"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function statusChip(status: string) {
  if (status === "In Progress") return "bg-blue-500/10 text-blue-400 border border-blue-500/20"
  if (status === "Assigned") return "bg-purple-500/10 text-purple-400 border border-purple-500/20"
  if (status === "Resolved") return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
  return "bg-amber-500/10 text-amber-400 border border-amber-500/20"
}

export default function MyInterestsPage() {
  const [userCompany, setUserCompany] = useState("Tata Steel Ltd.")
  const [mounted, setMounted] = useState(false)
  const [interests, setInterests] = useState<Interest[]>([])
  // Live problem statuses — the interest record is a point-in-time log;
  // the chip + section split always follow the CURRENT ledger state
  const [liveStatus, setLiveStatus] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [withdrawing, setWithdrawing] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("userCompany")
    if (saved) setUserCompany(saved)
  }, [])

  useEffect(() => {
    if (!mounted) return
    Promise.all([
      fetch(`/api/interests?company=${encodeURIComponent(userCompany)}`).then((res) => res.json()),
      fetch("/api/problems").then((res) => res.json()),
    ])
      .then(([interestData, problemData]) => {
        if (Array.isArray(problemData)) {
          const map: Record<string, string> = {}
          problemData.forEach((p: { id: string | number; status: string }) => {
            map[String(p.id)] = p.status
          })
          setLiveStatus(map)
        }
        if (Array.isArray(interestData)) {
          const sorted = [...interestData].sort((a, b) => (b.interestedAt || "").localeCompare(a.interestedAt || ""))
          setInterests(sorted)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to fetch interests", err)
        setLoading(false)
      })
  }, [mounted, userCompany])

  async function withdraw(it: Interest) {
    setWithdrawing((prev) => ({ ...prev, [String(it.id)]: true }))
    try {
      const res = await fetch(`/api/interests/${it.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      setInterests((prev) => prev.filter((x) => String(x.id) !== String(it.id)))
    } catch (err) {
      console.error("Withdraw failed", err)
      alert("Couldn't withdraw — check that json-server is running on :5000.")
    } finally {
      setWithdrawing((prev) => ({ ...prev, [String(it.id)]: false }))
    }
  }

  if (!mounted) return null

  // Live status wins; the snapshot inside the interest record is only a fallback
  const statusOf = (it: Interest) => liveStatus[String(it.problemId)] ?? it.status

  const active = interests.filter((i) => statusOf(i) !== "Resolved")
  const deployed = interests.filter((i) => statusOf(i) === "Resolved")

  const renderCard = (it: Interest) => {
    const currentStatus = statusOf(it)
    return (
      <div key={it.id} className="rounded-xl border border-border/80 bg-card/60 shadow-sm overflow-hidden hover:border-primary/30 transition-colors">
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-xs text-primary">{it.sipId || it.problemId}</p>
              <h3 className="mt-1 text-sm font-semibold text-foreground leading-snug">{it.title}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" /> {it.district || "—"}
                </span>
                <span className="bg-muted px-2 py-0.5 rounded font-medium">{it.category}</span>
              </div>
            </div>
            <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider shrink-0 ${statusChip(currentStatus)}`}>
              {currentStatus}
            </span>
          </div>

          <div className="mt-4 rounded-lg border border-border/60 bg-background/50 p-3">
            <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Building2 className="size-3" /> University Deliverable · {it.institution}
            </span>
            {it.solutionFileName && (
              <span className="flex items-center gap-1.5 font-mono text-xs text-emerald-400/90">
                <FileCheck2 className="size-3.5 shrink-0" />
                <span className="truncate">{it.solutionFileName}</span>
              </span>
            )}
            {it.solutionNotes && (
              <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">{it.solutionNotes}</p>
            )}
          </div>

          {it.team && it.team.length > 0 && (
            <div className="mt-4">
              <span className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                <Users className="size-3" /> Research Team · {it.team.length}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {it.team.map((m) => (
                  <span key={m.id} className="inline-flex items-center gap-1.5 bg-muted px-2 py-1 rounded text-[11px] text-foreground/80 font-medium">
                    {m.name}
                    <span className={`text-[9px] font-semibold uppercase ${m.role === "Professor" ? "text-purple-400" : "text-blue-400"}`}>
                      {m.role}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
            <span className="text-[10px] text-muted-foreground">
              Interest logged <span className="font-mono text-foreground/80">{fmtDate(it.interestedAt)}</span>
            </span>
            <button
              onClick={() => withdraw(it)}
              disabled={withdrawing[String(it.id)]}
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-50"
            >
              <X className="size-3.5" />
              {withdrawing[String(it.id)] ? "Withdrawing..." : "Withdraw"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 px-6 py-8 lg:px-10 max-w-5xl mx-auto pb-16">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
            Adoption Pipeline
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Interests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Solutions <span className="font-medium text-foreground">{userCompany}</span> is tracking for pilot adoption and procurement.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-muted-foreground border border-dashed rounded-xl border-border/60">
          Syncing interest ledger...
        </div>
      ) : interests.length === 0 ? (
        <div className="p-10 text-center border border-dashed rounded-xl border-border/60 flex flex-col items-center text-muted-foreground">
          <Inbox className="size-8 mb-3 opacity-60" />
          <p className="text-sm font-medium text-foreground">No interests logged yet</p>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            University deliverables you mark as Interested on the Solution Exchange are tracked here.
          </p>
          <Link
            href="/industry"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <Handshake className="size-4" />
            Browse Solution Exchange
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-2">
            <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
            <h2 className="text-sm font-semibold text-foreground">Active Research</h2>
            <span className="text-xs text-muted-foreground font-mono">({active.length})</span>
          </div>
          {active.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 mb-10">
              {active.map(renderCard)}
            </div>
          ) : (
            <p className="mb-10 text-xs text-muted-foreground">Nothing in active research — resolved deliverables are listed below.</p>
          )}

          <div className="mb-3 flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" />
            <h2 className="text-sm font-semibold text-foreground">Resolved · Deployment-Ready</h2>
            <span className="text-xs text-muted-foreground font-mono">({deployed.length})</span>
          </div>
          {deployed.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {deployed.map(renderCard)}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No resolved deliverables tracked yet.</p>
          )}

          <div className="mt-8 flex justify-end">
            <Link
              href="/industry"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              Back to Solution Exchange <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
