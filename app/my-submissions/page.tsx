"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FileText, Clock, CheckCircle2, PlusCircle, Cpu, ArrowRight, Building2 } from "lucide-react"

interface Problem {
  id: string
  sipId?: string
  title: string
  category: string
  location: string
  status: string
  submittedDate: string
  submittedBy?: string
}

export default function MySubmissionsPage() {
  const [submissions, setSubmissions] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("http://localhost:5000/problems")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Strictly filter the array to only match this specific citizen's records
          const myChallenges = data.filter((p: any) => p.submittedBy === "Demo Citizen")
          
          // Reverse to show newest first based on submittedDate or ID
          setSubmissions(myChallenges.reverse())
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to fetch submissions", err)
        setLoading(false)
      })
  }, [])

  // Helper to determine active step in the UI pipeline
  const getProgressStep = (status: string) => {
    switch (status) {
      case "New": return 1
      case "Under Review": return 1
      case "AI Triaged": return 2
      case "Assigned": return 3
      case "In Progress": return 3
      case "Resolved": return 4
      default: return 1
    }
  }

  return (
    <div className="flex-1 px-6 py-8 lg:px-10 max-w-[1200px] mx-auto">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-border/70 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Submissions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track the status of the societal challenges you have reported to the State Grid.
          </p>
        </div>
        <Link 
          href="/submit" 
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          <PlusCircle className="size-4" />
          New Challenge
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Clock className="size-8 mb-4 animate-pulse opacity-50" />
          <p>Loading your submission history...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="rounded-xl border border-border/80 bg-card/60 p-12 text-center shadow-sm">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted mb-4">
            <FileText className="size-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No submissions found</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            You haven't reported any challenges yet. Submit a new grievance to initiate the AI triage pipeline.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((item) => {
            const step = getProgressStep(item.status)
            
            return (
              <div key={item.id} className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-sm transition-all hover:shadow-md">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-xs font-bold text-primary">{item.sipId || item.id}</span>
                      <span className="text-[10px] text-muted-foreground">• {item.submittedDate || "Recent"}</span>
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1">{item.title}</h3>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="bg-muted px-2 py-0.5 rounded text-muted-foreground font-medium">{item.category}</span>
                      <span className="text-muted-foreground">{item.location}</span>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${
                      item.status === "Resolved" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                      item.status === "In Progress" || item.status === "Assigned" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                      item.status === "AI Triaged" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                      "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {item.status === "Resolved" ? <CheckCircle2 className="size-3.5" /> : <Clock className="size-3.5" />}
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* Pipeline Tracker */}
                <div className="mt-6 pt-4 border-t border-border/50">
                  <div className="relative flex items-center justify-between w-full max-w-2xl text-[10px] sm:text-xs font-medium">
                    {/* Connecting Line */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-muted -z-10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-500" 
                        style={{ width: `${((step - 1) / 3) * 100}%` }}
                      />
                    </div>

                    {/* Step 1 */}
                    <div className="flex flex-col items-center gap-1.5 bg-card/60 px-2">
                      <div className={`flex size-6 items-center justify-center rounded-full border-2 ${step >= 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted bg-background text-muted-foreground'}`}>
                        1
                      </div>
                      <span className={step >= 1 ? 'text-foreground' : 'text-muted-foreground'}>Logged</span>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col items-center gap-1.5 bg-card/60 px-2">
                      <div className={`flex size-6 items-center justify-center rounded-full border-2 ${step >= 2 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted bg-background text-muted-foreground'}`}>
                        <Cpu className="size-3" />
                      </div>
                      <span className={step >= 2 ? 'text-foreground' : 'text-muted-foreground'}>AI Triage</span>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col items-center gap-1.5 bg-card/60 px-2">
                      <div className={`flex size-6 items-center justify-center rounded-full border-2 ${step >= 3 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted bg-background text-muted-foreground'}`}>
                        <Building2 className="size-3" />
                      </div>
                      <span className={step >= 3 ? 'text-foreground' : 'text-muted-foreground'}>Lab Assigned</span>
                    </div>

                    {/* Step 4 */}
                    <div className="flex flex-col items-center gap-1.5 bg-card/60 px-2">
                      <div className={`flex size-6 items-center justify-center rounded-full border-2 ${step >= 4 ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-muted bg-background text-muted-foreground'}`}>
                        <CheckCircle2 className="size-3" />
                      </div>
                      <span className={step >= 4 ? 'text-emerald-500' : 'text-muted-foreground'}>Resolved</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}