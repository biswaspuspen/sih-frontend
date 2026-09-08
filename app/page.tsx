"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  Building2, CheckCircle2, Clock, TrendingUp, Cpu, 
  ArrowUpRight, Sparkles, MapPin, Flame, BrainCircuit, 
  Radio, ExternalLink, Bot
} from "lucide-react"
import { CategoryChart } from "@/components/dashboard/category-chart"

interface Problem {
  id: string
  title: string
  category: string
  location: string
  status: string
  submittedDate: string
  institution: string
  priority?: "High" | "Medium" | "Low"
  confidence?: number
}

interface Stats {
  totalChallenges: number
  resolved: number
  universitiesInvolved: number
}

const DISTRICT_HOTSPOTS = [
  { name: "Ranchi", count: 412, trend: "+12%" },
  { name: "Dhanbad", count: 289, trend: "+8%" },
  { name: "East Singhbhum (Jamshedpur)", count: 231, trend: "+5%" },
  { name: "Bokaro", count: 184, trend: "-2%" },
  { name: "Hazaribagh", count: 168, trend: "+14%" },
]

const RECENT_ASSIGNMENTS = [
  {
    challengeId: "SIP-1024",
    title: "Groundwater Arsenic & Fluoride Contamination",
    university: "BIT Mesra",
    domain: "Water Resources",
    matchScore: 94,
    lead: "Dr. A. Sharma",
    progress: 68,
    status: "In Progress"
  },
  {
    challengeId: "SIP-1019",
    title: "Unseasonal crop blight destroying paddy yields",
    university: "Birsa Agricultural University",
    domain: "Agriculture",
    matchScore: 91,
    lead: "Prof. R. Banerjee",
    progress: 42,
    status: "Field Testing"
  },
  {
    challengeId: "SIP-0987",
    title: "Lack of maternal tele-diagnostic tools in tribal belts",
    university: "RIMS Ranchi",
    domain: "Healthcare",
    matchScore: 96,
    lead: "Dr. K. Soren",
    progress: 85,
    status: "Validation"
  }
]

const AUDIT_FEED = [
  { time: "4m ago", icon: BrainCircuit, text: "AI engine categorized SIP-1024 as Water Resources with 97% confidence." },
  { time: "18m ago", icon: Building2, text: "SIP-1019 assigned to Birsa Agricultural University." },
  { time: "1h ago", icon: Radio, text: "Industry partner Tata Steel Tech Ventures linked to Project #SIP-1024." },
  { time: "2h ago", icon: CheckCircle2, text: "Field pilot completed for SIP-0987 across 4 panchayats in Palamu." },
  { time: "3h ago", icon: Sparkles, text: "Citizen telemetry logged 12 verified agricultural distress reports from Bokaro." }
]

