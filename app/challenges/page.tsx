"use client"

import { useEffect, useState } from "react"
import { Search, Filter, AlertCircle, ArrowUpDown, ChevronLeft, ChevronRight, UploadCloud, X, FileText, CheckCircle2 } from "lucide-react"

interface Problem {
  id: string
  sipId?: string
  title: string
  category: string
  location: string
  status: string
  submittedDate: string
  institution: string
  priority?: string
  confidence?: number
  solutionFileName?: string
  solutionNotes?: string
  solutionSubmittedAt?: string
  submittedBy?: string
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

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null)
  const [solutionFile, setSolutionFile] = useState<File | null>(null)
  const [solutionNotes, setSolutionNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // 1. Get User Role + Institution
  useEffect(() => {
    setMounted(true)
    const savedRole = localStorage.getItem("userRole")
    if (savedRole) setRole(savedRole)

    const savedInstitution = localStorage.getItem("userInstitution")
    if (savedInstitution) setUserInstitution(savedInstitution)
  }, [])

  // 2. Fetch Data from your db.json
  useEffect(() => {
    fetch("http://localhost:5000/problems")
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

    const matchesRole =
      role === "university"
        ? p.institution?.trim().toLowerCase() === userInstitution.trim().toLowerCase()
        : true

    return matchesSearch && matchesStatus && matchesCategory && matchesRole
  })

  // MODIFIED: both roles now have an Action column
  const columnCount = 7

  // 4. Modal handlers
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
      const res = await fetch(`http://localhost:5000/problems/${selectedProblem.id}`, {
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
    } catch (err) {
      console.error("Failed to submit solution", err)
      alert("Couldn't submit the solution — check that json-server is running on :5000.")
    } finally {
      setSubmitting(false)
    }
  }

  // NEW: Government assigns an unassigned challenge to a university R&D node
  async function handleAssign(id: string, institutionName: string) {
    try {
      const res = await fetch(`http://localhost:5000/problems/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ institution: institutionName, status: "Assigned" }),
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const updated = await res.json()
      setProblems((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))
    } catch (err) {
      console.error("Assign failed", err)
      alert("Couldn't assign — check that json-server is running on :5000.")
    }
  }

  // NEW: Government marks a challenge resolved after the university uploads a solution
  async function handleResolve(id: string) {
    try {
      const res = await fetch(`http://localhost:5000/problems/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Resolved" }),
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const updated = await res.json()
      setProblems((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))
    } catch (err) {
      console.error("Resolve failed", err)
      alert("Couldn't mark resolved — check json-server.")
    }
  }

  return (
    <div className="flex-1 px-6 py-8 lg:px-10 max-w-[1600px] mx-auto">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {role === "university" ? "University Node Assignments" : "Grievance Master Ledger"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {role === "university"
              ? `Review societal grievances assigned to ${userInstitution} and upload research solutions.`
              : "View, filter, and track all societal challenges moving through the state pipeline."}
          </p>
        </div>
      </div>

      {/* University Metrics Strip */}
      {role === "university" && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Assigned</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{filteredProblems.length}</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active R&D</p>
            <p className="mt-2 text-3xl font-bold text-blue-500">
              {filteredProblems.filter((p) => p.status === "In Progress" || p.status === "Assigned").length}
            </p>
          </div>
          <div className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resolved</p>
            <p className="mt-2 text-3xl font-bold text-emerald-500">
              {filteredProblems.filter((p) => p.status === "Resolved").length}
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
                <option value="Environment">Environment</option>
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
              {/* NEW: Resolved was missing from the filter */}
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
                {/* MODIFIED: Action column for both roles now */}
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
                filteredProblems.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
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
                        {/* NEW: shows the uploaded proposal filename as proof of persistence */}
                        {item.solutionFileName && (
                          <span className="text-[10px] font-medium text-emerald-400/90">
                            📎 {item.solutionFileName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground text-xs">{item.location}</td>
                    <td className="px-5 py-4 text-xs font-medium text-foreground/90">{item.institution}</td>
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
                      {item.submittedDate}
                    </td>
                    {/* MODIFIED: role-aware actions for both roles */}
                    <td className="px-5 py-4 text-right">
                      {role === "university" ? (
                        <button
                          onClick={() => handleOpenModal(item.id)}
                          className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                        >
                          <UploadCloud className="size-3.5" />
                          {item.solutionFileName ? "Update" : "Upload"}
                        </button>
                      ) : item.institution === "Unassigned" ? (
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) handleAssign(item.id, e.target.value)
                          }}
                          className="rounded-md border border-input bg-background/50 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <option value="">Assign node…</option>
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
                    </td>
                  </tr>
                ))
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
                  {selectedProblem.location} · {selectedProblem.category}
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
    </div>
  )
}