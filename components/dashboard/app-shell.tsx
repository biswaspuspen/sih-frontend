"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Topbar } from "@/components/dashboard/topbar"

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // auth pages render bare — no sidebar, no topbar
  const isAuthPage = pathname === "/login"

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}