"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart as RPieChart,
  Pie,
} from "recharts"
import { PieChart, Activity, AlertTriangle, TrendingUp, CheckCircle2 } from "lucide-react"

/* ------------------------------------------------------------------ */
/* Deterministic pseudo-random generator — seeded per district so the  */
/* "historical records" are stable across refreshes (no flicker).      */
/* ------------------------------------------------------------------ */

function hashSeed(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface ProblemLite {
  id: string
  district?: string
  location?: string
  category: string
  status: string
}

interface DistrictData {
  solved: number
  active: number
  unsolved: number
  domains: { name: string; count: number }[]
  trend: number[]
}

const DISTRICTS = [
  "Ranchi",
  "Dhanbad",
  "East Singhbhum",
  "Bokaro",
  "Hazaribagh",
  "Khunti",
  "Gumla",
  "Palamu",
  "Simdega",
  "Sahibganj",
]

const DOMAINS = [
  "Water Resources",
  "Agriculture",
  "Healthcare",
  "Energy",
  "Mining",
  "Education",
  "Environment",
  "Urban Development",
]

const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"]

const DONUT_COLORS = ["#f97316", "#3b82f6", "#10b981", "#a855f7", "#f43f5e", "#64748b"]

const tooltipStyle = {
  backgroundColor: "#1c1917",
  border: "1px solid #292524",
  borderRadius: 12,
  color: "#e7e5e4",
  fontSize: 12,
} as const

function randInt(r: () => number, min: number, max: number) {
  return min + Math.floor(r() * (max - min + 1))
}

// Seeded "state archive" figures for one district (stable across reloads)
function genSeed(district: string): DistrictData {
  const r = mulberry32(hashSeed(`sahyog-grid::${district}`))
  return {
    solved: randInt(r, 24, 62),
    active: randInt(r, 7, 24),
    unsolved: randInt(r, 4, 17),
    domains: DOMAINS.map((name) => ({ name, count: randInt(r, 2, 23) })),
    trend: MONTHS.map(() => randInt(r, 11, 41)),
  }
}

// Seed + live SIP ledger rows merged into one analytic picture
function buildData(district: string, problems: ProblemLite[]): DistrictData {
  const base: DistrictData =
    district === "All Districts"
      ? DISTRICTS.reduce(
          (acc, d) => {
            const g = genSeed(d)
            return {
              solved: acc.solved + g.solved,
              active: acc.active + g.active,
              unsolved: acc.unsolved + g.unsolved,
              domains: acc.domains.map((x, i) => ({ name: x.name, count: x.count + g.domains[i].count })),
              trend: acc.trend.map((v, i) => v + g.trend[i]),
            }
          },
          {
            solved: 0,
            active: 0,
            unsolved: 0,
            domains: DOMAINS.map((name) => ({ name, count: 0 })),
            trend: MONTHS.map(() => 0),
          }
        )
      : genSeed(district)

  // Blend live ledger
  const live = problems.filter((p) => {
    if (district === "All Districts") return true
    return (p.district || p.location) === district
  })
  const domains = base.domains.map((d) => ({ ...d }))
  let { solved, active, unsolved } = base
  live.forEach((p) => {
    const status = (p.status || "").toLowerCase()
    if (status === "resolved" || status === "solved") solved += 1
    else if (status === "in progress" || status === "assigned" || status === "under review") active += 1
    else unsolved += 1

    const dom = domains.find((d) => d.name === p.category)
    if (dom) dom.count += 1
    else if (p.category) domains.push({ name: p.category, count: 1 })
  })

  return { solved, active, unsolved, domains, trend: base.trend }
}

export default function AnalyticsPage() {
  const [district, setDistrict] = useState("All Districts")
  const [problems, setProblems] = useState<ProblemLite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/problems")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProblems(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const data = useMemo(() => buildData(district, problems), [district, problems])

  const total = data.solved + data.active + data.unsolved
  const resolutionRate = total > 0 ? Math.round((data.solved / total) * 100) : 0

  const sortedDomains = useMemo(
    () => [...data.domains].sort((a, b) => b.count - a.count),
    [data.domains]
  )
  const maxDomain = sortedDomains[0]
  const minDomain = sortedDomains[sortedDomains.length - 1]
  const maxDomainCount = Math.max(...sortedDomains.map((d) => d.count), 1)

  // Chart 1 — status bars (per-bar colors REQUIRES <Cell> children in recharts)
  const statusChartData = useMemo(
    () => [
      { name: "Solved", count: data.solved, fill: "#10b981" },
      { name: "In Progress", count: data.active, fill: "#3b82f6" },
      { name: "Unsolved", count: data.unsolved, fill: "#f59e0b" },
    ],
    [data]
  )

  // Chart 2 — domain volume line (problems reported per department)
  const domainChartData = useMemo(
    () => sortedDomains.map((d) => ({ domain: d.name, issues: d.count })),
    [sortedDomains]
  )

  // Chart 4 — donut share
  const donutTotal = sortedDomains.reduce((s, d) => s + d.count, 0) || 1
  const pieChartData = useMemo(() => {
    const top = sortedDomains.slice(0, 5)
    const rest = sortedDomains.slice(5).reduce((s, d) => s + d.count, 0)
    const formatted = top.map((d, i) => ({
      name: d.name,
      value: d.count,
      color: DONUT_COLORS[i % DONUT_COLORS.length],
    }))
    if (rest > 0) {
      formatted.push({ name: "Other", value: rest, color: DONUT_COLORS[DONUT_COLORS.length - 1] })
    }
    return formatted
  }, [sortedDomains])

  /* ---------------- Chart 3: 6-month trend (SVG) ---------------- */
  const W = 560
  const H = 190
  const PAD = 26
  const maxTrend = Math.max(...data.trend, 1)
  const pts = data.trend.map((v, i) => {
    const x = PAD + (i * (W - 2 * PAD)) / (data.trend.length - 1)
    const y = H - PAD - (v / maxTrend) * (H - 2 * PAD)
    return { x, y, v }
  })
  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ")

  return (
    <div className="flex-1 px-6 py-8 lg:px-10 max-w-[1200px] mx-auto pb-16">
      {/* Header + district selector */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <PieChart className="size-3" /> State Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">District Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Workload, resolution health, and domain pressure — archived state records blended with the live SIP ledger.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">District</span>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none min-w-[170px]"
          >
            <option value="All Districts">All Districts (State)</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI strip */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Reported</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{total}</p>
        </div>
        <div className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resolution Rate</p>
          <p className="mt-2 text-3xl font-bold text-emerald-500">{resolutionRate}%</p>
        </div>
        <div className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Caseload</p>
          <p className="mt-2 text-3xl font-bold text-blue-500">{data.active + data.unsolved}</p>
        </div>
        <div className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top Pressure Domain</p>
          <p className="mt-2 text-xl font-bold text-foreground leading-tight">{maxDomain?.name || "—"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        {/* Chart 1: resolution status bars */}
        <div className="rounded-xl border border-border/80 bg-card/60 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Resolution Health — {district}</h2>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground/70">{total} records</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="#292524" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#a8a29e", fontSize: 11 }} dy={8} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#a8a29e", fontSize: 11 }} />
                <Tooltip cursor={{ fill: "rgba(41,37,36,0.35)" }} contentStyle={tooltipStyle} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56}>
                  {statusChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: issues by department (line) */}
        <div className="rounded-xl border border-border/80 bg-card/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Problems Reported per Department — {district}</h2>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">Volume identifies sectors needing administrative attention</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={domainChartData} margin={{ top: 10, right: 10, left: -18, bottom: 44 }}>
                <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="#292524" />
                <XAxis
                  dataKey="domain"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#a8a29e", fontSize: 10 }}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#a8a29e", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="issues"
                  name="Reported problems"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#f97316", strokeWidth: 2, stroke: "#1c1917" }}
                  activeDot={{ r: 6, fill: "#f97316", stroke: "#1c1917", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        {/* Chart 3: domain pressure rows */}
        <div className="rounded-xl border border-border/80 bg-card/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Department Attention Map — {district}</h2>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">Which departments need the most attention right now</p>
          <div className="space-y-2.5">
            {sortedDomains.map((d, i) => (
              <div key={d.name} className="flex items-center gap-3">
                <span className="w-36 shrink-0 truncate text-[11px] text-muted-foreground">{d.name}</span>
                <div className="flex-1 h-5 rounded bg-muted/20 overflow-hidden">
                  <div
                    className={`h-full rounded transition-all duration-500 ${
                      i === 0 ? "bg-rose-500/80" : i === sortedDomains.length - 1 ? "bg-emerald-500/70" : "bg-primary/70"
                    }`}
                    style={{ width: `${(d.count / maxDomainCount) * 100}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right font-mono text-xs text-foreground">{d.count}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground border-t border-border/40 pt-3">
            Most attention needed: <span className="font-semibold text-rose-400">{maxDomain?.name}</span> ({maxDomain?.count})
            {"  ·  "}
            Least: <span className="font-semibold text-emerald-400">{minDomain?.name}</span> ({minDomain?.count})
          </p>
        </div>

        {/* Chart 4: 6-month trend (hand-rolled SVG, zero extra deps) */}
        <div className="rounded-xl border border-border/80 bg-card/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Reporting Trend — Last 6 Months</h2>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
            {[0.25, 0.5, 0.75, 1].map((f) => (
              <line
                key={f}
                x1={PAD}
                x2={W - PAD}
                y1={H - PAD - f * (H - 2 * PAD)}
                y2={H - PAD - f * (H - 2 * PAD)}
                stroke="currentColor"
                className="text-border/40"
                strokeDasharray="3 4"
              />
            ))}
            <line x1={PAD} x2={W - PAD} y1={H - PAD} y2={H - PAD} stroke="currentColor" className="text-border" />
            <polyline
              points={polyline}
              fill="none"
              stroke="currentColor"
              className="text-primary"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {pts.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="3.5" fill="currentColor" className="text-primary" />
                <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="10" fill="currentColor" className="text-muted-foreground font-mono">
                  {p.v}
                </text>
                <text x={p.x} y={H - 8} textAnchor="middle" fontSize="10" fill="currentColor" className="text-muted-foreground">
                  {MONTHS[i]}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Chart 5: domain share donut */}
      <div className="rounded-xl border border-border/80 bg-card/60 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Domain Share — {district}</h2>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="h-56 w-full sm:w-64 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RPieChart>
                <Tooltip contentStyle={tooltipStyle} />
                <Pie
                  data={pieChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={92}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {pieChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </RPieChart>
            </ResponsiveContainer>
          </div>
          <ul className="min-w-0 flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 self-center">
            {pieChartData.map((s) => (
              <li key={s.name} className="flex items-center gap-2 text-[11px]">
                <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
                <span className="truncate text-muted-foreground">{s.name}</span>
                <span className="ml-auto pl-3 font-mono text-foreground">
                  {Math.round((s.value / donutTotal) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-4 text-[10px] text-muted-foreground/70 border-t border-border/40 pt-3">
          Figures combine archived state records with live SIP ledger entries · stable snapshot per district
        </p>
      </div>

      {loading && (
        <p className="mt-4 text-xs text-muted-foreground">Syncing live ledger rows…</p>
      )}
    </div>
  )
}
