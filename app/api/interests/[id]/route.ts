import { NextRequest, NextResponse } from "next/server"
import { readDb, writeDb } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const db = await readDb()
    const found = (db.interests ?? []).find((i) => String(i.id) === String(id))
    if (!found) return NextResponse.json({}, { status: 404 })
    return NextResponse.json(found)
  } catch (err) {
    console.error("[/api/interests/[id] GET]", err)
    return NextResponse.json({ error: "failed to read interest" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const db = await readDb()
    const items = Array.isArray(db.interests) ? db.interests : []
    const idx = items.findIndex((i) => String(i.id) === String(id))
    if (idx === -1) return NextResponse.json({}, { status: 404 })
    items.splice(idx, 1)
    await writeDb(db)
    return NextResponse.json({})
  } catch (err) {
    console.error("[/api/interests/[id] DELETE]", err)
    return NextResponse.json({ error: "failed to delete interest" }, { status: 500 })
  }
}