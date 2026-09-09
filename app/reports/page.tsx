"use client"

import { useEffect, useState } from "react"
import { FileText, Download, BarChart3, Calendar, ShieldCheck, FileSpreadsheet, FileCheck2 } from "lucide-react"

const REPORTS = [
  {
    title: "Q3 Societal Impact Summary",
    type: "PDF",
    date: "Sept 1, 2026",
    size: "4.2 MB",
    category: "Statewide Analytics"
  },
  {
    title: "University Resolution Metrics",
    type: "Excel",
    date: "Aug 28, 2026",
    size: "1.8 MB",
    category: "Academic Performance"
  },
  {
    title: "CSR Funding & Pilot Deployments",
    type: "PDF",
    date: "Aug 15, 2026",
    size: "5.1 MB",
    category: "Industry Partnerships"
  },
  {
    title: "AI NLP Triage Accuracy Audit",
    type: "PDF",
    date: "Aug 02, 2026",
    size: "2.4 MB",
    category: "System Compliance"
  }
]

// NEW: shape of a ledger record that carries a university-uploaded solution
interface SolvedProblem {
  id: string
  sipId?: string
  title: string
  institution: string
  status: string
  solutionFileName?: string
  solutionNotes?: string
  solutionSubmittedAt?: string
}

export default function ReportsPage() {
  // NEW: live solutions pulled from the state ledger
  const [solutions, setSolutions] = useState<SolvedProblem[]>([])
  const [solutionsLoading, setSolutionsLoading] = useState(true)

  useEffect(() => {
    fetch("http://localhost:5000/problems")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const published = data
            .filter((p: SolvedProblem) => p.solutionSubmittedAt)
            .sort((a: SolvedProblem, b: SolvedProblem) =>
              (b.solutionSubmittedAt || "").localeCompare(a.solutionSubmittedAt || "")
            )
          setSolutions(published)
        }
        setSolutionsLoading(false)
      })
      .catch(() => setSolutionsLoading(false))
  }, [])

  return (
    <div className="flex-1 px-6 py-8 lg:px-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
            Official Records
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Analytics & Compliance Reports
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate, view, and export systemic impact reports and audit trails for state administration.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <div className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-sm">
          <BarChart3 className="size-5 text-primary mb-3" />
          <h3 className="font-medium text-foreground">Custom Dashboard</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Generate custom cross-district metrics.</p>
          <button className="text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded hover:bg-primary/90 transition">
            Open Builder
          </button>
        </div>
        
        <div className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-sm">
          <ShieldCheck className="size-5 text-emerald-500 mb-3" />
          <h3 className="font-medium text-foreground">Automated Audits</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">AI routing and priority bias reports.</p>
          <button className="text-xs font-medium bg-muted text-foreground px-3 py-1.5 rounded hover:bg-muted/80 transition border border-border/60">
            View Logs
          </button>
        </div>

        <div className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-sm">
          <Calendar className="size-5 text-blue-500 mb-3" />
          <h3 className="font-medium text-foreground">Scheduled Exports</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Manage automated weekly dispatch emails.</p>
          <button className="text-xs font-medium bg-muted text-foreground px-3 py-1.5 rounded hover:bg-muted/80 transition border border-border/60">
            Configure
          </button>
        </div>
      </div>

      {/* NEW: live solutions feed — every university upload lands here automatically */}
      <div className="rounded-xl border border-border/80 bg-card/60 shadow-sm overflow-hidden mb-8">
        <div className="p-5 border-b border-border/50 bg-muted/10 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Published Research Solutions</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live from State Ledger
          </span>
        </div>

        {solutionsLoading ? (
          <p className="p-5 text-sm text-muted-foreground">Syncing with state database...</p>
        ) : solutions.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            No research solutions published yet — university uploads will appear here automatically.
          </p>
        ) : (
          <div className="divide-y divide-border/40">
            {solutions.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    item.status === "Resolved"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-blue-500/10 text-blue-400"
                  }`}>
                    <FileCheck2 className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-foreground truncate">{item.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                      <span className="font-mono text-primary">{item.sipId || item.id}</span>
                      <span>•</span>
                      <span className="font-mono">
                        {new Date(item.solutionSubmittedAt || "").toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span>•</span>
                      <span className="bg-muted px-1.5 py-0.5 rounded truncate">{item.institution}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] font-mono text-emerald-400/90 hidden sm:block truncate max-w-[200px]">
                    📎 {item.solutionFileName || "proposal document"}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider ${
                    item.status === "Resolved"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border/80 bg-card/60 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border/50 bg-muted/10">
          <h2 className="text-sm font-semibold text-foreground">Generated Reports Archive</h2>
        </div>
        
        <div className="divide-y divide-border/40">
          {REPORTS.map((report, i) => (
            <div key={i} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${report.type === 'PDF' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  {report.type === 'PDF' ? <FileText className="size-5" /> : <FileSpreadsheet className="size-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">{report.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                    <span className="font-mono">{report.date}</span>
                    <span>•</span>
                    <span className="bg-muted px-1.5 py-0.5 rounded">{report.category}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-muted-foreground hidden sm:block">{report.size}</span>
                <button className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors">
                  <Download className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}