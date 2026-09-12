"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Building2, Cpu, Droplets, Leaf, HeartPulse, Factory, Handshake, MapPin, Users, FileCheck2, Check, ArrowUpRight, AlertCircle } from "lucide-react"

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
  location: string
  district?: string
  status: string
  submittedDate: string
  institution: string
  priority?: string
  solutionFileName?: string
  solutionNotes?: string
  team?: TeamMember[]
}

interface Interest {
  id: string | number
  problemId: string
  company: string
}

function statusChip(status: string) {
  if (status === "In Progress") return "bg-blue-500/10 text-blue-400 border border-blue-500/20"
  if (status === "Assigned") return "bg-purple-500/10 text-purple-400 border border-purple-500/20"
  if (status === "Resolved") return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
  return "bg-amber-500/10 text-amber-400 border border-amber-500/20"
}

const PARTNERS = [
  {
    name: "Tata Steel Tech Ventures",
    domain: "Water Resources",
    hq: "Jamshedpur",
    focus: "Industrial water reuse, slurry pipeline telemetry",
    icon: Droplets,
  },
  {
    name: "Usha Martin R&D",
    domain: "Urban Development",
    hq: "Ranchi",
    focus: "Structural materials, smart-city infrastructure",
    icon: Building2,
  },
  {
    name: "MECON Ltd",
    domain: "Energy",
    hq: "Ranchi",
    focus: "Metallurgical engineering, power systems consulting",
    icon: Cpu,
  },
  {
    name: "JUSCO Utilities",
    domain: "Water Resources",
    hq: "Jamshedpur",
    focus: "Municipal water & sanitation operations",
    icon: Droplets,
  },
  {
    name: "Adityapur Industrial Cluster",
    domain: "Environment",
    hq: "Adityapur",
    focus: "MSME manufacturing, effluent treatment",
    icon: Leaf,
  },
  {
    name: "HEC Innovation Cell",
    domain: "Healthcare",
    hq: "Ranchi",
    focus: "Heavy equipment, medical-device fabrication",
    icon: HeartPulse,
  },
]

export default function IndustryPage() {
  const [role, setRole] = useState("government")
  const [userCompany, setUserCompany] = useState("Tata Steel Ltd.")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const r = localStorage.getItem("userRole")
    if (r) setRole(r)
    const c = localStorage.getItem("userCompany")
    if (c) setUserCompany(c)
  }, [])

  if (!mounted) return null

  // Industry partners get the Solution Exchange; government/admin keep the partner directory
  if (role === "industry") {
    return <SolutionExchange company={userCompany} />
  }
  return <GovernmentIndustryView />
}

/* ================= INDUSTRY ROLE: SOLUTION EXCHANGE ================= */

