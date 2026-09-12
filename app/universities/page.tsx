"use client"

import { useEffect, useMemo, useState } from "react"
import { GraduationCap, MapPin, Search, Users2, FlaskConical, BadgeCheck, ChevronDown, RefreshCw, Inbox } from "lucide-react"

type University = {
  id: string
  name: string
  location: string
  focus: string
}

type Problem = {
  id: string
  sipId?: string
  title?: string
  institution?: string
  status?: string
}

const isResolved = (s?: string) => (s || "").toLowerCase() === "resolved"
const isActive = (s?: string) => {
  const v = (s || "").toLowerCase()
  return v === "assigned" || v === "in progress" || v === "under review"
}

const statusChip: Record<string, string> = {
  resolved: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  "in progress": "text-blue-400 bg-blue-500/10 border-blue-500/30",
  assigned: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  "under review": "text-purple-400 bg-purple-500/10 border-purple-500/30",
  new: "text-rose-400 bg-rose-500/10 border-rose-500/30",
}

export default function UniversitiesPage() {
  const [universities, setUniversities] = useState<University[]>([])
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [query, setQuery] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [uRes, pRes] = await Promise.all([fetch("/api/universities"), fetch("/api/problems")])
      if (!uRes.ok || !pRes.ok) throw new Error("bad response")
      const [u, p] = await Promise.all([uRes.json(), pRes.json()])
      setUniversities(Array.isArray(u) ? u : [])
      setProblems(Array.isArray(p) ? p : [])
      setLoadError("")
    } catch {
      setLoadError("Failed to load node directory — check the app server, then hit Refresh.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const perNode = useMemo(() => {
    const map: Record<string, { claimed: Problem[]; active: number; resolved: number }> = {}
    for (const u of universities) {
      const claimed = problems.filter((p) => p.institution === u.name)
      map[u.name] = {
        claimed,
        active: claimed.filter((p) => isActive(p.status)).length,
        resolved: claimed.filter((p) => isResolved(p.status)).length,
      }
    }
    return map
  }, [universities, problems])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return universities
    return universities.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.location || "").toLowerCase().includes(q) ||
        (u.focus || "").toLowerCase().includes(q)
    )
  }, [universities, query])

  const totals = useMemo(() => {
    const all = universities.flatMap((u) => perNode[u.name]?.claimed ?? [])
    return {
      nodes: universities.length,
      active: all.filter((p) => isActive(p.status)).length,
      resolved: all.filter((p) => isResolved(p.status)).length,
    }
  }, [universities, perNode])

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
            <div key={i} className="h-44 rounded-xl bg-muted/30" />
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
            <GraduationCap className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Academic Node Directory</h1>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl">
            Research institutions registered on the Sahyog grid. Live pipeline counts are computed
            from the grievance ledger — every number here traces back to a real SIP record.
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
          { icon: Users2, label: "Registered Nodes", value: totals.nodes, tone: "text-primary" },
          { icon: FlaskConical, label: "Active R&D Pipelines", value: totals.active, tone: "text-blue-400" },
          { icon: BadgeCheck, label: "Solutions Delivered", value: totals.resolved, tone: "text-emerald-400" },
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

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, city, or research focus..."
          className="w-full rounded-md border border-input bg-background/50 pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-card/40 py-16 text-center">
          <Inbox className="size-8 mx-auto text-muted-foreground/60 mb-3" />
          <p className="text-sm text-muted-foreground">No academic nodes match “{query}”.</p>
          <button onClick={() => setQuery("")} className="mt-2 text-xs font-medium text-rose-400 hover:underline">
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map((u) => {
            const stats = perNode[u.name] ?? { claimed: [], active: 0, resolved: 0 }
            const open = expanded === u.id
            return (
              <div
                key={u.id}
                className="rounded-xl border border-border/80 bg-card/60 backdrop-blur overflow-hidden transition-all hover:border-primary/40"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <h3 className="text-base font-semibold text-foreground leading-snug">{u.name}</h3>
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/40 px-2.5 py-1 text-[11px] text-muted-foreground">
                      <MapPin className="size-3 text-primary" /> {u.location}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(u.focus || "")
                      .split(",")
                      .map((f) => f.trim())
                      .filter(Boolean)
                      .map((f) => (
                        <span
                          key={f}
                          className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
                        >
                          {f}
                        </span>
                      ))}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg border border-border/60 bg-background/40 py-2">
                      <p className="text-lg font-bold text-foreground tabular-nums">{stats.claimed.length}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Claimed</p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background/40 py-2">
                      <p className="text-lg font-bold text-blue-400 tabular-nums">{stats.active}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Active</p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background/40 py-2">
                      <p className="text-lg font-bold text-emerald-400 tabular-nums">{stats.resolved}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Solutions</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpanded(open ? null : u.id)}
                    className="mt-4 w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-border/70 bg-background/40 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
                    {open ? "Hide pipeline" : `View pipeline (${stats.claimed.length})`}
                  </button>
                </div>

                {open && (
                  <div className="border-t border-border/60 bg-background/30 px-5 py-4 animate-fadeIn">
                    {stats.claimed.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-3">
                        No claimed challenges yet — this node is idle on the current ledger.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {stats.claimed.map((p) => (
                          <li
                            key={p.id}
                            className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-card/50 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="text-[11px] font-mono text-primary">{p.sipId || p.id}</p>
                              <p className="text-xs text-foreground truncate mt-0.5">{p.title}</p>
                            </div>
                            <span
                              className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                                statusChip[(p.status || "").toLowerCase()] ??
                                "text-muted-foreground bg-muted/40 border-border/60"
                              }`}
                            >
                              {p.status}
                            </span>
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