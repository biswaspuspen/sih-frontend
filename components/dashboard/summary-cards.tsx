"use client"

import { useEffect, useState } from "react"
import { ClipboardList, CircleCheckBig, GraduationCap, TrendingUp } from "lucide-react"

// 1. Define the shape of your backend stats data
interface Stats {
  totalChallenges: number
  resolved: number
  universitiesInvolved: number
}

export function SummaryCards() {
  // 2. Set up React State to hold your backend data
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 3. Fetch the data from json-server when the component loads
  useEffect(() => {
    fetch("http://localhost:5000/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data)
        setIsLoading(false)
      })
      .catch((error) => {
        console.error("Error fetching stats:", error)
        setIsLoading(false)
      })
  }, [])

  if (isLoading || !stats) {
    return (
      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm text-sm text-muted-foreground">
          Loading metrics...
        </div>
      </section>
    )
  }

  // Calculate live resolution rate based on the database numbers
  const resolutionRate = Math.round((stats.resolved / stats.totalChallenges) * 100)

  // 4. Map the fetched data to your cards array
  const cards = [
    {
      label: "Total Challenges",
      value: stats.totalChallenges.toLocaleString(),
      delta: `+12.4%`,
      hint: "vs. last quarter",
      icon: ClipboardList,
    },
    {
      label: "Resolved",
      value: stats.resolved.toLocaleString(),
      delta: `${resolutionRate}% rate`,
      hint: `+8.1% this month`,
      icon: CircleCheckBig,
    },
    {
      label: "Universities Involved",
      value: stats.universitiesInvolved.toLocaleString(),
      delta: `+4 new`,
      hint: "collaborating institutions",
      icon: GraduationCap,
    },
  ]

  return (
    <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div key={card.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                <TrendingUp className="size-3" aria-hidden="true" />
                {card.delta}
              </span>
            </div>
            <p className="mt-4 text-sm font-medium text-muted-foreground">{card.label}</p>
            <p className="mt-1 font-mono text-3xl font-semibold tracking-tight text-card-foreground">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
          </div>
        )
      })}
    </section>
  )
}