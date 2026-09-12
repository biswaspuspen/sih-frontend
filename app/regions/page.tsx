"use client"

import { useEffect, useMemo, useState } from "react"
import { MapPin, Search, Landmark, Flame, BadgeCheck, ChevronDown, RefreshCw, Inbox, AlertTriangle } from "lucide-react"

type Problem = {
  id: string
  sipId?: string
  title?: string
  location?: string
  district?: string
  status?: string
  category?: string
  priority?: string
}

const isResolved = (s?: string) => (s || "").toLowerCase() === "resolved"
const isActive = (s?: string) => {
  const v = (s || "").toLowerCase()
  return v === "assigned" || v === "in progress" || v === "under review"
}
const districtOf = (p: Problem) => p.location || p.district || "Unknown"

const statusChip: Record<string, string> = {
  resolved: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  "in progress": "text-blue-400 bg-blue-500/10 border-blue-500/30",
  assigned: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  "under review": "text-purple-400 bg-purple-500/10 border-purple-500/30",
  new: "text-rose-400 bg-rose-500/10 border-rose-500/30",
}

export default function RegionsPage() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [query, setQuery] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/problems")
      if (!res.ok) throw new Error("bad response")
      const data = await res.json()
      setProblems(Array.isArray(data) ? data : [])
      setLoadError("")
    } catch {
      setLoadError("Failed to load regional breakdown — check the app server, then hit Refresh.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const regions = useMemo(() => {
    const map = new Map<string, Problem[]>()
    for (const p of problems) {
      const d = districtOf(p)
      if (!map.has(d)) map.set(d, [])
      map.get(d)!.push(p)
    }
    return Array.from(map.entries())
      .map(([name, list]) => {
        const highPriority = list.filter((p) => (p.priority || "").toLowerCase() === "high").length
        return {
          name,
          list: [...list].sort((a, b) => (a.sipId || a.id).localeCompare(b.sipId || b.id)),
          total: list.length,
          active: list.filter((p) => isActive(p.status)).length,
          resolved: list.filter((p) => isResolved(p.status)).length,
          fresh: list.filter((p) => !isActive(p.status) && !isResolved(p.status)).length,
          highPriority,
        }
      })
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
  }, [problems])

  const maxTotal = useMemo(() => Math.max(1, ...regions.map((r) => r.total)), [regions])

  const totals = useMemo(() => {
    return {
      districts: regions.length,
      active: regions.reduce((s, r) => s + r.active, 0),
      resolved: regions.reduce((s, r) => s + r.resolved, 0),
    }
  }, [regions])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return regions
    return regions.filter((r) => r.name.toLowerCase().includes(q))
  }, [regions, query])

  if (loading) {
    return (
      <div className="flex-1 px-6 py-8 lg:px-10 max-w-5xl mx-auto w-full animate-pulse">
        <div className="h-8 w-72 rounded bg-muted/40 mb-2" />
        <div className="h-4 w-96 rounded bg-muted/30 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-muted/30" />
          ))}
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-muted/30 mb-3" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex-1 px-6 py-8 lg:px-10 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <MapPin className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Regional Pressure Map</h1>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl">
            Grievance load grouped by district, computed live from the ledger. The hottest district
            gets the longest bar — and the full SIP drilldown underneath it.
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
          { icon: Landmark, label: "Districts Reporting", value: totals.districts, tone: "text-primary" },
          { icon: Flame, label: "Active Cases", value: totals.active, tone: "text-blue-400" },
          { icon: BadgeCheck, label: "Resolved Statewide", value: totals.resolved, tone: "text-emerald-400" },
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
          placeholder="Search district… (e.g. Ranchi, Dhanbad)"
          className="w-full rounded-md border border-input bg-background/50 pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>

      {/* District rows */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-card/40 py-16 text-center">
          <Inbox className="size-8 mx-auto text-muted-foreground/60 mb-3" />
          <p className="text-sm text-muted-foreground">No districts match “{query}”.</p>
          <button onClick={() => setQuery("")} className="mt-2 text-xs font-medium text-rose-400 hover:underline">
            Clear search
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r, idx) => {
            const open = expanded === r.name
            const pct = Math.round((r.total / maxTotal) * 100)
            const resolvedPct = r.total ? Math.round((r.resolved / r.total) * 100) : 0
            const activePct = r.total ? Math.round((r.active / r.total) * 100) : 0
            return (
              <div
                key={r.name}
                className="rounded-xl border border-border/80 bg-card/60 backdrop-blur overflow-hidden transition-all hover:border-primary/40"
              >
                <div className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono text-muted-foreground w-6 tabular-nums">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <h3 className="text-base font-semibold text-foreground">{r.name}</h3>
                      {r.highPriority > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-400">
                          <AlertTriangle className="size-3" /> {r.highPriority} high-priority
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs tabular-nums shrink-0">
                      <span className="text-foreground font-semibold">{r.total} total</span>
                      <span className="text-blue-400">{r.active} active</span>
                      <span className="text-emerald-400">{r.resolved} solved</span>
                      {r.fresh > 0 && <span className="text-rose-400">{r.fresh} new</span>}
                    </div>
                  </div>

                  {/* stacked pressure bar */}
                  <div className="mt-3.5 h-2.5 w-full rounded-full bg-muted/40 overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500/80"
                      style={{ width: `${(resolvedPct / 100) * pct}%` }}
                      title={`${r.resolved} resolved`}
                    />
                    <div
                      className="h-full bg-blue-500/80"
                      style={{ width: `${(activePct / 100) * pct}%` }}
                      title={`${r.active} active`}
                    />
                    <div
                      className="h-full bg-rose-500/70"
                      style={{ width: `${((100 - resolvedPct - activePct) / 100) * pct}%` }}
                      title={`${r.fresh} awaiting assignment`}
                    />
                  </div>

                  <button
                    onClick={() => setExpanded(open ? null : r.name)}
                    className="mt-4 w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-border/70 bg-background/40 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
                    {open ? "Hide cases" : `View all ${r.total} cases`}
                  </button>
                </div>

                {open && (
                  <div className="border-t border-border/60 bg-background/30 px-5 py-4 animate-fadeIn">
                    <ul className="space-y-2">
                      {r.list.map((p) => (
                        <li
                          key={p.id}
                          className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-card/50 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="text-[11px] font-mono text-primary">{p.sipId || p.id}</p>
                            <p className="text-xs text-foreground truncate mt-0.5">{p.title}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {p.category && (
                              <span className="hidden sm:inline rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                                {p.category}
                              </span>
                            )}
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                                statusChip[(p.status || "").toLowerCase()] ??
                                "text-muted-foreground bg-muted/40 border-border/60"
                              }`}
                            >
                              {p.status}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-emerald-500/80" /> resolved</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-blue-500/80" /> active</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-rose-500/70" /> awaiting assignment</span>
        <span className="ml-auto">bar length = share of the state's caseload</span>
      </div>
    </div>
  )
}