"use client"

import { MapPin, AlertCircle, Building, Activity, ShieldAlert } from "lucide-react"

const DIVISIONS = [
  {
    name: "North Chotanagpur",
    districts: "Bokaro, Dhanbad, Giridih, Hazaribagh, Chatra, Koderma, Ramgarh",
    activeChallenges: 412,
    nodalCenter: "IIT (ISM) Dhanbad",
    status: "High Alert",
    primaryIssue: "Mining & Industrial Pollution"
  },
  {
    name: "South Chotanagpur",
    districts: "Ranchi, Gumla, Khunti, Lohardaga, Simdega",
    activeChallenges: 385,
    nodalCenter: "BIT Mesra",
    status: "Monitoring",
    primaryIssue: "Urban Infra & Rural Agriculture"
  },
  {
    name: "Santhal Pargana",
    districts: "Dumka, Deoghar, Godda, Jamtara, Pakur, Sahibganj",
    activeChallenges: 290,
    nodalCenter: "Dumka Engineering College",
    status: "High Alert",
    primaryIssue: "Healthcare & Clean Water Access"
  },
  {
    name: "Kolhan",
    districts: "East Singhbhum, West Singhbhum, Saraikela Kharsawan",
    activeChallenges: 215,
    nodalCenter: "NIT Jamshedpur",
    status: "Stable",
    primaryIssue: "Industrial Supply Chain"
  },
  {
    name: "Palamu",
    districts: "Palamu, Garhwa, Latehar",
    activeChallenges: 184,
    nodalCenter: "Nilamber Pitamber University",
    status: "Monitoring",
    primaryIssue: "Drought & Water Conservation"
  }
]

export default function RegionsPage() {
  return (
    <div className="flex-1 px-6 py-8 lg:px-10 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
            Geospatial Telemetry
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Jharkhand Administrative Divisions
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track societal grievances across all 5 divisions and 24 districts, routed to regional academic nodes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DIVISIONS.map((division) => (
          <div key={division.name} className="rounded-xl border border-border/80 bg-card/60 shadow-sm overflow-hidden flex flex-col hover:border-primary/40 transition-colors">
            <div className="p-5 border-b border-border/50 bg-muted/10">
              <div className="flex justify-between items-start mb-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <MapPin className="size-5" />
                </div>
                {division.status === "High Alert" ? (
                  <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-400 border border-rose-500/20">
                    <ShieldAlert className="size-3" /> {division.status}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                    <Activity className="size-3" /> {division.status}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-foreground text-lg">{division.name}</h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {division.districts}
              </p>
            </div>
            
            <div className="p-5 space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded border border-border/60 bg-background/50 p-2.5">
                  <span className="text-muted-foreground block mb-1">Active Issues</span>
                  <span className="font-mono text-foreground font-medium text-sm">{division.activeChallenges}</span>
                </div>
                <div className="rounded border border-border/60 bg-background/50 p-2.5">
                  <span className="text-muted-foreground block mb-1">Resolution Rate</span>
                  <span className="font-mono text-emerald-400 font-medium text-sm">{Math.floor(Math.random() * 20 + 50)}%</span>
                </div>
              </div>
              
              <div className="space-y-3 pt-2">
                <div>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Primary Concern</span>
                  <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                    <AlertCircle className="size-3.5 text-amber-500" />
                    {division.primaryIssue}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Academic Nodal Center</span>
                  <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                    <Building className="size-3.5 text-primary" />
                    {division.nodalCenter}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}