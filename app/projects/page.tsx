"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Users, MapPin, AlertCircle, FolderKanban, ArrowUpRight, FileCheck2, Handshake } from "lucide-react"

interface TeamMember {
  id: string
  name: string
  role: string
}

interface Problem {
  id: string
  sipId?: string
  title: string
  category: string
  district?: string
  location?: string
  status: string
  institution: string
  priority?: string
  team?: TeamMember[]
  assignedAt?: string
  solutionFileName?: string
  solutionSubmittedAt?: string
}

// An industry company's expression of interest in one of this node's solutions
interface InterestFlag {
  id: string | number
  problemId: string
  company: string
  interestedAt?: string
}

const norm = (v?: string) => (v || "").trim().toLowerCase()

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

export default function MyProjectsPage() {
  const [userInstitution, setUserInstitution] = useState("BIT Mesra")
  const [mounted, setMounted] = useState(false)
  const [claims, setClaims] = useState<Problem[]>([])
  const [interestFlags, setInterestFlags] = useState<InterestFlag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("userInstitution")
    if (saved) setUserInstitution(saved)
  }, [])

  useEffect(() => {
    if (!mounted) return
    Promise.all([
      fetch("/api/problems").then((res) => res.json()),
      // Industry-interest notifications addressed to this academic node
      fetch(`/api/interests?institution=${encodeURIComponent(userInstitution)}`).then((res) => res.json()),
    ])
      .then(([problemsData, interestsData]) => {
        if (Array.isArray(problemsData)) {
          const mine = problemsData
            .filter((p: Problem) => norm(p.institution) === norm(userInstitution))
            .sort((a: Problem, b: Problem) => (b.assignedAt || "").localeCompare(a.assignedAt || ""))
          setClaims(mine)
        }
        if (Array.isArray(interestsData)) setInterestFlags(interestsData)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to fetch claims", err)
        setLoading(false)
      })
  }, [mounted, userInstitution])

  if (!mounted) return null

  const active = claims.filter((p) => p.status !== "Resolved")
  const completed = claims.filter((p) => p.status === "Resolved")

  const renderCard = (item: Problem) => {
    // Notifications: any industry interest aimed at this claimed problem
    const flags = interestFlags.filter((f) => String(f.problemId) === String(item.id))
    return (
      <div key={item.id} className="rounded-xl border border-border/80 bg-card/60 shadow-sm overflow-hidden hover:border-primary/30 transition-colors">
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-xs text-primary">{item.sipId || item.id}</p>
              <h3 className="mt-1 text-sm font-semibold text-foreground leading-snug">{item.title}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" /> {item.district || item.location || "—"}
                </span>
                <span className="bg-muted px-2 py-0.5 rounded font-medium">{item.category}</span>
                {item.priority === "High" && <span className="text-rose-400 font-semibold">High Priority</span>}
              </div>
            </div>
            <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider shrink-0 ${statusChip(item.status)}`}>
              {item.status}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded border border-border/60 bg-background/50 p-2.5">
              <span className="text-muted-foreground block mb-1 text-[10px] font-semibold uppercase tracking-wider">Claimed On</span>
              <span className="font-mono text-foreground">{fmtDate(item.assignedAt)}</span>
            </div>
            <div className="rounded border border-border/60 bg-background/50 p-2.5">
              <span className="text-muted-foreground block mb-1 text-[10px] font-semibold uppercase tracking-wider">Deliverable</span>
              {item.solutionFileName ? (
                <span className="font-mono text-emerald-400/90 block truncate">📎 {item.solutionFileName}</span>
              ) : (
                <span className="text-muted-foreground">Pending upload</span>
              )}
            </div>
          </div>

          <div className="mt-4">
            <span className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <Users className="size-3" /> Project Team · {item.team?.length || 0}
            </span>
            {item.team && item.team.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {item.team.map((m) => (
                  <span key={m.id} className="inline-flex items-center gap-1.5 bg-muted px-2 py-1 rounded text-[11px] text-foreground/80 font-medium">
                    {m.name}
                    <span className={`text-[9px] font-semibold uppercase ${m.role === "Professor" ? "text-purple-400" : "text-blue-400"}`}>
                      {m.role}
                    </span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">No team recorded (legacy assignment).</p>
            )}
          </div>

          {/* INDUSTRY INTEREST NOTIFICATION — appears when a company marks this solution */}
          {flags.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                <Handshake className="size-3" /> Industry Interest · {flags.length}
              </p>
              {flags.map((f) => (
                <p key={String(f.id)} className="mt-1 text-[11px] leading-relaxed text-foreground/80">
                  <span className="font-medium text-foreground">{f.company}</span> expressed interest in adopting this solution
                  <span className="text-muted-foreground"> · {fmtDate(f.interestedAt)}</span>
                </p>
              ))}
            </div>
          )}
        </div>

        {item.solutionFileName && (
          <div className="px-5 py-2.5 border-t border-border/50 bg-muted/5 flex items-center gap-2 text-[11px] text-emerald-400/90">
            <FileCheck2 className="size-3.5" /> Solution on ledger
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 px-6 py-8 lg:px-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
            Node Portfolio
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Projects</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every challenge claimed by {userInstitution} — team rosters, current stage, and deliverables.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-muted-foreground border border-dashed rounded-xl border-border/60">
          Syncing claim registry...
        </div>
      ) : claims.length === 0 ? (
        <div className="p-10 text-center border border-dashed rounded-xl border-border/60 flex flex-col items-center text-muted-foreground">
          <AlertCircle className="size-8 mb-3 opacity-50" />
          <p className="text-sm">No challenges claimed yet.</p>
          <Link
            href="/challenges"
            className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <FolderKanban className="size-3.5" /> Browse Open Challenges <ArrowUpRight className="size-3" />
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-2">
            <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
            <h2 className="text-sm font-semibold text-foreground">Active R&D</h2>
            <span className="text-xs text-muted-foreground font-mono">({active.length})</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 mb-10">
            {active.map(renderCard)}
          </div>

          <div className="mb-3 flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" />
            <h2 className="text-sm font-semibold text-foreground">Completed & Deployed</h2>
            <span className="text-xs text-muted-foreground font-mono">({completed.length})</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {completed.map(renderCard)}
          </div>
        </>
      )}
    </div>
  )
}
