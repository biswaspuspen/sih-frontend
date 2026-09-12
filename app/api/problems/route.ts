// app/api/problems/route.ts
// GET    /api/problems          → list (+ exact-match filters, e.g. ?institution=BIT%20Mesra)
// POST   /api/problems          → create (server assigns incremental id; sipId stays the display id)

import { NextRequest, NextResponse } from "next/server"
import { readDb, writeDb, nextId, matchesQuery } from "@/lib/db"

// Guarantee this runs per-request on Node (fs), never prerendered at build time
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  try {
    const db = await readDb()
    const url = new URL(req.url)
    const items = (Array.isArray(db.problems) ? db.problems : []).filter((p) =>
      matchesQuery(p, url.searchParams)
    )
    return NextResponse.json(items)
  } catch (err) {
    console.error("[/api/problems GET]", err)
    return NextResponse.json({ error: "failed to read problems" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const db = await readDb()
    if (!Array.isArray(db.problems)) db.problems = []
    // Server id ALWAYS wins — even if the client sent one (mirrors the old json-server behavior).
    // The friend-page submits sipId (SIP-1008…); that field passes through untouched.
    const record = { ...(body as Record<string, unknown>), id: nextId(db.problems) }
    db.problems.push(record)
    await writeDb(db)
    return NextResponse.json(record, { status: 201 })
  } catch (err) {
    console.error("[/api/problems POST]", err)
    return NextResponse.json({ error: "failed to create problem" }, { status: 500 })
  }
}