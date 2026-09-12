"use client"

import { useEffect, useMemo, useState } from "react"
import { BarChart3, Search, FileText, BadgeCheck, Activity, Timer, RefreshCw, Inbox, Download, Printer, PieChart as PieIcon } from "lucide-react"

type Problem = {
  id: string
  sipId?: string
  title?: string
  location?: string
  district?: string
  category?: string
  status?: string
  createdAt?: string
  submittedDate?: string
  solutionSubmittedAt?: string
}

const isResolved = (s?: string) => (s || "").toLowerCase() === "resolved"
const isActive = (s?: string) => {
  const v = (s || "").toLowerCase()
  return v === "assigned" || v === "in progress" || v === "under review"
}
const districtOf = (p: Problem) => p.location || p.district || "Unknown"
const domainOf = (p: Problem) => p.category || "Uncategorized"
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)
const daysBetween = (from?: string, to?: string) => {
  if (!from || !to) return NaN
  const a = Date.parse(from)
  const b = Date.parse(to)
  return Number.isNaN(a) || Number.isNaN(b) ? NaN : (b - a) / 86400000
}

export default function ReportsPage() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [query, setQuery] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/problems")
      if (!res.ok) throw new Error("bad response")
      const data = await res.json()
      setProblems(Array.isArray(data) ? data : [])
      setLoadError("")
    } catch {
      setLoadError("Failed to compute report — check the app server, then hit Refresh.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stats = useMemo(() => {
    const total = problems.length
    const resolved = problems.filter((p) => isResolved(p.status)).length
    const active = problems.filter((p) => isActive(p.status)).length
    const fresh = total - resolved - active
    const daySamples = problems
      .filter((p) => isResolved(p.status))
      .map((p) => daysBetween(p.createdAt || p.submittedDate, p.solutionSubmittedAt))
      .filter((d) => !Number.isNaN(d) && d >= 0)
    const avgDays = daySamples.length
      ? Math.round((daySamples.reduce((a, b) => a + b, 0) / daySamples.length) * 10) / 10
      : null
    return { total, resolved, active, fresh, avgDays, rate: pct(resolved, total) }
  }, [problems])

  const byDomain = useMemo(() => {
    const map = new Map<string, { total: number; resolved: number; active: number }>()
    for (const p of problems) {
      const d = domainOf(p)
      const row = map.get(d) ?? { total: 0, resolved: 0, active: 0 }
      row.total++
      if (isResolved(p.status)) row.resolved++
      else if (isActive(p.status)) row.active++
      map.set(d, row)
    }
    return Array.from(map.entries())
      .map(([name, r]) => ({ name, ...r, rate: pct(r.resolved, r.total) }))
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
  }, [problems])

  const byDistrict = useMemo(() => {
    const map = new Map<string, { total: number; resolved: number; active: number; fresh: number }>()
    for (const p of problems) {
      const d = districtOf(p)
      const row = map.get(d) ?? { total: 0, resolved: 0, active: 0, fresh: 0 }
      row.total++
      if (isResolved(p.status)) row.resolved++
      else if (isActive(p.status)) row.active++
      else row.fresh++
      map.set(d, row)
    }
    return Array.from(map.entries())
      .map(([name, r]) => ({ name, ...r, rate: pct(r.resolved, r.total) }))
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
  }, [problems])

  const filteredDistricts = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return byDistrict
    return byDistrict.filter((r) => r.name.toLowerCase().includes(q))
  }, [byDistrict, query])

  const exportCsv = () => {
    const rows: string[] = []
    const stamp = new Date().toISOString().split("T")[0]
    rows.push(`Sahyog State Operations Report,generated ${stamp}`)
    rows.push("")
    rows.push("Summary")
    rows.push("Total Reported,Resolved,Active,Awaiting Assignment,Resolution Rate (%),Avg Days to Resolve")
    rows.push(`${stats.total},${stats.resolved},${stats.active},${stats.fresh},${stats.rate},${stats.avgDays ?? ""}`)
    rows.push("")
    rows.push("Resolution by Domain")
    rows.push("Domain,Total,Active,Resolved,Resolution Rate (%)")
    byDomain.forEach((r) => rows.push(`"${r.name}",${r.total},${r.active},${r.resolved},${r.rate}`))
    rows.push("")
    rows.push("District Operations Matrix")
    rows.push("District,Total,New,Active,Resolved,Resolution Rate (%)")
    byDistrict.forEach((r) => rows.push(`"${r.name}",${r.total},${r.fresh},${r.active},${r.resolved},${r.rate}`))
    rows.push("")
    rows.push("Full Ledger")
    rows.push("SIP ID,Title,District,Domain,Status")
    problems.forEach((p) =>
      rows.push(`"${p.sipId || p.id}","${(p.title || "").replace(/"/g, '""')}","${districtOf(p)}","${domainOf(p)}","${p.status || ""}"`)
    )
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sahyog-state-report-${stamp}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex-1 px-6 py-8 lg:px-10 max-w-6xl mx-auto w-full animate-pulse">
        <div className="h-8 w-72 rounded bg-muted/40 mb-2" />
        <div className="h-4 w-96 rounded bg-muted/30 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-muted/30" />
          ))}
        </div>
        <div className="h-56 rounded-xl bg-muted/30 mb-5" />
        <div className="h-72 rounded-xl bg-muted/30" />
      </div>
    )
  }

  return (
    <div className="flex-1 px-6 py-8 lg:px-10 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <BarChart3 className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">State Operations Report</h1>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl">
            Every figure on this page is computed from the live grievance ledger at render time.
            Export it for cabinet circulation, or print straight to PDF.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-md border border-border/80 bg-card/60 px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <RefreshCw className="size-3.5" /> Refresh
          </button>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3.5 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            <Download className="size-3.5" /> Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-md border border-border/80 bg-card/60 px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <Printer className="size-3.5" /> Print
          </button>
        </div>
      </div>

      {loadError && (
        <div className="mb-6 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
          {loadError}
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: FileText, label: "Total Reported", value: stats.total, tone: "text-primary" },
          { icon: BadgeCheck, label: "Resolved", value: `${stats.resolved} (${stats.rate}%)`, tone: "text-emerald-400" },
          { icon: Activity, label: "Active Caseload", value: stats.active, tone: "text-blue-400" },
          { icon: Timer, label: "Avg Days to Resolve", value: stats.avgDays ?? "—", tone: "text-amber-400" },
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

      {/* Status mix */}
      <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <PieIcon className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Pipeline Status Mix</h2>
        </div>
        <div className="h-4 w-full rounded-full bg-muted/40 overflow-hidden flex">
          <div className="h-full bg-emerald-500/80" style={{ width: `${pct(stats.resolved, stats.total)}%` }} />
          <div className="h-full bg-blue-500/80" style={{ width: `${pct(stats.active, stats.total)}%` }} />
          <div className="h-full bg-rose-500/70" style={{ width: `${pct(stats.fresh, stats.total)}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-emerald-500/80" /> Resolved — {stats.resolved} ({pct(stats.resolved, stats.total)}%)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-blue-500/80" /> Active — {stats.active} ({pct(stats.active, stats.total)}%)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-rose-500/70" /> Awaiting assignment — {stats.fresh} ({pct(stats.fresh, stats.total)}%)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Domain table */}
        <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur overflow-hidden">
          <div className="px-5 py-4 border-b border-border/60">
            <h2 className="text-sm font-semibold text-foreground">Resolution by Domain</h2>
          </div>
          <div className="divide-y divide-border/50">
            {byDomain.map((d) => (
              <div key={d.name} className="px-5 py-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-foreground truncate">{d.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                    {d.resolved}/{d.total} solved · {d.rate}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                  <div className="h-full bg-emerald-500/70" style={{ width: `${d.rate}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* District matrix */}
        <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur overflow-hidden">
          <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">District Operations Matrix</h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter district…"
                className="rounded-md border border-input bg-background/50 pl-8 pr-3 py-1.5 text-xs w-36 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          {filteredDistricts.length === 0 ? (
            <div className="py-12 text-center">
              <Inbox className="size-6 mx-auto text-muted-foreground/60 mb-2" />
              <p className="text-xs text-muted-foreground">No districts match “{query}”.</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/60">
                  <th className="px-5 py-2.5 font-semibold">District</th>
                  <th className="px-2 py-2.5 font-semibold text-right">Total</th>
                  <th className="px-2 py-2.5 font-semibold text-right text-rose-400">New</th>
                  <th className="px-2 py-2.5 font-semibold text-right text-blue-400">Active</th>
                  <th className="px-2 py-2.5 font-semibold text-right text-emerald-400">Solved</th>
                  <th className="px-5 py-2.5 font-semibold text-right">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredDistricts.map((r) => (
                  <tr key={r.name} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-2.5 text-foreground">{r.name}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums font-semibold text-foreground">{r.total}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-rose-400">{r.fresh}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-blue-400">{r.active}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-emerald-400">{r.resolved}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-muted-foreground">{r.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <p className="mt-6 text-[11px] text-muted-foreground/70">
        Generated live from the state grievance ledger · counts change as nodes claim, progress, and resolve.
      </p>
    </div>
  )
}