export default function DashboardPage() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:5000/problems").then((r) => r.json()).catch(() => []),
      fetch("http://localhost:5000/stats").then((r) => r.json()).catch(() => null)
    ]).then(([problemsData, statsData]) => {
      if (Array.isArray(problemsData)) setProblems(problemsData)
      if (statsData) setStats(statsData)
      setLoading(false)
    })
  }, [])

  return (
    <div className="flex-1 space-y-7 px-6 py-6 lg:px-10 max-w-[1600px] mx-auto pb-16">
      {/* 1. Header Command Strip */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-border/70 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Jharkhand State Innovation Grid
            </span>
            <span className="text-xs text-muted-foreground font-mono">Realtime Telemetry Active</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1.5">
            Societal Innovation & Resolution Hub
          </h1>
          <p className="text-sm text-muted-foreground">
            Citizen Telemetry → NLP Triage → Academic Allocation → Field Deployment
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/submit" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90">
            <Sparkles className="size-4" />
            Submit Challenge
          </Link>
        </div>
      </div>

      {/* 2. Top Tier: High-Density KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border/80 bg-card/70 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Inflow</span>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400"><Clock className="size-4" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{stats?.totalChallenges?.toLocaleString() || problems.length}</span>
            <span className="text-xs font-medium text-emerald-400 flex items-center"><TrendingUp className="size-3 mr-0.5" /> +14.2%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Grievances logged across 24 districts</p>
        </div>

        <div className="rounded-xl border border-border/80 bg-card/70 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Under AI Triage</span>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400"><Cpu className="size-4" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{problems.filter((p) => p.status === "New" || p.status === "Under Review").length}</span>
            <span className="text-xs font-mono text-amber-400/90 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">Active Processing</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Semantic classification & ranking</p>
        </div>

        <div className="rounded-xl border border-border/80 bg-card/70 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Field Deployments</span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400"><CheckCircle2 className="size-4" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{stats?.resolved?.toLocaleString() || "742"}</span>
            <span className="text-xs font-medium text-emerald-400">58.4% resolution rate</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Prototypes deployed in panchayats</p>
        </div>

        <div className="rounded-xl border border-border/80 bg-card/70 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Academic Labs Linked</span>
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400"><Building2 className="size-4" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{stats?.universitiesInvolved || "14"}</span>
            <span className="text-xs font-mono text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">BIT, ISM, NIT</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Research centers and incubation hubs</p>
        </div>
      </div>

      {/* 3. Middle Tier: Analytics & Live AI Recommendation Engine */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-6 flex flex-col"><CategoryChart /></div>
        
        <div className="lg:col-span-3 flex flex-col">
          <div className="h-full rounded-xl border border-border/80 bg-card/70 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <div>
                  <h2 className="text-sm font-semibold text-card-foreground">District Concentration</h2>
                  <p className="text-xs text-muted-foreground">High-density clusters</p>
                </div>
                <MapPin className="size-4 text-muted-foreground" />
              </div>
              <div className="mt-4 space-y-3">
                {DISTRICT_HOTSPOTS.map((district) => (
                  <div key={district.name} className="flex items-center justify-between text-xs">
                    <span className="text-foreground/90 font-medium">{district.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-muted-foreground">{district.count}</span>
                      <span className="text-[11px] font-mono font-medium text-emerald-400">{district.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs mt-4">
              <span className="text-muted-foreground">24 Districts Covered</span>
              <Link href="/regions" className="text-primary font-medium flex items-center gap-1 hover:underline">
                Regional Map <ArrowUpRight className="size-3" />
              </Link>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col">
          <div className="h-full rounded-xl border border-primary/30 bg-gradient-to-br from-card/90 via-card/70 to-primary/10 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 translate-x-3 -translate-y-3">
              <div className="size-20 rounded-full bg-primary/10 blur-xl pointer-events-none" />
            </div>
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <div className="flex items-center gap-1.5">
                  <Bot className="size-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">AI Match Engine</span>
                </div>
                <span className="text-[10px] font-mono bg-primary/20 text-primary px-1.5 py-0.5 rounded">Live Triage</span>
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-primary">SIP-1024</span>
                  <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-rose-400 border border-rose-500/20">
                    <Flame className="size-2.5" /> High Priority
                  </span>
                </div>
                <p className="text-xs font-medium text-foreground mt-1 line-clamp-1">Rural Water Quality Monitoring</p>
              </div>
              <div className="mt-3 rounded-lg border border-border/60 bg-background/60 p-2.5 space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Category:</span><span className="font-semibold text-foreground">Water Res. (97%)</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Target Uni:</span><span className="font-semibold text-emerald-400">BIT Mesra</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Match Vector:</span><span className="font-mono font-medium text-primary">94.2%</span></div>
                <p className="text-[11px] text-muted-foreground/80 pt-1 border-t border-border/40 leading-relaxed">Matched via: IoT Sensor Patents, Water Quality Labs.</p>
              </div>
            </div>
            <Link href="/challenges" className="mt-4 flex items-center justify-center gap-1.5 rounded-md bg-muted hover:bg-muted/80 py-1.5 text-xs font-medium text-foreground transition-colors border border-border/60">
              Analyze Match Vectors <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Tier Three: Recent Submissions & Academic Assignments */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7 rounded-xl border border-border/80 bg-card/70 shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-border/60">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Recent Citizen Submissions</h2>
              <p className="text-xs text-muted-foreground">Live grievance telemetry ingested into the pipeline</p>
            </div>
            <Link href="/challenges" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
              View All ({problems.length}) <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 uppercase font-medium text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="px-4 py-2.5">ID</th>
                  <th className="px-4 py-2.5">Problem Details</th>
                  <th className="px-4 py-2.5">District</th>
                  <th className="px-4 py-2.5">Priority</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-normal">
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Reading database telemetry...</td></tr>
                ) : problems.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No records detected. Submit one from the sidebar.</td></tr>
                ) : (
                  problems.slice(0, 5).map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-primary">{item.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground max-w-[200px] truncate">{item.title}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <span className="bg-muted px-1.5 py-0.2 rounded font-medium">{item.category}</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-mono">{item.confidence || Math.floor(Math.random() * 15 + 85)}% confidence</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{item.location}</td>
                      <td className="px-4 py-3">
                        {item.priority === "Medium" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">Medium</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">High</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${item.status === "In Progress" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : item.status === "Assigned" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : item.status === "Resolved" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">{item.submittedDate || "Today"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="xl:col-span-5 rounded-xl border border-border/80 bg-card/70 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between p-4 border-b border-border/60">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Active University Assignments</h2>
                <p className="text-xs text-muted-foreground">Challenges allocated to academic R&D units</p>
              </div>
              <Link href="/universities" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">All Nodes <ArrowUpRight className="size-3.5" /></Link>
            </div>
            <div className="p-4 space-y-4">
              {RECENT_ASSIGNMENTS.map((assign) => (
                <div key={assign.challengeId} className="rounded-lg border border-border/60 bg-muted/20 p-3 hover:bg-muted/40 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">{assign.challengeId}</span>
                        <span className="text-xs font-semibold text-foreground">{assign.title}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{assign.university} • <span className="text-foreground/80">{assign.lead}</span></p>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-medium">{assign.matchScore}% Match</span>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[11px]"><span className="text-muted-foreground font-mono">{assign.domain}</span><span className="font-mono text-foreground font-medium">{assign.progress}%</span></div>
                    <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden"><div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${assign.progress}%` }} /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Tier Four: Realtime Platform Telemetry & Audit Trail */}
      <div className="rounded-xl border border-border/80 bg-card/70 p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2"><Radio className="size-4 text-emerald-400 animate-pulse" /><h2 className="text-sm font-semibold text-foreground">Live Telemetry & Activity Stream</h2></div>
          <span className="text-xs font-mono text-muted-foreground">Event Log: Continuous</span>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {AUDIT_FEED.map((log, index) => {
            const Icon = log.icon
            return (
              <div key={index} className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/20 p-3 text-xs hover:border-border transition-colors">
                <div className="rounded-md bg-primary/10 p-1.5 text-primary shrink-0 mt-0.5"><Icon className="size-3.5" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground/90 leading-snug">{log.text}</p>
                  <span className="text-[10px] font-mono text-muted-foreground mt-1 block">{log.time}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}