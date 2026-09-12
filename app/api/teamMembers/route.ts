import { NextRequest, NextResponse } from "next/server"
import { readDb, matchesQuery } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  try {
    const db = await readDb()
    const params = new URL(req.url).searchParams
    return NextResponse.json((db.teamMembers ?? []).filter((m) => matchesQuery(m, params)))
  } catch (err) {
    console.error("[/api/teamMembers GET]", err)
    return NextResponse.json({ error: "failed to read teamMembers" }, { status: 500 })
  }
}