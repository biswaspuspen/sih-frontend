"use client"

import { useEffect, useState } from "react"
import { Search, Filter, AlertCircle, ArrowUpDown, ChevronLeft, ChevronRight, UploadCloud, X, FileText, CheckCircle2 } from "lucide-react"

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
}

// Tolerant date renderer — ledger rows use createdAt; older mock rows used submittedDate
function formatLoggedDate(p: Problem) {
  const raw = p.createdAt || p.submittedDate
  if (!raw) return "—"
  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function ChallengesPage() {
  const [role, setRole] = useState("government")
  const [mounted, setMounted] = useState(false)
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [categoryFilter, setCategoryFilter] = useState("All")

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedRole = localStorage.getItem("userRole")
    if (savedRole) {
      setRole(savedRole)
    }
  }, [])

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

  if (!mounted) return null

  const filteredProblems = problems.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sipId || p.id).toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "All" || p.status === statusFilter
    const matchesCategory = categoryFilter === "All" || p.category === categoryFilter
    const matchesRole = role === "university" ? p.institution === "BIT Mesra" : true

    return matchesSearch && matchesStatus && matchesCategory && matchesRole
  })

  const handleOpenModal = (id: string) => {
    setActiveChallengeId(id)
    setModalOpen(true)
    setUploadSuccess(false)
  }

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)

    // Simulate a network delay for uploading a PDF
    setTimeout(() => {
      setIsUploading(false)
      setUploadSuccess(true)

      // Close modal after showing success message
      setTimeout(() => {
        setModalOpen(false)
      }, 2000)
    }, 1500)
  }

  return (
    <div className="flex-1 px-6 py-8 lg:px-10 max-w-[1600px] mx-auto relative">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {role === "university" ? "University Node Assignments" : "Grievance Master Ledger"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {role === "university"
              ? "Review societal grievances assigned to BIT Mesra and upload research solutions."
              : "View, filter, and track all societal challenges moving through the state pipeline."}
          </p>
        </div>
      </div>

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
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 uppercase font-medium text-muted-foreground border-b border-border/60 text-xs">
              <tr>
                <th className="px-5 py-3 cursor-pointer hover:text-foreground flex items-center gap-1">Challenge ID <ArrowUpDown className="size-3" /></th>
                <th className="px-5 py-3">Description & Domain</th>
                <th className="px-5 py-3">District</th>
                <th className="px-5 py-3">Assigned Academic Node</th>
                <th className="px-5 py-3">Stage</th>
                <th className="px-5 py-3 text-right">Date Logged</th>
                {role === "university" && <th className="px-5 py-3 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">Syncing ledger with state database...</td></tr>
              ) : filteredProblems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <AlertCircle className="size-8 mb-3 opacity-50" />
                      <p>No challenges match your current filters.</p>
                      <button onClick={() => { setSearchTerm(""); setStatusFilter("All"); setCategoryFilter("All"); }} className="mt-2 text-primary hover:underline text-xs">Clear Filters</button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProblems.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors group cursor-pointer">
                    <td className="px-5 py-4 font-mono font-medium text-primary">
                      {item.sipId || item.id}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-foreground max-w-sm truncate">{item.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-medium text-muted-foreground">{item.category}</span>
                        {item.priority === "High" && (
                          <span className="text-[10px] font-semibold text-rose-400">High Priority</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground text-xs">
                      {item.district || item.location || "—"}
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-foreground/90">
                      {item.institution}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        item.status === "In Progress" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                        item.status === "Assigned" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                        item.status === "Resolved" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-muted-foreground text-xs">
                      {formatLoggedDate(item)}
                    </td>
                    {role === "university" && (
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleOpenModal(item.id)}
                          className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                        >
                          <UploadCloud className="size-3.5" />
                          Upload
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* UPLOAD MODAL OVERLAY */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-lg p-6">
            {uploadSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="size-12 text-emerald-500 mb-4" />
                <h2 className="text-xl font-bold">Proposal Submitted</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  The research solution for {activeChallengeId} has been sent to the State Grid for review.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold">Submit Research Proposal</h2>
                    <p className="text-xs font-mono text-muted-foreground mt-1">Target: {activeChallengeId}</p>
                  </div>
                  <button onClick={() => setModalOpen(false)} className="rounded-md p-1 hover:bg-muted text-muted-foreground">
                    <X className="size-5" />
                  </button>
                </div>

                <form onSubmit={handleUploadSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Lead Researcher</label>
                    <input required type="text" defaultValue="Dr. Sharma" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Estimated Budget Request (₹)</label>
                    <input required type="number" placeholder="e.g. 500000" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Upload PDF Proposal</label>
                    <div className="flex items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg bg-muted/20 hover:bg-muted/40 cursor-pointer">
                      <div className="flex flex-col items-center">
                        <FileText className="size-6 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">Click to upload document</span>
                      </div>
                      <input type="file" className="hidden" required />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={isUploading} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-70">
                      {isUploading ? "Encrypting & Sending..." : "Submit to State"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
