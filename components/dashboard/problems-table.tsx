"use client"

import { useEffect, useState } from "react"
import { MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

// 1. Define the types based on your json-server data structure
type ProblemStatus = "Resolved" | "In Progress" | "Under Review" | "New"

interface Problem {
  id: string
  title: string
  category: string
  location: string
  status: ProblemStatus
  submittedDate: string
  institution: string
}

const statusStyles: Record<ProblemStatus, string> = {
  Resolved: "bg-chart-4/15 text-chart-4",
  "In Progress": "bg-chart-2/15 text-chart-2",
  "Under Review": "bg-chart-5/20 text-chart-5",
  New: "bg-primary/10 text-primary",
}

function StatusBadge({ status }: { status: ProblemStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        statusStyles[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
  )
}

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })

export function ProblemsTable() {
  // 2. Set up React State to hold your backend data
  const [problems, setProblems] = useState<Problem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 3. Fetch the data from json-server when the component loads
  useEffect(() => {
    fetch("/api/problems")
      .then((res) => res.json())
      .then((data) => {
        setProblems(data)
        setIsLoading(false)
      })
      .catch((error) => {
        console.error("Error fetching data:", error)
        setIsLoading(false)
      })
  }, [])

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-card-foreground">Latest Submitted Problems</h2>
          <p className="text-sm text-muted-foreground">Most recent challenges across the portal</p>
        </div>
        <button
          type="button"
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          View all
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3 font-medium">Problem</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Location</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 text-right font-medium">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {/* 4. Display a loading message or map through the live data */}
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                  Loading database records...
                </td>
              </tr>
            ) : (
              problems.map((p) => (
                <tr key={p.id} className="border-b border-border/60 last:border-0 hover:bg-muted/50">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-card-foreground">{p.title}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {p.id} · {p.institution}
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                      {p.location}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-muted-foreground">
                    {dateFmt.format(new Date(p.submittedDate))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}