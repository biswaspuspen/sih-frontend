import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * RBAC middleware — Sahyog State Innovation Grid (SIH-2026-SR-04)
 * PLACEMENT: project root (next to package.json / app/), NOT inside app/.
 * A middleware.ts inside app/ is silently ignored by Next.js.
 * REQUIRES: login must set the userRole cookie (see snippets/auth-cookies.md).
 */

const VALID_ROLES = ["government", "university", "citizen", "admin", "industry"] as const
type Role = (typeof VALID_ROLES)[number]

const ROLE_HOME: Record<Role, string> = {
  government: "/",
  university: "/challenges",
  citizen: "/my-submissions",
  admin: "/",
  industry: "/industry",
}

// path prefix -> allowed roles (admin bypasses this table entirely — see rule 3)
const ROUTE_RULES: [string, Role[]][] = [
  ["/challenges", ["government", "university"]],
  ["/projects", ["university"]],        // My Projects = university claim history
  ["/industry", ["government", "industry"]], // gov: partner directory · industry: Solution Exchange
  ["/my-interests", ["industry"]],      // NEW: company's watchlist of adoptable solutions
  ["/regions", ["government"]],
  ["/reports", ["government"]],
  ["/analytics", ["government"]],
  ["/universities", ["government"]],
  ["/settings", ["government"]],
  ["/my-submissions", ["citizen"]],
  ["/submit", ["government", "university", "citizen"]],
  ["/support", ["government", "university", "citizen", "industry"]],
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const cookieRole = request.cookies.get("userRole")?.value
  // Rejects missing/garbage cookie values — also kills any redirect loop
  const role: Role | undefined = VALID_ROLES.includes(cookieRole as Role)
    ? (cookieRole as Role)
    : undefined

  // 1) Root = Command Center overview → government + admin
  if (pathname === "/") {
    if (!role) return NextResponse.redirect(new URL("/login", request.url))
    if (role !== "government" && role !== "admin")
      return NextResponse.redirect(new URL(ROLE_HOME[role], request.url))
    return NextResponse.next()
  }

  // 2) /login is public; logged-in users skip straight to their home
  if (pathname === "/login") {
    if (role) return NextResponse.redirect(new URL(ROLE_HOME[role], request.url))
    return NextResponse.next()
  }

  // 3) ADMIN BYPASS — ultimate authority: every remaining route is open to admin
  if (role === "admin") return NextResponse.next()

  // 4) Role-scoped sections
  for (const [prefix, allowed] of ROUTE_RULES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      if (!role) return NextResponse.redirect(new URL("/login", request.url))
      if (!allowed.includes(role))
        return NextResponse.redirect(new URL(ROLE_HOME[role], request.url))
      return NextResponse.next()
    }
  }

  // 5) Strict default: anything else requires a valid session
  if (!role) return NextResponse.redirect(new URL("/login", request.url))
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
