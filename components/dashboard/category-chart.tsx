"use client"

import { useEffect, useState } from "react"
import { BarChart3 } from "lucide-react"

const chartColors = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
]

interface CategoryData {
  category: string
  count: number
}

export function CategoryChart() {
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch("http://localhost:5000/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data)
        } else {
          setCategories([])
        }
        setIsLoading(false)
      })
      .catch(() => {
        setCategories([])
        setIsLoading(false)
      })
  }, [])

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-sm">
        <p className="text-xs font-mono text-muted-foreground">Loading domain telemetry...</p>
      </div>
    )
  }

  const safeCategories = Array.isArray(categories) ? categories : []
  const max = Math.max(...safeCategories.map((d) => d.count), 1)
  const total = safeCategories.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-sm">
      <div className="flex items-start justify-between pb-3 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-card-foreground">Societal Problem Taxonomy</h2>
            <span className="rounded bg-primary/10 px-1.5 py-0.2 text-[10px] font-mono text-primary">NLP Tagged</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Distribution across primary governance domains</p>
        </div>
        <span className="font-mono text-xs font-medium text-foreground bg-muted px-2 py-1 rounded">
          {total.toLocaleString()} logged
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {safeCategories.map((d, i) => {
          const pct = Math.round((d.count / max) * 100)
          const share = total > 0 ? Math.round((d.count / total) * 100) : 0
          return (
            <div key={d.category} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground/90">{d.category}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-muted-foreground">{d.count} units</span>
                  <span className="font-mono text-[11px] text-muted-foreground/60 w-8 text-right">{share}%</span>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: chartColors[i % chartColors.length] }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}