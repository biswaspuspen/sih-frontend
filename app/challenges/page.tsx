"use client"

import { Fragment, useEffect, useState } from "react"
import { Search, Filter, AlertCircle, ArrowUpDown, ChevronLeft, ChevronRight, UploadCloud, X, FileText, CheckCircle2, Users, ChevronDown, ChevronUp, Phone, Mail, Globe, Briefcase, History, BrainCircuit, Sparkles, TriangleAlert, Gauge } from "lucide-react"

interface TeamMember {
  id: string
  name: string
  role: string
  institution?: string
  department?: string
  year?: string
  phone?: string
  email?: string
  linkedin?: string
  experience?: string
  pastProjects?: string[]
}

interface AiReport {
  summary: string
  feasibilityScore: number
  risks: string[]
  recommendation: string
  model: string
  generatedAt: string
  aiRan: boolean
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
  createdAt?: string
  institution: string
  priority?: string
  confidence?: number
  solutionFileName?: string
  solutionNotes?: string
  solutionSubmittedAt?: string
  submittedBy?: string
  team?: TeamMember[]
  assignedAt?: string
  aiReport?: AiReport
}

// normalizer — ledger compares institutions case/space-insensitively
const norm = (v?: string) => (v || "").trim().toLowerCase()
const UNASSIGNED = "unassigned"

