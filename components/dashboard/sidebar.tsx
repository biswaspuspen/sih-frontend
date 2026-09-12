"use client"
 
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  ListChecks,
  PlusCircle,
  GraduationCap,
  Factory,
  MapPin,
  BarChart3,
  PieChart,
  Settings,
  LifeBuoy,
  Landmark,
  FileText,
  FolderKanban,
  Handshake,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
 
// Admin no longer sees: Overview, My Interests, Submit Challenge, My Submissions
const nav = [
  { label: "Overview", icon: LayoutDashboard, href: "/", roles: ["government"] },
  { label: "Challenges", icon: ListChecks, href: "/challenges", roles: ["government", "university", "admin"] },
  { label: "Projects", icon: FolderKanban, href: "/projects", roles: ["university", "admin"] },
  { label: "My Interests", icon: Handshake, href: "/my-interests", roles: ["industry"] },
  { label: "Submit Challenge", icon: PlusCircle, href: "/submit", roles: ["citizen"] },
  { label: "My Submissions", icon: FileText, href: "/my-submissions", roles: ["citizen"] },
  { label: "Partnered Universities", icon: GraduationCap, href: "/universities", roles: ["government", "admin"] },
  { label: "Industry Partners", icon: Factory, href: "/industry", roles: ["government", "industry", "admin"] },
  { label: "Regions", icon: MapPin, href: "/regions", roles: ["government", "admin"] },
  { label: "Reports", icon: BarChart3, href: "/reports", roles: ["government", "admin"] },
  { label: "Analytics", icon: PieChart, href: "/analytics", roles: ["government", "admin"] },
]
 
const secondary = [
  { label: "Settings", icon: Settings, href: "/settings", roles: ["government", "admin"] },
  { label: "Support", icon: LifeBuoy, href: "/support", roles: ["government", "university", "citizen", "industry", "admin"] },
]
 
export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
 
  const [currentRole, setCurrentRole] = useState("government")
  const [mounted, setMounted] = useState(false)
 
  useEffect(() => {
    setMounted(true)
    const savedRole = localStorage.getItem("userRole")
    if (savedRole) {
      setCurrentRole(savedRole)
    }
  }, [pathname])
 
  const allowedNav = nav.filter(item => item.roles.includes(currentRole))
  const allowedSecondary = secondary.filter(item => item.roles.includes(currentRole))
 
  // Per-role labels: universities see the self-claim pool; industry sees the solution marketplace
  const displayNav = allowedNav.map((item) => {
    if (item.href === "/challenges" && currentRole === "university") {
      return { ...item, label: "Open Challenges" }
    }
    if (item.href === "/industry" && currentRole === "industry") {
      return { ...item, label: "Solution Exchange" }
    }
    return item
  })
 
  // Logout — clears both localStorage AND the cookies middleware reads
  const handleLogout = () => {
    localStorage.removeItem("userRole")
    localStorage.removeItem("userInstitution")
    localStorage.removeItem("userCompany")
 
    document.cookie = "userRole=; path=/; max-age=0"
    document.cookie = "userInstitution=; path=/; max-age=0"
 
    router.push("/login")
  }
 
  if (!mounted) return null
 
  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Landmark className="size-5" aria-hidden="true" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">SAHYOG</p>
          <p className="text-xs text-sidebar-foreground/60">State Command</p>
        </div>
      </div>
 
      <nav className="flex flex-1 flex-col gap-1 px-3 py-2" aria-label="Primary">
        <p className="px-3 pb-1 pt-3 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
          Menu
        </p>
        {displayNav.map((item) => {
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
 
        {allowedSecondary.length > 0 && (
          <>
            <p className="px-3 pb-1 pt-6 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
              System
            </p>
            {allowedSecondary.map((item) => {
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
          </>
        )}
      </nav>
 
      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-sidebar-accent text-sm font-semibold text-sidebar-accent-foreground">
            {currentRole === "government" ? "RM" : currentRole === "university" ? "DS" : currentRole === "admin" ? "SA" : currentRole === "industry" ? "TS" : "DC"}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium capitalize">
              {currentRole === "government" ? "R. Mehta" : currentRole === "university" ? "Dr. Sharma" : currentRole === "admin" ? "System Admin" : currentRole === "industry" ? "Tata Steel Ltd." : "Demo Citizen"}
            </p>
            <p className="text-xs text-sidebar-foreground/60 capitalize">
              {currentRole}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            title="Log out"
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  )
}