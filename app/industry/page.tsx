"use client"

import { useEffect, useState } from "react"
import { Factory, MapPin, Briefcase, TrendingUp, ShieldCheck, ArrowUpRight } from "lucide-react"

interface Industry {
  id: string
  name: string
  sector: string
  location: string
}

export default function IndustryPage() {
  const [industries, setIndustries] = useState<Industry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("http://localhost:5000/industry")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setIndustries(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to fetch industry data", err)
        setLoading(false)
      })
  }, [])

  return (
    <div className="flex-1 px-6 py-8 lg:px-10 max-w-6xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Public-Private Partnership (PPP)
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Industry & CSR Network
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Corporate partners, MSMEs, and startups providing mentorship, co-development, and funding.
          </p>
        </div>
        
        <button className="inline-flex items-center gap-2 rounded-md bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/80 border border-border/60">
          <Briefcase className="size-4" />
          Onboard New Partner
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-8 text-center text-sm text-muted-foreground border border-dashed rounded-xl border-border/60">
            Loading partner registry...
          </div>
        ) : industries.length === 0 ? (
          <div className="col-span-full p-8 text-center text-sm text-muted-foreground border border-dashed rounded-xl border-border/60">
            No industry partners found. Check backend connection.
          </div>
        ) : (
          industries.map((partner) => (
            <div key={partner.id} className="rounded-xl border border-border/80 bg-card/60 shadow-sm flex flex-col overflow-hidden hover:border-primary/30 transition-colors">
              <div className="p-5 border-b border-border/50 bg-muted/10">
                <div className="flex justify-between items-start mb-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Factory className="size-5" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="size-3" /> {partner.sector === "Technology" ? "Verified MSME" : "Verified CSR"}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground text-lg">{partner.name}</h3>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground font-medium">
                  <span className="flex items-center gap-1">
                    <Briefcase className="size-3" /> {partner.sector}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" /> {partner.location}
                  </span>
                </div>
              </div>
              
              <div className="p-5 space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded border border-border/60 bg-background/50 p-2">
                    <span className="text-muted-foreground block mb-1">Active Pilots</span>
                    <span className="font-mono text-foreground font-medium">{Math.floor(Math.random() * 5) + 2} Projects</span>
                  </div>
                  <div className="rounded border border-border/60 bg-background/50 p-2">
                    <span className="text-muted-foreground block mb-1">Funding Pool</span>
                    <span className="font-mono text-emerald-400 font-medium">₹{(Math.random() * 5 + 1).toFixed(1)} Cr</span>
                  </div>
                </div>
                
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-2">Mentored Domains</span>
                  <div className="flex flex-wrap gap-1.5">
                    {partner.sector === "Materials & Infrastructure" && (
                      <><span className="bg-muted px-2 py-1 rounded text-[10px]">Smart Materials</span><span className="bg-muted px-2 py-1 rounded text-[10px]">Urban Planning</span></>
                    )}
                    {partner.sector === "Manufacturing" && (
                      <><span className="bg-muted px-2 py-1 rounded text-[10px]">Industrial IoT</span><span className="bg-muted px-2 py-1 rounded text-[10px]">Supply Chain</span></>
                    )}
                    {partner.sector === "Energy & Environment" && (
                      <><span className="bg-muted px-2 py-1 rounded text-[10px]">Mine Reclamation</span><span className="bg-muted px-2 py-1 rounded text-[10px]">Mining Safety</span></>
                    )}
                    {partner.sector === "Technology" && (
                      <><span className="bg-muted px-2 py-1 rounded text-[10px]">Drone Mapping</span><span className="bg-muted px-2 py-1 rounded text-[10px]">Crop Telemetry</span></>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-3 border-t border-border/50 bg-muted/5 text-center">
                <button className="text-xs font-medium text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1">
                  View Co-Development Projects <ArrowUpRight className="size-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}