function SolutionExchange({ company }: { company: string }) {
  const [problems, setProblems] = useState<Problem[]>([])
  const [interests, setInterests] = useState<Interest[]>([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState<Record<string, boolean>>({})
  const [error, setError] = useState("")

  useEffect(() => {
    Promise.all([
      fetch("/api/problems").then((r) => r.json()),
      fetch(`/api/interests?company=${encodeURIComponent(company)}`).then((r) => r.json()),
    ])
      .then(([problemsData, interestsData]) => {
        if (Array.isArray(problemsData)) setProblems(problemsData)
        if (Array.isArray(interestsData)) setInterests(interestsData)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to load solution exchange", err)
        setLoading(false)
      })
  }, [company])

  // Only challenges with an actual university deliverable are adoptable
  const market = useMemo(
    () => problems.filter((p) => p.solutionFileName),
    [problems]
  )

  const interestedIds = useMemo(
    () => new Set(interests.map((i) => String(i.problemId))),
    [interests]
  )

  async function expressInterest(p: Problem) {
    setError("")
    setPosting((prev) => ({ ...prev, [p.id]: true }))
    try {
      const res = await fetch("/api/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: p.id,
          sipId: p.sipId || p.id,
          title: p.title,
          category: p.category,
          district: p.district || p.location,
          institution: p.institution,
          status: p.status,
          solutionFileName: p.solutionFileName,
          solutionNotes: p.solutionNotes || "",
          team: p.team || [],
          company,
          interestedAt: new Date().toISOString(),
        }),
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const saved = await res.json()
      setInterests((prev) => [...prev, saved])
    } catch (err) {
      console.error("Interest failed", err)
      setError("Couldn't log interest — check that json-server is running on :5000.")
    } finally {
      setPosting((prev) => ({ ...prev, [p.id]: false }))
    }
  }

  return (
    <div className="flex-1 px-6 py-8 lg:px-10 max-w-5xl mx-auto pb-16">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
            Adoption Pipeline
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Solution Exchange</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          University research deliverables open for pilot adoption and procurement — browsing as <span className="font-medium text-foreground">{company}</span>.
        </p>
      </div>

      {error && <p className="mb-4 text-xs text-rose-400">{error}</p>}

      {loading ? (
        <div className="p-8 text-center text-sm text-muted-foreground border border-dashed rounded-xl border-border/60">
          Syncing solution ledger...
        </div>
      ) : market.length === 0 ? (
        <div className="p-10 text-center border border-dashed rounded-xl border-border/60 flex flex-col items-center text-muted-foreground">
          <AlertCircle className="size-8 mb-3 opacity-50" />
          <p className="text-sm">No university deliverables on the ledger yet — solutions surface here as academic nodes upload them.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {market.map((p) => {
            const already = interestedIds.has(String(p.id))
            const busy = posting[p.id]
            return (
              <div key={p.id} className="rounded-xl border border-border/80 bg-card/60 shadow-sm overflow-hidden hover:border-primary/30 transition-colors flex flex-col">
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-primary">{p.sipId || p.id}</p>
                      <h3 className="mt-1 text-sm font-semibold text-foreground leading-snug">{p.title}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3" /> {p.district || p.location || "—"}
                        </span>
                        <span className="bg-muted px-2 py-0.5 rounded font-medium">{p.category}</span>
                        {p.priority === "High" && <span className="text-rose-400 font-semibold">High Priority</span>}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider shrink-0 ${statusChip(p.status)}`}>
                      {p.status}
                    </span>
                  </div>

                  {/* University deliverable */}
                  <div className="mt-4 rounded-lg border border-border/60 bg-background/50 p-3">
                    <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Building2 className="size-3" /> University Deliverable · {p.institution}
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-xs text-emerald-400/90">
                      <FileCheck2 className="size-3.5 shrink-0" />
                      <span className="truncate">{p.solutionFileName}</span>
                    </span>
                    {p.solutionNotes && (
                      <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">{p.solutionNotes}</p>
                    )}
                  </div>

                  {/* Research team */}
                  <div className="mt-4 flex-1">
                    <span className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      <Users className="size-3" /> Research Team · {p.team?.length || 0}
                    </span>
                    {p.team && p.team.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {p.team.map((m) => (
                          <span key={m.id} className="inline-flex items-center gap-1.5 bg-muted px-2 py-1 rounded text-[11px] text-foreground/80 font-medium">
                            {m.name}
                            <span className={`text-[9px] font-semibold uppercase ${m.role === "Professor" ? "text-purple-400" : "text-blue-400"}`}>
                              {m.role}
                            </span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">Team on file with the academic node.</p>
                    )}
                  </div>

                  {/* Action row */}
                  <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
                    <span className="text-[10px] text-muted-foreground">Deliverable verified on state ledger</span>
                    {already ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                        <Check className="size-3.5" /> Interested
                      </span>
                    ) : (
                      <button
                        onClick={() => expressInterest(p)}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
                      >
                        <Handshake className="size-3.5" />
                        {busy ? "Logging..." : "Interested"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && interests.length > 0 && (
        <div className="mt-6 flex justify-end">
          <Link
            href="/my-interests"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            View My Interests ({interests.length}) <ArrowUpRight className="size-3" />
          </Link>
        </div>
      )}
    </div>
  )
}

/* ================= GOVERNMENT / ADMIN VIEW (unchanged) ================= */

function GovernmentIndustryView() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [requested, setRequested] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch("/api/problems")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProblems(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Live count of field deployments matching each partner's domain
  const pilotCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    problems.forEach((p) => {
      if (p.status === "In Progress" || p.status === "Resolved") {
        counts[p.category] = (counts[p.category] || 0) + 1
      }
    })
    return counts
  }, [problems])

  return (
    <div className="flex-1 px-6 py-8 lg:px-10 max-w-[1200px] mx-auto pb-16">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Industry Collaboration Grid</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Private-sector partners matched against active academic field deployments.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Syncing partner network...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-10">
            {PARTNERS.map((partner) => {
              const Icon = partner.icon
              const pilots = pilotCounts[partner.domain] || 0
              const isRequested = requested[partner.name]
              return (
                <div
                  key={partner.name}
                  className="rounded-xl border border-border/80 bg-card/70 p-5 shadow-sm flex flex-col"
                >
                  <div className="flex items-center justify-between">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-medium text-muted-foreground">
                      {partner.domain}
                    </span>
                  </div>
                  <h2 className="mt-3 font-semibold text-foreground">{partner.name}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">{partner.hq}</p>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed flex-1">
                    {partner.focus}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
                    <span className="text-xs text-muted-foreground">
                      <span className="font-mono font-semibold text-foreground">{pilots}</span> live{" "}
                      {pilots === 1 ? "pilot" : "pilots"} in domain
                    </span>
                    <button
                      onClick={() =>
                        setRequested((prev) => ({ ...prev, [partner.name]: true }))
                      }
                      disabled={isRequested}
                      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isRequested
                          ? "bg-emerald-500/10 text-emerald-400 cursor-default"
                          : "bg-primary/10 text-primary hover:bg-primary/20"
                      }`}
                    >
                      <Handshake className="size-3.5" />
                      {isRequested ? "Interest Logged" : "Express Interest"}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Active field deployments strip */}
          <div className="rounded-xl border border-border/80 bg-card/60 shadow-sm overflow-hidden">
            <div className="border-b border-border/60 bg-muted/10 px-5 py-3.5 flex items-center gap-2">
              <Factory className="size-4 text-muted-foreground" />
              <div>
                <h2 className="text-sm font-semibold text-card-foreground">Deployments Open to Industry</h2>
                <p className="text-xs text-muted-foreground">
                  In-progress and resolved challenges eligible for pilot partnerships
                </p>
              </div>
            </div>
            <div className="divide-y divide-border/40">
              {problems
                .filter((p) => p.status === "In Progress" || p.status === "Resolved")
                .map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-medium text-primary">{p.sipId || p.id}</span>
                        <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-medium text-muted-foreground">
                          {p.category}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-foreground truncate">{p.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">
                        {p.district || p.location} · {p.institution}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider ${statusChip(p.status)}`}
                    >
                      {p.status}
                    </span>
                  </div>
                ))}
              {problems.filter((p) => p.status === "In Progress" || p.status === "Resolved").length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                  No field deployments yet — assignments will surface here as the pipeline advances.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
