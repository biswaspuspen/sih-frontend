"use client"

import { useEffect, useState } from "react"
import { GraduationCap, MapPin, BookOpen, ArrowUpRight, CheckCircle2, Activity } from "lucide-react"

interface University {
  id: string
  name: string
  location: string
  focus: string
}

export default function UniversitiesPage() {
  const [universities, setUniversities] = useState<University[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("http://localhost:5000/universities")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUniversities(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to fetch universities", err)
        setLoading(false)
      })
  }, [])

  return (
    <div className="flex-1 px-6 py-8 lg:px-10 max-w-6xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Academic R&D Network
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            University & Incubation Nodes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Partner institutions assigned to research, prototype, and resolve societal challenges.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-8 text-center text-sm text-muted-foreground border border-dashed rounded-xl border-border/60">
            Syncing academic registry...
          </div>
        ) : universities.length === 0 ? (
          <div className="col-span-full p-8 text-center text-sm text-muted-foreground border border-dashed rounded-xl border-border/60">
            No academic nodes found. Check backend connection.
          </div>
        ) : (
          universities.map((uni) => (
            <div key={uni.id} className="rounded-xl border border-border/80 bg-card/60 shadow-sm flex flex-col overflow-hidden hover:border-primary/30 transition-colors">
              <div className="p-5 border-b border-border/50 bg-muted/10">
                <div className="flex justify-between items-start mb-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <GraduationCap className="size-5" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-400 border border-purple-500/20">
                    <CheckCircle2 className="size-3" /> Verified Node
                  </span>
                </div>
                <h3 className="font-semibold text-foreground text-lg">{uni.name}</h3>
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground font-medium">
                  <MapPin className="size-3" /> {uni.location}, Jharkhand
                </div>
              </div>
              
              <div className="p-5 space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded border border-border/60 bg-background/50 p-2">
                    <span className="text-muted-foreground block mb-1">Assigned Problems</span>
                    <span className="font-mono text-foreground font-medium flex items-center gap-1.5">
                      <Activity className="size-3 text-amber-500" />
                      {Math.floor(Math.random() * 15) + 5} Active
                    </span>
                  </div>
                  <div className="rounded border border-border/60 bg-background/50 p-2">
                    <span className="text-muted-foreground block mb-1">Resolution Rate</span>
                    <span className="font-mono text-emerald-400 font-medium">{Math.floor(Math.random() * 30) + 60}%</span>
                  </div>
                </div>
                
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                    <BookOpen className="size-3" /> Specialization Vectors
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {uni.focus.split(", ").map((topic, idx) => (
                      <span key={idx} className="bg-muted px-2 py-1 rounded text-[10px] text-foreground/80 font-medium">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-3 border-t border-border/50 bg-muted/5 text-center">
                <button className="text-xs font-medium text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1">
                  View Lab Projects <ArrowUpRight className="size-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}