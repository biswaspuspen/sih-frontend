// app/api/problems/[id]/route.ts
// GET    /api/problems/1   → single record (used by the claim dialog's freshness re-check)
// PATCH  /api/problems/1   → partial merge; returns updated record (claim / progress / resolve / upload)
// DELETE /api/problems/1   → admin removal

import { NextRequest, NextResponse } from "next/server"
import { readDb, writeDb } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Next.js 15+ App Router: dynamic segment params arrive as a Promise — must be awaited
type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const db = await readDb()
    const found = (Array.isArray(db.problems) ? db.problems : []).find(
      (p) => String((p as Record<string, unknown>).id) === String(id)
    )
    if (!found) return NextResponse.json({}, { status: 404 })
    return NextResponse.json(found)
  } catch (err) {
    console.error("[/api/problems/[id] GET]", err)
    return NextResponse.json({ error: "failed to read problem" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const { id: _ignoredClientId, ...patch } = body // the record key can never be edited
    const db = await readDb()
    if (!Array.isArray(db.problems)) db.problems = []
    const idx = db.problems.findIndex(
      (p) => String((p as Record<string, unknown>).id) === String(id)
    )
    if (idx === -1) return NextResponse.json({}, { status: 404 })
    db.problems[idx] = { ...db.problems[idx], ...patch }
    await writeDb(db)
    return NextResponse.json(db.problems[idx])
  } catch (err) {
    console.error("[/api/problems/[id] PATCH]", err)
    return NextResponse.json({ error: "failed to update problem" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const db = await readDb()
    const items = Array.isArray(db.problems) ? db.problems : []
    const idx = items.findIndex(
      (p) => String((p as Record<string, unknown>).id) === String(id)
    )
    if (idx === -1) return NextResponse.json({}, { status: 404 })
    items.splice(idx, 1)
    await writeDb(db)
    return NextResponse.json({})
  } catch (err) {
    console.error("[/api/problems/[id] DELETE]", err)
    return NextResponse.json({ error: "failed to delete problem" }, { status: 500 })
  }
}