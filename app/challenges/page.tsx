"use client"

import { useEffect, useState } from "react"
import { Search, Filter, AlertCircle, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"

interface Problem {
  id: string
  title: string
  category: string
  location: string
  status: string
  submittedDate: string
  institution: string
  priority?: string
  confidence?: number
}

export default function ChallengesPage() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [categoryFilter, setCategoryFilter] = useState("All")

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

  // Filter logic
  const filteredProblems = problems.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "All" || p.status === statusFilter
    const matchesCategory = categoryFilter === "All" || p.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  return (
    <div className="flex-1 px-6 py-8 lg:px-10 max-w-[1600px] mx-auto">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Grievance Master Ledger
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View, filter, and track all societal challenges moving through the state pipeline.
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
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">Syncing ledger with state database...</td></tr>
              ) : filteredProblems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
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
                      {item.id}
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
                      {item.location}
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
                      {item.submittedDate}
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
            <button className="p-1 rounded hover:bg-muted disabled:opacity-50" disabled><ChevronLeft className="size-4" /></button>
            <button className="p-1 rounded hover:bg-muted disabled:opacity-50" disabled><ChevronRight className="size-4" /></button>
          </div>
        </div>
      </div>
    </div>
  )
}