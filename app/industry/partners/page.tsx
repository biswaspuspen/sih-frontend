"use client"

import { useEffect, useMemo, useState } from "react"
import { Factory, MapPin, Search, Building2, Eye, Handshake, Layers, ChevronDown, RefreshCw, Inbox } from "lucide-react"

type Partner = {
  id: string
  name: string
  sector: string
  location: string
}

type Interest = {
  id: string
  company?: string
  institution?: string
  sipId?: string
  challengeId?: string
  problemId?: string
  challengeTitle?: string
  title?: string
}

const isResolved = (s?: string) => (s || "").toLowerCase() === "resolved"
const isActive = (s?: string) => {
  const v = (s || "").toLowerCase()
  return v === "assigned" || v === "in progress" || v === "under review"
}

const sectorTone: Record<string, string> = {
  "materials & infrastructure": "border-blue-500/30 bg-blue-500/10 text-blue-400",
  "energy & environment": "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  manufacturing: "border-purple-500/30 bg-purple-500/10 text-purple-400",
  technology: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
}

export default function IndustryPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [interests, setInterests] = useState<Interest[]>([])
  const [problems, setProblems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [query, setQuery] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [iRes, wRes, pRes] = await Promise.all([
        fetch("/api/industry"),
        fetch("/api/interests"),
        fetch("/api/problems"),
      ])
      if (!iRes.ok || !wRes.ok || !pRes.ok) throw new Error("bad response")
      const [ind, watch, probs] = await Promise.all([iRes.json(), wRes.json(), pRes.json()])
      setPartners(Array.isArray(ind) ? ind : [])
      setInterests(Array.isArray(watch) ? watch : [])
      setProblems(Array.isArray(probs) ? probs : [])
      setLoadError("")
    } catch {
      setLoadError("Failed to load partner directory — check the app server, then hit Refresh.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const perPartner = useMemo(() => {
    const map: Record<string, Interest[]> = {}
    for (const c of partners) {
      map[c.name] = interests.filter((i) => (i.company || "") === c.name)
    }
    return map
  }, [partners, interests])

  const liveSolutions = useMemo(
    () => problems.filter((p) => (p.solutionFileName || p.solutionNotes) && isResolved(p.status)),
    [problems]
  )

  const sectors = useMemo(() => new Set(partners.map((c) => c.sector).filter(Boolean)).size, [partners])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return partners
    return partners.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.location || "").toLowerCase().includes(q) ||
        (c.sector || "").toLowerCase().includes(q)
    )
  }, [partners, query])

  if (loading) {
    return (
      <div className="flex-1 px-6 py-8 lg:px-10 max-w-6xl mx-auto w-full animate-pulse">
        <div className="h-8 w-72 rounded bg-muted/40 mb-2" />
        <div className="h-4 w-96 rounded bg-muted/30 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-muted/30" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-muted/30" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 px-6 py-8 lg:px-10 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Factory className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Industrial Partner Registry</h1>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl">
            Industry bodies plugged into the solution exchange. Watchlist counts are pulled from the
            live interests ledger — they move the moment a company watches a solution.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-md border border-border/80 bg-card/60 px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          <RefreshCw className="size-3.5" /> Refresh
        </button>
      </div>

      {loadError && (
        <div className="mb-6 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
          {loadError}
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Building2, label: "Registered Partners", value: partners.length, tone: "text-primary" },
          { icon: Eye, label: "Watchlist Entries", value: interests.length, tone: "text-blue-400" },
          { icon: Layers, label: "Sectors Covered", value: sectors, tone: "text-emerald-400" },
        ].map(({ icon: Icon, label, value, tone }) => (
          <div key={label} className="rounded-xl border border-border/80 bg-card/60 backdrop-blur px-5 py-4 flex items-center gap-4">
            <div className={`rounded-lg bg-muted/50 p-2.5 ${tone}`}>
              <Icon className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Market pulse line */}
      <div className="mb-6 rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-xs text-muted-foreground flex items-center gap-2">
        <Handshake className="size-4 text-primary shrink-0" />
        <span>
          <span className="font-semibold text-foreground">{liveSolutions.length}</span> deployed solution{liveSolutions.length === 1 ? "" : "s"} currently
          open to pilot adoption on the exchange —{" "}
          <span className="font-semibold text-foreground">{Math.max(0, problems.filter((p) => isActive(p.status)).length)}</span> more
          in active R&D pipelines.
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by company, sector, or city..."
          className="w-full rounded-md border border-input bg-background/50 pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-card/40 py-16 text-center">
          <Inbox className="size-8 mx-auto text-muted-foreground/60 mb-3" />
          <p className="text-sm text-muted-foreground">No partners match “{query}”.</p>
          <button onClick={() => setQuery("")} className="mt-2 text-xs font-medium text-rose-400 hover:underline">
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map((c) => {
            const watch = perPartner[c.name] ?? []
            const open = expanded === c.id
            return (
              <div
                key={c.id}
                className="rounded-xl border border-border/80 bg-card/60 backdrop-blur overflow-hidden transition-all hover:border-primary/40"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 size-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-sm font-bold">
                        {c.name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("")}
                      </div>
                      <h3 className="text-base font-semibold text-foreground leading-snug">{c.name}</h3>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/40 px-2.5 py-1 text-[11px] text-muted-foreground">
                      <MapPin className="size-3 text-primary" /> {c.location}
                    </span>
                  </div>

                  <div className="mt-3">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                        sectorTone[(c.sector || "").toLowerCase()] ??
                        "border-border/70 bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      {c.sector}
                    </span>
                  </div>

                  <div className="mt-4 rounded-lg border border-border/60 bg-background/40 py-2.5 px-3 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Solutions on watchlist</span>
                    <span className="text-lg font-bold text-blue-400 tabular-nums inline-flex items-center gap-1.5">
                      <Eye className="size-3.5" /> {watch.length}
                    </span>
                  </div>

                  <button
                    onClick={() => setExpanded(open ? null : c.id)}
                    className="mt-4 w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-border/70 bg-background/40 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
                    {open ? "Hide watchlist" : `View watchlist (${watch.length})`}
                  </button>
                </div>

                {open && (
                  <div className="border-t border-border/60 bg-background/30 px-5 py-4 animate-fadeIn">
                    {watch.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-3">
                        No watchlist entries yet — this partner hasn’t bookmarked any exchange solutions.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {watch.map((i) => (
                          <li
                            key={i.id}
                            className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-card/50 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="text-[11px] font-mono text-primary">{i.sipId || i.challengeId || i.problemId || "—"}</p>
                              <p className="text-xs text-foreground truncate mt-0.5">
                                {i.challengeTitle || i.title || "Solution exchange entry"}
                              </p>
                            </div>
                            {i.institution && (
                              <span className="shrink-0 rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                                {i.institution}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}