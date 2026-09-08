"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ListChecks,
  PlusCircle,
  GraduationCap,
  Factory,
  MapPin,
  BarChart3,
  Settings,
  LifeBuoy,
  Landmark,
} from "lucide-react"
import { cn } from "@/lib/utils"

const nav = [
  { label: "Overview", icon: LayoutDashboard, href: "/" },
  { label: "Challenges", icon: ListChecks, href: "/challenges" },
  { label: "Submit Challenge", icon: PlusCircle, href: "/submit" },
  { label: "Universities", icon: GraduationCap, href: "/universities" },
  { label: "Industry Partners", icon: Factory, href: "/industry" },
  { label: "Regions", icon: MapPin, href: "/regions" },
  { label: "Reports", icon: BarChart3, href: "/reports" },
]

const secondary = [
  { label: "Settings", icon: Settings, href: "/settings" },
  { label: "Support", icon: LifeBuoy, href: "/support" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Landmark className="size-5" aria-hidden="true" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Jharkhand Grid</p>
          <p className="text-xs text-sidebar-foreground/60">State Command</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2" aria-label="Primary">
        <p className="px-3 pb-1 pt-3 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
          Menu
        </p>
        {nav.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4.5" aria-hidden="true" />
              {item.label}
            </Link>
          )
        })}

        <p className="px-3 pb-1 pt-6 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
          System
        </p>
        {secondary.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4.5" aria-hidden="true" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-sidebar-accent text-sm font-semibold text-sidebar-accent-foreground">
            RM
          </div>
          <div className="leading-tight">
            <p className="text-sm font-medium">R. Mehta</p>
            <p className="text-xs text-sidebar-foreground/60">Policy Analyst</p>
          </div>
        </div>
      </div>
    </aside>
  )
}