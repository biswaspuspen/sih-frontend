import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * RBAC middleware — Jharkhand State Innovation Grid (SIH-2026-SR-04)
 * PLACEMENT: project root (next to package.json / app/), NOT inside app/.
 * REQUIRES: login sets the userRole cookie (your updated login page does).
 * RESTART `npm run dev` after saving.
 */

const VALID_ROLES = ["government", "university", "citizen"] as const
type Role = (typeof VALID_ROLES)[number]

const ROLE_HOME: Record<Role, string> = {
  government: "/",
  university: "/challenges",
  citizen: "/my-submissions",
}

// path prefix -> allowed roles
const ROUTE_RULES: [string, Role[]][] = [
  ["/challenges", ["government", "university"]],
  ["/projects", ["university"]],        // My Projects = university claim history
  ["/regions", ["government"]],
  ["/reports", ["government"]],
  ["/industry", ["government"]],
  ["/universities", ["government"]],
  ["/settings", ["government"]],
  ["/my-submissions", ["citizen"]],
  ["/submit", ["government", "university", "citizen"]],
  ["/support", ["government", "university", "citizen"]],
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const cookieRole = request.cookies.get("userRole")?.value
  // Rejects missing/garbage cookie values — also kills any redirect loop
  const role: Role | undefined = VALID_ROLES.includes(cookieRole as Role)
    ? (cookieRole as Role)
    : undefined

  // 1) Root = Government Command Center → government only
  if (pathname === "/") {
    if (!role) return NextResponse.redirect(new URL("/login", request.url))
    if (role !== "government")
      return NextResponse.redirect(new URL(ROLE_HOME[role], request.url))
    return NextResponse.next()
  }

  // 2) /login is public; logged-in users skip straight to their home
  if (pathname === "/login") {
    if (role) return NextResponse.redirect(new URL(ROLE_HOME[role], request.url))
    return NextResponse.next()
  }

  // 3) Role-scoped sections
  for (const [prefix, allowed] of ROUTE_RULES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      if (!role) return NextResponse.redirect(new URL("/login", request.url))
      if (!allowed.includes(role))
        return NextResponse.redirect(new URL(ROLE_HOME[role], request.url))
      return NextResponse.next()
    }
  }

  // 4) Strict default: anything else requires a valid session
  if (!role) return NextResponse.redirect(new URL("/login", request.url))
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}