// tolerant date renderer — ledger rows use createdAt; older mock rows used submittedDate
function formatLoggedDate(p: Problem) {
  const raw = p.createdAt || p.submittedDate
  if (!raw) return "—"
  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

const recTone: Record<string, string> = {
  "Strongly Recommended": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Conditional Pilot": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Needs Revision": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "Not Feasible": "bg-rose-500/10 text-rose-400 border-rose-500/20",
}

function scoreTone(score: number) {
  if (score >= 75) return "text-emerald-400"
  if (score >= 50) return "text-amber-400"
  return "text-rose-400"
}

export default function ChallengesPage() {
  const [role, setRole] = useState("government")
  const [userInstitution, setUserInstitution] = useState("BIT Mesra") // fallback for local testing
  const [mounted, setMounted] = useState(false)
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [categoryFilter, setCategoryFilter] = useState("All")

  // Upload modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null)
  const [solutionFile, setSolutionFile] = useState<File | null>(null)
  const [solutionNotes, setSolutionNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Team-formation (claim) modal state
  const [claimTarget, setClaimTarget] = useState<Problem | null>(null)
  const [teamOptions, setTeamOptions] = useState<TeamMember[]>([])
  const [teamLoading, setTeamLoading] = useState(false)
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])
  const [claiming, setClaiming] = useState(false)
  const [claimError, setClaimError] = useState("")
  // Expanded profile panels — Set of member ids, fully independent of checkbox selection
  const [expandedMemberIds, setExpandedMemberIds] = useState<Set<string>>(new Set())

  // AI-assessment panel expansion — Set of problem ids, independent of anything else
  const [aiExpandedIds, setAiExpandedIds] = useState<Set<string>>(new Set())

  // 1. Get User Role + Institution
  useEffect(() => {
    setMounted(true)
    const savedRole = localStorage.getItem("userRole")
    if (savedRole) setRole(savedRole)

    const savedInstitution = localStorage.getItem("userInstitution")
    if (savedInstitution) setUserInstitution(savedInstitution)
  }, [])

  // 2. Fetch Data from db.json
  useEffect(() => {
    fetch("/api/problems")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProblems(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to fetch challenges", err)
        setLoading(false)
      })
  }, [])

  // Prevent UI flickering
  if (!mounted) return null

  // 3. Combined Filter Logic (Search + Dropdowns + RBAC)
  const filteredProblems = problems.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sipId || p.id).toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "All" || p.status === statusFilter
    const matchesCategory = categoryFilter === "All" || p.category === categoryFilter

    // universities see the open claim pool + their own claims
    const matchesRole =
      role === "university"
        ? norm(p.institution) === UNASSIGNED || norm(p.institution) === norm(userInstitution)
        : true

    return matchesSearch && matchesStatus && matchesCategory && matchesRole
  })

  // metrics are measured on the university's own claims only — the open pool mustn't inflate them
  const ownClaims = problems.filter((p) => norm(p.institution) === norm(userInstitution))

  const columnCount = 7

  function toggleAiExpand(id: string) {
    setAiExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // 4. Upload modal handlers
  function handleOpenModal(id: string) {
    const problem = problems.find((p) => p.id === id || p.sipId === id) || null
    setSelectedProblem(problem)
    setSolutionFile(null)
    setSolutionNotes("")
    setModalOpen(true)
  }

  function handleCloseModal() {
    if (submitting) return
    setModalOpen(false)
    setSelectedProblem(null)
  }

  async function handleSubmitSolution() {
    if (!selectedProblem) return
    setSubmitting(true)

    try {
      const res = await fetch(`/api/problems/${selectedProblem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "In Progress",
          solutionFileName: solutionFile?.name || null,
          solutionNotes,
          solutionSubmittedAt: new Date().toISOString(),
        }),
      })

      if (!res.ok) throw new Error(`Request failed: ${res.status}`)

      const updated = await res.json()
      setProblems((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))
      setModalOpen(false)
      setSelectedProblem(null)

      // Fire-and-forget: Gemini writes an independent assessment onto the record.
      // The demo never waits on the AI; if it fails, the panel shows "review pending".
      void fetch("/api/ai/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: updated.id,
          solutionNotes,
          solutionFileName: solutionFile?.name || "",
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data?.aiRan && data?.aiReport) {
            setProblems((prev) =>
              prev.map((p) => (p.id === updated.id ? { ...p, aiReport: data.aiReport } : p))
            )
          }
        })
        .catch(() => {})
    } catch (err) {
      console.error("Failed to submit solution", err)
      alert("Couldn't submit the solution — check that the app server is running.")
    } finally {
      setSubmitting(false)
    }
  }

  // Government force-assigns an unclaimed challenge to a university R&D node (manual override)
  async function handleAssign(id: string, institutionName: string) {
    try {
      const res = await fetch(`/api/problems/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ institution: institutionName, status: "Assigned", assignedAt: new Date().toISOString() }),
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const updated = await res.json()
      setProblems((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))
    } catch (err) {
      console.error("Assign failed", err)
      alert("Couldn't assign — check that the app server is running.")
    }
  }

  // Government marks a challenge resolved after the university uploads a solution
  async function handleResolve(id: string) {
    try {
      const res = await fetch(`/api/problems/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Resolved" }),
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const updated = await res.json()
      setProblems((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))
    } catch (err) {
      console.error("Resolve failed", err)
      alert("Couldn't mark resolved — check the app server.")
    }
  }

  // Open the team-formation modal and load this institution's roster
  function handleOpenClaim(problem: Problem) {
    setClaimTarget(problem)
    setSelectedTeamIds([])
    setClaimError("")
    setTeamOptions([])
    setTeamLoading(true)
    setExpandedMemberIds(new Set()) // default: all profiles collapsed
    fetch(`/api/teamMembers?institution=${encodeURIComponent(userInstitution)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTeamOptions(data)
        setTeamLoading(false)
      })
      .catch((err) => {
        console.error("Failed to fetch team roster", err)
        setTeamLoading(false)
      })
  }

  function toggleTeamMember(id: string) {
    setSelectedTeamIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  // Expand/collapse one member's detail panel — touches ONLY that id, never the checkbox state
  function toggleMemberExpand(id: string) {
    setExpandedMemberIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleCloseClaim() {
    if (claiming) return
    setClaimTarget(null)
  }

  // Confirm claim — re-check the row is still unclaimed before writing,
  // so a second university can never silently overwrite someone's claim
  async function handleConfirmClaim() {
    if (!claimTarget || selectedTeamIds.length === 0) return
    setClaiming(true)
    setClaimError("")

    try {
      const check = await fetch(`/api/problems/${claimTarget.id}`)
      if (!check.ok) throw new Error(`Request failed: ${check.status}`)
      const latest: Problem = await check.json()

      if (norm(latest.institution) !== UNASSIGNED) {
        setClaimError(`Just claimed by ${latest.institution} — pool refreshed. Pick another challenge.`)
        const refresh = await fetch("/api/problems")
        const data = await refresh.json()
        if (Array.isArray(data)) setProblems(data)
        return
      }

      const selectedMembers = teamOptions
        .filter((m) => selectedTeamIds.includes(m.id))
        .map(({ id, name, role }) => ({ id, name, role }))

      const res = await fetch(`/api/problems/${claimTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institution: userInstitution,
          status: "Assigned",
          team: selectedMembers,
          assignedAt: new Date().toISOString(),
        }),
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)

      const updated = await res.json()
      setProblems((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))
      setClaimTarget(null)
    } catch (err) {
      console.error("Claim failed", err)
      setClaimError("Couldn't claim — check that the app server is running.")
    } finally {
      setClaiming(false)
    }
  }

  return (
    <div className="flex-1 px-6 py-8 lg:px-10 max-w-[1600px] mx-auto">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {role === "university" ? "Open Challenge Pool" : "Grievance Master Ledger"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {role === "university"
              ? `Claim unclaimed challenges for ${userInstitution}, form your R&D team, and upload research solutions.`
              : "View, filter, and track all societal challenges moving through the state pipeline."}
          </p>
        </div>
      </div>

      {/* University Metrics Strip — counts own claims only */}
      {role === "university" && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Claimed</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{ownClaims.length}</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active R&D</p>
            <p className="mt-2 text-3xl font-bold text-blue-500">
              {ownClaims.filter((p) => p.status === "In Progress" || p.status === "Assigned").length}
            </p>
          </div>
          <div className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resolved</p>
            <p className="mt-2 text-3xl font-bold text-emerald-500">
              {ownClaims.filter((p) => p.status === "Resolved").length}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border/80 bg-card/60 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar: Search & Filters */}
        <div className="p-4 border-b border-border/60 bg-muted/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by SIP ID or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-input bg-background/50 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex w-full sm:w-auto items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none min-w-[140px]"
              >
                <option value="All">All Domains</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Water Resources">Water Resources</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Energy">Energy</option>
                <option value="Mining">Mining</option>
                <option value="Education">Education</option>
                <option value="Environment">Environment</option>
                <option value="Urban Development">Urban Development</option>
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none min-w-[130px]"
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Under Review">Under Review</option>
              <option value="AI Triaged">AI Triaged</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 uppercase font-medium text-muted-foreground border-b border-border/60 text-xs">
              <tr>
                <th className="px-5 py-3 cursor-pointer hover:text-foreground">
                  <span className="flex items-center gap-1">Challenge ID <ArrowUpDown className="size-3" /></span>
                </th>
                <th className="px-5 py-3">Description & Domain</th>
                <th className="px-5 py-3">District</th>
                <th className="px-5 py-3">Assigned Academic Node</th>
                <th className="px-5 py-3">Stage</th>
                <th className="px-5 py-3 text-right">Date Logged</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                <tr>
                  <td colSpan={columnCount} className="px-5 py-12 text-center text-muted-foreground">
                    Syncing ledger with state database...
                  </td>
                </tr>
              ) : filteredProblems.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <AlertCircle className="size-8 mb-3 opacity-50" />
                      <p>No challenges match your current filters.</p>
                      <button
                        onClick={() => {
                          setSearchTerm("")
                          setStatusFilter("All")
                          setCategoryFilter("All")
                        }}
                        className="mt-2 text-primary hover:underline text-xs"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProblems.map((item) => {
                  const inst = norm(item.institution)
                  const unclaimed = inst === UNASSIGNED
                  const mine = inst === norm(userInstitution)
                  const aiOpen = aiExpandedIds.has(item.id)
                  const hasSolution = Boolean(item.solutionFileName)
                  return (
                    <Fragment key={item.id}>
                      <tr className="hover:bg-muted/30 transition-colors group">
                        <td className="px-5 py-4 font-mono font-medium text-primary">{item.sipId || item.id}</td>
                        <td className="px-5 py-4">
                          <div className="font-medium text-foreground max-w-sm truncate">{item.title}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-medium text-muted-foreground">
                              {item.category}
                            </span>
                            {item.priority === "High" && (
                              <span className="text-[10px] font-semibold text-rose-400">High Priority</span>
                            )}
                            {item.solutionFileName && (
                              <span className="text-[10px] font-medium text-emerald-400/90">
                                📎 {item.solutionFileName}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground text-xs">{item.district || item.location || "—"}</td>
                        <td className="px-5 py-4 text-xs font-medium text-foreground/90">
                          {item.institution}
                          {item.team && item.team.length > 0 && (
                            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Users className="size-3" /> {item.team.length}-member team
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              item.status === "In Progress"
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : item.status === "Assigned"
                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                : item.status === "Resolved"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-mono text-muted-foreground text-xs">
                          {formatLoggedDate(item)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* 🧠 AI assessment toggle — appears on any row that has an uploaded solution */}
                            {hasSolution && (
                              <button
                                onClick={() => toggleAiExpand(item.id)}
                                aria-label={aiOpen ? "Hide AI assessment" : "Show AI assessment"}
                                title="AI Solution Assessment"
                                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                                  aiOpen
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-primary/10 text-primary hover:bg-primary/20"
                                }`}
                              >
                                <BrainCircuit className="size-3.5" />
                                AI
                              </button>
                            )}
                            {role === "university" ? (
                              unclaimed ? (
                                <button
                                  onClick={() => handleOpenClaim(item)}
                                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                                >
                                  <Users className="size-3.5" />
                                  Take This Challenge
                                </button>
                              ) : mine ? (
                                <button
                                  onClick={() => handleOpenModal(item.id)}
                                  className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                                >
                                  <UploadCloud className="size-3.5" />
                                  {item.solutionFileName ? "Update" : "Upload"}
                                </button>
                              ) : (
                                <span className="text-xs text-muted-foreground/50">—</span>
                              )
                            ) : unclaimed ? (
                              <select
                                defaultValue=""
                                onChange={(e) => {
                                  if (e.target.value) handleAssign(item.id, e.target.value)
                                }}
                                className="rounded-md border border-input bg-background/50 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                              >
                                <option value="">Force Assign…</option>
                                <option value="BIT Mesra">BIT Mesra</option>
                                <option value="IIT (ISM) Dhanbad">IIT (ISM) Dhanbad</option>
                                <option value="NIT Jamshedpur">NIT Jamshedpur</option>
                                <option value="Birsa Agricultural University">Birsa Agricultural University</option>
                                <option value="RIMS Ranchi">RIMS Ranchi</option>
                              </select>
                            ) : item.status === "In Progress" && item.solutionFileName ? (
                              <button
                                onClick={() => handleResolve(item.id)}
                                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                              >
                                <CheckCircle2 className="size-3.5" />
                                Mark Resolved
                              </button>
                            ) : (
                              <span className="text-xs text-muted-foreground/50">—</span>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* 🧠 AI Solution Assessment panel */}
                      {aiOpen && hasSolution && (
                        <tr className="bg-background/30">
                          <td colSpan={columnCount} className="px-5 py-4">
                            <div className="rounded-lg border border-primary/25 bg-primary/5 p-4 animate-fadeIn">
                              {item.aiReport?.aiRan ? (
                                <>
                                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2">
                                      <BrainCircuit className="size-4 text-primary" />
                                      <h4 className="text-sm font-semibold text-foreground">AI Solution Assessment</h4>
                                      <span
                                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                                          recTone[item.aiReport.recommendation] ??
                                          "bg-muted/40 text-muted-foreground border-border/60"
                                        }`}
                                      >
                                        {item.aiReport.recommendation}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">
                                      {item.aiReport.model} · {new Date(item.aiReport.generatedAt).toLocaleString()}
                                    </span>
                                  </div>

                                  <div className="mb-3">
                                    <div className="flex items-center justify-between text-xs mb-1.5">
                                      <span className="text-muted-foreground inline-flex items-center gap-1.5">
                                        <Gauge className="size-3.5" /> Feasibility Score
                                      </span>
                                      <span className={`font-mono font-semibold ${scoreTone(item.aiReport.feasibilityScore)}`}>
                                        {item.aiReport.feasibilityScore}/100
                                      </span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
                                      <div
                                        className="h-full bg-gradient-to-r from-amber-500/70 to-emerald-500/80 transition-all"
                                        style={{ width: `${item.aiReport.feasibilityScore}%` }}
                                      />
                                    </div>
                                  </div>

                                  <p className="text-xs text-foreground leading-relaxed mb-3">
                                    {item.aiReport.summary}
                                  </p>

                                  {item.aiReport.risks.length > 0 && (
                                    <div>
                                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                                        Key Risks
                                      </p>
                                      <ul className="space-y-1.5">
                                        {item.aiReport.risks.map((risk, i) => (
                                          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-400/70" />
                                            {risk}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <p className="flex items-center gap-2 text-xs text-amber-400">
                                  <TriangleAlert className="size-4" />
                                  AI review pending — the assessor runs automatically after upload. If this
                                  persists, the AI service is unreachable; the submission itself is unaffected.
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-border/60 bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {filteredProblems.length} record(s)</span>
          <div className="flex items-center gap-1">
            <button className="p-1 rounded hover:bg-muted disabled:opacity-50" disabled>
              <ChevronLeft className="size-4" />
            </button>
            <button className="p-1 rounded hover:bg-muted disabled:opacity-50" disabled>
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Upload Solution Modal */}
      {modalOpen && selectedProblem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={handleCloseModal}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-border/80 bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-primary">{selectedProblem.sipId || selectedProblem.id}</p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">{selectedProblem.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {selectedProblem.district || selectedProblem.location} · {selectedProblem.category}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Proposal / prototype file
                </label>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border/80 bg-background/50 px-4 py-6 text-center hover:bg-muted/30">
                  <FileText className="size-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {solutionFile ? solutionFile.name : "Click to choose a file (PDF, DOC, ZIP, PPT)"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.zip,.ppt,.pptx"
                    className="hidden"
                    onChange={(e) => setSolutionFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Notes for the reviewing department
                </label>
                <textarea
                  value={solutionNotes}
                  onChange={(e) => setSolutionNotes(e.target.value)}
                  rows={3}
                  placeholder="Brief summary of the proposed solution or prototype status..."
                  className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={handleCloseModal}
                disabled={submitting}
                className="rounded-md px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitSolution}
                disabled={submitting || (!solutionFile && !solutionNotes)}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <UploadCloud className="size-3.5" />
                {submitting ? "Submitting..." : "Submit Solution"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team-Formation Modal — shown when a university claims a challenge */}
      {claimTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={handleCloseClaim}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-border/80 bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-primary">{claimTarget.sipId || claimTarget.id}</p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">{claimTarget.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {claimTarget.district || claimTarget.location} · {claimTarget.category}
                </p>
              </div>
              <button
                onClick={handleCloseClaim}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-xs font-medium text-muted-foreground">
                Form your project team — at least one member required
              </label>

              {teamLoading ? (
                <p className="rounded-md border border-dashed border-border/60 px-4 py-6 text-center text-xs text-muted-foreground">
                  Loading {userInstitution} roster...
                </p>
              ) : teamOptions.length === 0 ? (
                <p className="rounded-md border border-dashed border-border/60 px-4 py-6 text-center text-xs text-muted-foreground">
                  No registered members found for {userInstitution}.
                </p>
              ) : (
                <div className="space-y-2">
                  {teamOptions.map((m) => {
                    const checked = selectedTeamIds.includes(m.id)
                    const expanded = expandedMemberIds.has(m.id)
                    return (
                      <div key={m.id}>
                        <label
                          className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 transition-colors ${
                            checked
                              ? "border-primary/50 bg-primary/10"
                              : "border-border/60 bg-background/50 hover:bg-muted/30"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTeamMember(m.id)}
                            className="size-4 accent-primary"
                          />
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-medium text-foreground">{m.name}</span>
                            <span className="block text-[10px] text-muted-foreground">
                              {m.department}{m.year ? ` · ${m.year}` : ""}
                            </span>
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              m.role === "Professor"
                                ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            }`}
                          >
                            {m.role}
                          </span>
                          {/* Profile expand toggle — own onClick, never touches the checkbox */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              toggleMemberExpand(m.id)
                            }}
                            aria-label={expanded ? `Hide details for ${m.name}` : `Show details for ${m.name}`}
                            className="ml-0.5 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                          </button>
                        </label>

                        {/* Expandable detail panel — sibling of the row, so clicking it can't toggle the checkbox */}
                        {expanded && (
                          <div className="ml-8 mt-1.5 space-y-1.5 rounded-md border border-border/50 bg-background/40 px-3 py-2.5 text-xs text-muted-foreground">
                            {m.phone && (
                              <p className="flex items-center gap-2">
                                <Phone className="size-3 shrink-0" />
                                <span>{m.phone}</span>
                              </p>
                            )}
                            {m.email && (
                              <p className="flex items-center gap-2">
                                <Mail className="size-3 shrink-0" />
                                <span className="truncate">{m.email}</span>
                              </p>
                            )}
                            {m.linkedin && (
                              <p className="flex items-center gap-2">
                                <Globe className="size-3 shrink-0" />
                                <span>{m.linkedin}</span>
                              </p>
                            )}
                            {m.role === "Professor" && m.experience && (
                              <p className="flex items-center gap-2">
                                <Briefcase className="size-3 shrink-0" />
                                <span>{m.experience}</span>
                              </p>
                            )}
                            <div className="flex items-start gap-2">
                              <History className="mt-0.5 size-3 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                                  Past Projects
                                </p>
                                {m.pastProjects && m.pastProjects.length > 0 ? (
                                  <ul className="mt-1 space-y-1">
                                    {m.pastProjects.map((proj) => (
                                      <li key={proj} className="flex items-start gap-1.5">
                                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/60" />
                                        <span>{proj}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="mt-1 italic">No prior projects on record</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {claimError && (
                <p className="mt-3 text-xs text-rose-400">{claimError}</p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={handleCloseClaim}
                disabled={claiming}
                className="rounded-md px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClaim}
                disabled={claiming || selectedTeamIds.length === 0}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Users className="size-3.5" />
                {claiming ? "Claiming..." : "Claim & Form Team"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
