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
  Settings,
  LifeBuoy,
  Landmark,
  FileText,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"

// 1. Add roles array to every navigation item
const nav = [
  { label: "Overview", icon: LayoutDashboard, href: "/", roles: ["government"] },
  { label: "Challenges", icon: ListChecks, href: "/challenges", roles: ["government", "university"] },
  { label: "Submit Challenge", icon: PlusCircle, href: "/submit", roles: ["citizen"] },
  { label: "My Submissions", icon: FileText, href: "/my-submissions", roles: ["citizen"] },
  { label: "Universities", icon: GraduationCap, href: "/universities", roles: ["government"] },
  { label: "Industry Partners", icon: Factory, href: "/industry", roles: ["government"] },
  { label: "Regions", icon: MapPin, href: "/regions", roles: ["government"] },
  { label: "Reports", icon: BarChart3, href: "/reports", roles: ["government"] },
]

const secondary = [
  { label: "Settings", icon: Settings, href: "/settings", roles: ["government"] },
  { label: "Support", icon: LifeBuoy, href: "/support", roles: ["government", "university", "citizen"] },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  // 2. State to hold the current role, defaulting to government
  const [currentRole, setCurrentRole] = useState("government")
  const [mounted, setMounted] = useState(false)

  // 3. Read the role from localStorage when the sidebar loads or route changes
  useEffect(() => {
    setMounted(true)
    const savedRole = localStorage.getItem("userRole")
    if (savedRole) {
      setCurrentRole(savedRole)
    }
  }, [pathname]) // ADDED pathname HERE so it updates instantly on login

  // 4. Filter the links based on the current role
  const allowedNav = nav.filter(item => item.roles.includes(currentRole))
  const allowedSecondary = secondary.filter(item => item.roles.includes(currentRole))

  // 5. Logout — clears both localStorage AND the cookies middleware reads,
  //    then sends the user back to /login so they can pick a new role.
  const handleLogout = () => {
    localStorage.removeItem("userRole")
    localStorage.removeItem("userInstitution")

    document.cookie = "userRole=; path=/; max-age=0"
    document.cookie = "userInstitution=; path=/; max-age=0"

    router.push("/login")
  }

  // Prevent UI flickering during load
  if (!mounted) return null

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
        {allowedNav.map((item) => {
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

        {/* Only render System header if there are secondary links to show */}
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
            {currentRole === "government" ? "RM" : currentRole === "university" ? "DS" : "DC"}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium capitalize">
              {currentRole === "government" ? "R. Mehta" : currentRole === "university" ? "Dr. Sharma" : "Demo Citizen"}
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
